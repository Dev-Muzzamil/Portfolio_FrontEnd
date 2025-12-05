const { exec } = require('child_process');
const { promisify } = require('util');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

// Convert PDF to image utility
class PDFToImageConverter {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  async convertPDFToImage(pdfBuffer, options = {}) {
    const {
      pageNumber = 1,
      quality = 80,
      format = 'jpeg'
    } = options;

    // Generate unique filename
    const timestamp = Date.now();
    const pdfFileName = `temp_${timestamp}.pdf`;
    const pdfPath = path.join(this.tempDir, pdfFileName);
    const outputDir = path.join(this.tempDir, `output_${timestamp}`);

    try {
      // Write PDF buffer to temporary file
      await fs.writeFile(pdfPath, pdfBuffer);

      // Create output directory
      await fs.mkdir(outputDir, { recursive: true });

      // Use pdftoppm with basic options - by default it uses MediaBox (full page)
      // Don't use -cropbox option to ensure we get the full page
      const outputPrefix = path.join(outputDir, 'page');
      const pageNum = pageNumber - 1; // pdftoppm uses 0-based indexing
      
      // Use the pdftoppm binary that comes with pdf-poppler
      const pdftoppmPath = path.join(__dirname, '../node_modules/pdf-poppler/lib/win/poppler-0.51/bin/pdftoppm.exe');
      const pdftoppmCommand = `"${pdftoppmPath}" -jpeg -f ${pageNum} -l ${pageNum} -r 300 "${pdfPath}" "${outputPrefix}"`;
      
      console.log('🔄 Running pdftoppm (MediaBox by default):', pdftoppmCommand);
      await execAsync(pdftoppmCommand);

      // Find the generated image file
      const files = await fs.readdir(outputDir);
      const imageFile = files.find(file => file.startsWith('page') && file.endsWith('.jpg'));
      
      if (!imageFile) {
        throw new Error('No image file generated from PDF');
      }

      const imagePath = path.join(outputDir, imageFile);
      const imageBuffer = await fs.readFile(imagePath);

      // Process image with Sharp to get dimensions and optimize
      const sharpImage = sharp(imageBuffer);
      const metadata = await sharpImage.metadata();
      
      const processedImageBuffer = await sharpImage
        .jpeg({ 
          quality: quality,
          progressive: true
        })
        .toBuffer();

      // Clean up temporary files
      await this.cleanup([pdfPath, outputDir]);

      return {
        success: true,
        imageBuffer: processedImageBuffer,
        width: metadata.width || 400,
        height: metadata.height || 600,
        format: 'jpeg'
      };

    } catch (error) {
      console.error('PDF to image conversion error:', error);
      
      // Clean up on error
      try {
        await this.cleanup([pdfPath, outputDir]);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  async cleanup(paths) {
    for (const pathToClean of paths) {
      try {
        if (pathToClean) {
          const stats = await fs.stat(pathToClean);
          if (stats.isDirectory()) {
            const files = await fs.readdir(pathToClean);
            for (const file of files) {
              await fs.unlink(path.join(pathToClean, file));
            }
            await fs.rmdir(pathToClean);
          } else {
            await fs.unlink(pathToClean);
          }
        }
      } catch (error) {
        // Ignore cleanup errors
        console.warn('Cleanup warning:', error.message);
      }
    }
  }

  // Clean up old temporary files (run periodically)
  async cleanupOldFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          if (stats.isDirectory()) {
            const subFiles = await fs.readdir(filePath);
            for (const subFile of subFiles) {
              await fs.unlink(path.join(filePath, subFile));
            }
            await fs.rmdir(filePath);
          } else {
            await fs.unlink(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Cleanup old files error:', error);
    }
  }
}

module.exports = new PDFToImageConverter();
