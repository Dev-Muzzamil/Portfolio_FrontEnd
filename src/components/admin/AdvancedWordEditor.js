import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Editor } from '@tinymce/tinymce-react';
import { 
  X, 
  Save, 
  Download, 
  FileDown, 
  Undo,
  Redo,
  Type,
  Palette
} from 'lucide-react';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const AdvancedWordEditor = ({ resume, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const editorRef = useRef(null);

  useEffect(() => {
    loadDocument();
  }, [resume]);

  const loadDocument = async () => {
    if (!resume.url) return;

    setIsLoading(true);
    try {
      const response = await fetch(resume.url);
      const arrayBuffer = await response.arrayBuffer();
      
      if (resume.mimeType.includes('word') || resume.mimeType.includes('document')) {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setContent(result.value);
        setOriginalContent(result.value);
        setHistory([result.value]);
        setHistoryIndex(0);
      } else {
        // For other file types, show a simple text editor
        const text = await response.text();
        setContent(`<div>${text}</div>`);
        setOriginalContent(`<div>${text}</div>`);
        setHistory([`<div>${text}</div>`]);
        setHistoryIndex(0);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Failed to load document');
      setContent('<div>Failed to load document. Please try again.</div>');
    } finally {
      setIsLoading(false);
    }
  };

  const saveToHistory = (newContent) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    if (historyIndex === history.length - 1) {
      saveToHistory(newContent);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setContent(history[historyIndex + 1]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert HTML to Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: convertHtmlToDocx(content)
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      // Create proper filename
      const fileName = `${resume.title}_edited_${new Date().toISOString().split('T')[0]}.docx`;
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Get the editor content as HTML
      const editorContent = editorRef.current?.getContent();
      if (!editorContent) {
        toast.error('No content to export');
        return;
      }

      // Create a temporary div with the content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editorContent;
      tempDiv.style.width = '210mm';
      tempDiv.style.padding = '20mm';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794, // A4 width in pixels at 96 DPI
        height: tempDiv.scrollHeight
      });
      
      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Create proper filename
      const fileName = `${resume.title}_edited_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const convertHtmlToDocx = (html) => {
    // Improved HTML to DOCX conversion
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const paragraphs = [];
    const elements = tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, br');
    
    elements.forEach(element => {
      if (element.textContent.trim() || element.tagName === 'BR') {
        if (element.tagName === 'BR') {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
          return;
        }

        const isHeading = element.tagName.match(/^H[1-6]$/);
        const textRuns = [];
        
        // Handle multiple text runs with different formatting
        const processNode = (node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
              textRuns.push(new TextRun({ text }));
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            const text = node.textContent.trim();
            
            if (text) {
              let textRun = new TextRun({ text });
              
              if (tagName === 'b' || tagName === 'strong') {
                textRun.bold = true;
              } else if (tagName === 'i' || tagName === 'em') {
                textRun.italics = true;
              } else if (tagName === 'u') {
                textRun.underline = {};
              }
              
              textRuns.push(textRun);
            }
          }
        };
        
        // Process child nodes
        Array.from(element.childNodes).forEach(processNode);
        
        // If no text runs found, use the element's text content
        if (textRuns.length === 0 && element.textContent.trim()) {
          textRuns.push(new TextRun({ text: element.textContent.trim() }));
        }
        
        if (textRuns.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: textRuns,
              heading: isHeading ? HeadingLevel[`HEADING_${element.tagName[1]}`] : undefined,
              alignment: element.style.textAlign === 'center' ? AlignmentType.CENTER : 
                        element.style.textAlign === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT
            })
          );
        }
      }
    });

    return paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [new TextRun({ text: 'Empty document' })] })];
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      >
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p>Loading document...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-[95vw] h-[95vh] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">Professional Resume Editor</h2>
            <span className="text-sm text-gray-500">{resume.title}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isSaving ? (
                <div className="loading-spinner w-4 h-4"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Word'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 p-6 overflow-hidden">
          <Editor
            onInit={(evt, editor) => editorRef.current = editor}
            value={content}
            onEditorChange={(newContent) => handleContentChange(newContent)}
            init={{
              height: '100%',
              menubar: false,
              plugins: [
                // Core editing features
                'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
                // Premium features (14-day free trial)
                'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'advtemplate', 'ai', 'uploadcare', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown', 'importword', 'exportword', 'exportpdf'
              ],
              toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
              content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; }',
              branding: false,
              statusbar: false,
              resize: false,
              api_key: process.env.REACT_APP_TINYMCE_API_KEY,
              tinycomments_mode: 'embedded',
              tinycomments_author: 'Resume Editor',
              mergetags_list: [
                { value: 'First.Name', title: 'First Name' },
                { value: 'Last.Name', title: 'Last Name' },
                { value: 'Email', title: 'Email' },
                { value: 'Phone', title: 'Phone' },
                { value: 'Address', title: 'Address' }
              ],
              ai_request: (request, respondWith) => respondWith.string(() => Promise.reject('AI Assistant not implemented')),
              uploadcare_public_key: '5835c197aabba5d0c62d',
              paste_data_images: true,
              paste_as_text: false,
              paste_auto_cleanup_on_paste: true,
              paste_remove_styles_if_webkit: false,
              paste_merge_formats: true,
              paste_convert_word_fake_lists: true,
              paste_webkit_styles: "all",
              paste_retain_style_properties: "color font-size font-family background-color",
              setup: function (editor) {
                editor.on('keydown', function (e) {
                  // Handle Ctrl+Z for undo
                  if (e.ctrlKey && e.keyCode === 90 && !e.shiftKey) {
                    e.preventDefault();
                    handleUndo();
                  }
                  // Handle Ctrl+Y for redo
                  if (e.ctrlKey && e.keyCode === 89) {
                    e.preventDefault();
                    handleRedo();
                  }
                });
              }
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Use Ctrl+Z for undo, Ctrl+Y for redo • Professional editing with premium features • 14-day free trial of advanced tools
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo className="w-4 h-4" />
                <span>Undo</span>
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Redo className="w-4 h-4" />
                <span>Redo</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdvancedWordEditor;
