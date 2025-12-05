const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const cloudinary = require('cloudinary').v2;
const { uploadToCloudinary } = require('../../middleware/cloudinary');

/**
 * PDFService - Handles PDF processing, OCR, and text extraction
 * Responsible for: PDF text extraction, OCR, PDF-to-image conversion, certificate data parsing
 */
class PDFService {
  /**
   * Extract text from PDF buffer
   */
  static async extractTextFromPDF(pdfBuffer) {
    try {
      console.log('🔍 Extracting text from PDF...');
      
      const pdfData = await pdfParse(pdfBuffer, {
        max: 0,
        version: 'v1.10.100',
        normalizeWhitespace: true,
        disableCombineTextItems: false
      });
      
      console.log('📄 PDF metadata:', {
        pages: pdfData.numpages,
        info: pdfData.info,
        version: pdfData.version
      });
      
      let cleanedText = pdfData.text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      
      console.log('✅ PDF text extracted, length:', cleanedText.length);
      return {
        success: true,
        text: cleanedText,
        metadata: {
          pages: pdfData.numpages,
          info: pdfData.info
        }
      };
    } catch (error) {
      console.error('❌ PDF text extraction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Perform OCR on image buffer
   */
  static async performOCR(imageBuffer, mimeType) {
    try {
      console.log('🔍 Performing OCR on image...');
      
      if (mimeType === 'application/pdf') {
        return await this.extractTextFromPDF(imageBuffer);
      } else if (mimeType.startsWith('image/')) {
        const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log('🔍 OCR Progress:', Math.round(m.progress * 100) + '%');
            }
          }
        });
        
        console.log('✅ OCR completed, text length:', text.length);
        return {
          success: true,
          text: text.trim()
        };
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error('❌ OCR failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert PDF to image
   */
  static async convertPDFToImage(pdfBuffer, options = {}) {
    try {
      console.log('🖼️ Converting PDF to image...');
      
      const pdfToImage = require('../../utils/pdfToImage');
      const result = await pdfToImage.convertPDFToImage(pdfBuffer, {
        pageNumber: options.pageNumber || 1,
        quality: options.quality || 85
      });

      if (result.success) {
        console.log('✅ PDF converted to image successfully');
        return {
          success: true,
          imageBuffer: result.imageBuffer,
          metadata: result.metadata
        };
      } else {
        throw new Error(result.error || 'PDF conversion failed');
      }
    } catch (error) {
      console.error('❌ PDF to image conversion failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate PDF thumbnail
   */
  static async generatePDFThumbnail(pdfBuffer, filename) {
    try {
      console.log('🖼️ Generating PDF thumbnail...');
      
      const conversionResult = await this.convertPDFToImage(pdfBuffer, {
        pageNumber: 1,
        quality: 85
      });

      if (!conversionResult.success) {
        throw new Error(conversionResult.error);
      }

      const thumbnailUpload = await uploadToCloudinary(
        conversionResult.imageBuffer, 
        'portfolio/certificates/thumbnails',
        {
          originalname: `${filename}_thumb.jpg`
        }
      );

      console.log('✅ PDF thumbnail generated and uploaded');
      return {
        success: true,
        thumbnailUrl: thumbnailUpload.secure_url,
        thumbnailPublicId: thumbnailUpload.public_id
      };
    } catch (error) {
      console.error('❌ PDF thumbnail generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse certificate text from OCR results
   */
  static parseCertificateText(text) {
    console.log('🔍 Parsing certificate text...');
    
    const extractedData = {
      title: '',
      issuer: '',
      issueDate: '',
      credentialId: '',
      credentialUrl: '',
      skills: [],
      category: 'certification'
    };

    let cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .replace(/[^\x20-\x7E\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('📝 Cleaned text length:', cleanText.length);

    // Extract title - multiple patterns for different certificate formats
    const titlePatterns = [
      /Specialization\s+([A-Z][^.!?\n]{10,50})(?:\s+This)/i,
      /(?:has successfully completed|has been awarded|successfully completed).*?(?:the online, non-credit Specialization|Specialization)\s+([A-Z][^.!?\n]{10,50})(?:\s+This|$)/i,
      /(?:Certificate|Completion|Award).*?([A-Z][^.!?\n]{10,50})(?:\s+This|$)/i,
      /([A-Z][^.!?\n]{10,50})(?:\s+Specialization|\s+Course|\s+Program)/i,
      /(?:This is to certify that|Certificate of Completion|Certificate of Achievement).*?([A-Z][^.!?\n]{10,50})(?:\s+This|$)/i
    ];

    for (const pattern of titlePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1] && match[1].trim().length > 5) {
        extractedData.title = match[1].trim();
        console.log('✅ Title extracted:', extractedData.title);
        break;
      }
    }

    // Extract issuer
    const issuerPatterns = [
      /(IBM Skills Network)/i,
      /(IBM Corporation)/i,
      /(Coursera|Coursera Inc\.?)/i,
      /(?:University|College|Institute|School).*?([A-Z][^.!?\n]{2,50})/i,
      /(?:from|by|issued by|awarded by)\s*([A-Z][^.!?\n]{2,50})/i
    ];
    
    for (const pattern of issuerPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        extractedData.issuer = (match[1] || match[0]).trim();
        console.log('✅ Issuer extracted:', extractedData.issuer);
        break;
      }
    }

    // Extract date
    const datePatterns = [
      /(\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*-\d{4})/i,
      /(?:date|issued|completed|awarded).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
      /(?:date|issued|completed|awarded).*?(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
      /(?:date|issued|completed|awarded).*?(\w+ \d{1,2},? \d{4})/i
    ];

    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        extractedData.issueDate = this.formatDate(match[1]);
        console.log('✅ Date extracted:', match[1], '-> formatted:', extractedData.issueDate);
        break;
      }
    }

    // Extract credential ID
    const credentialPatterns = [
      /coursera\.org\/verify\/(?:specialization|course|certificate)\/([A-Z0-9]{10,20})/i,
      /specializat\s*ion\/([A-Z0-9]{10,20})/i,
      /([A-Z0-9]{10,20})(?:\s*$)/i,
      /verify.*?([A-Z0-9]{10,20})/i
    ];

    for (const pattern of credentialPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        extractedData.credentialId = match[1];
        console.log('✅ Credential ID extracted:', extractedData.credentialId);
        break;
      }
    }

    // Extract skills/technologies mentioned
    const skillKeywords = [
      'python', 'javascript', 'react', 'node', 'machine learning', 'ai', 'data science', 
      'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'sql', 'database', 'web development',
      'mobile development', 'cybersecurity', 'devops', 'blockchain', 'tensorflow', 'pytorch'
    ];
    
    extractedData.skills = skillKeywords.filter(skill => 
      cleanText.toLowerCase().includes(skill)
    );

    // Extract verification URL
    const urlPatterns = [
      /(https?:\/\/coursera\.org\/verify\/specializat\s*ion\/[A-Z0-9]+)/i,
      /(coursera\.org\/verify\/specializat\s*ion\/[A-Z0-9]+)/i,
      /(https?:\/\/[^\s]+)/i
    ];
    
    for (const pattern of urlPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let url = match[1] || match[0];
        url = url.replace(/specializat\s+ion/g, 'specialization');
        url = url.replace(/\s+/g, '');
        extractedData.credentialUrl = url;
        console.log('✅ Verification URL extracted:', extractedData.credentialUrl);
        break;
      }
    }

    console.log('✅ Certificate parsing completed');
    return extractedData;
  }

  /**
   * Format date string to YYYY-MM-DD format
   */
  static formatDate(dateString) {
    try {
      if (dateString.match(/^\d{1,2}-[A-Za-z]{3,}-\d{4}$/)) {
        const parts = dateString.split('-');
        const day = parts[0].padStart(2, '0');
        const month = parts[1];
        const year = parts[2];
        
        const monthNames = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
          'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        
        const monthNum = monthNames[month] || monthNames[month.substring(0, 3)];
        if (monthNum) {
          return `${year}-${monthNum}-${day}`;
        }
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.log('Date formatting error:', error);
    }
    return '';
  }

  /**
   * Process certificate file (PDF or image) and extract details
   */
  static async processCertificateFile(file) {
    try {
      console.log('🔍 Processing certificate file:', file.originalname);
      
      const extractedData = {
        title: '',
        issuer: '',
        issueDate: '',
        credentialId: '',
        description: '',
        credentialUrl: '',
        skills: [],
        category: 'certification'
      };

      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        const ocrResult = await this.performOCR(file.buffer, file.mimetype);
        
        if (ocrResult.success && ocrResult.text && ocrResult.text.trim().length > 0) {
          const parsedData = this.parseCertificateText(ocrResult.text);
          Object.assign(extractedData, parsedData);
        }
      }

      const filenameData = this.parseFilename(file.originalname.toLowerCase());
      
      if (!extractedData.title && filenameData.title) {
        extractedData.title = filenameData.title;
      }
      if (!extractedData.issuer && filenameData.issuer) {
        extractedData.issuer = filenameData.issuer;
      }
      if (!extractedData.issueDate && filenameData.issueDate) {
        extractedData.issueDate = filenameData.issueDate;
      }
      if (!extractedData.category && filenameData.category) {
        extractedData.category = filenameData.category;
      }

      console.log('✅ Certificate processing completed');
      return {
        success: true,
        extractedData
      };
    } catch (error) {
      console.error('❌ Certificate processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse filename for additional data
   */
  static parseFilename(filename) {
    const extractedData = {
      title: '',
      issuer: '',
      issueDate: '',
      category: 'certification'
    };

    if (filename.includes('coursera')) {
      extractedData.issuer = 'Coursera';
      extractedData.category = 'course';
    } else if (filename.includes('udemy')) {
      extractedData.issuer = 'Udemy';
      extractedData.category = 'course';
    } else if (filename.includes('google')) {
      extractedData.issuer = 'Google';
      extractedData.category = 'certification';
    } else if (filename.includes('microsoft')) {
      extractedData.issuer = 'Microsoft';
      extractedData.category = 'certification';
    } else if (filename.includes('aws') || filename.includes('amazon')) {
      extractedData.issuer = 'Amazon Web Services';
      extractedData.category = 'certification';
    }

    const dateMatch = filename.match(/(\d{4})[-_](\d{1,2})[-_](\d{1,2})|(\d{1,2})[-_](\d{1,2})[-_](\d{4})/);
    if (dateMatch) {
      if (dateMatch[1]) {
        extractedData.issueDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
      } else {
        extractedData.issueDate = `${dateMatch[6]}-${dateMatch[4].padStart(2, '0')}-${dateMatch[5].padStart(2, '0')}`;
      }
    }

    const nameMatch = filename.replace(/\.(pdf|jpg|jpeg|png|webp)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    if (nameMatch && !nameMatch.includes('certificate') && !nameMatch.includes('cert')) {
      extractedData.title = nameMatch;
    }

    return extractedData;
  }
}

module.exports = PDFService;
