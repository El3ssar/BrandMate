import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
const pdfParse = PDFParse;

/**
 * Extract text from a base64-encoded PDF
 * @param {string} base64Data - The PDF data in base64 format
 * @returns {Promise<string>} - Extracted text from the PDF
 */
export async function extractTextFromPDF(base64Data) {
  try {
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    
    // Parse PDF - pdf-parse exports the function directly
    const data = await new pdfParse(pdfBuffer);
    
    // Return extracted text
    return data.text || '';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return `[Error extracting PDF text: ${error.message}]`;
  }
}

/**
 * Separate images from PDFs in a file array
 * @param {Array} files - Array of file objects with mimeType and data
 * @returns {Promise<Object>} - Object with images array and pdfTexts array
 */
export async function separateImagesAndPDFs(files) {
  const images = [];
  const pdfTexts = [];
  
  for (const file of files) {
    if (file.mimeType === 'application/pdf') {
      // Extract text from PDF
      const text = await extractTextFromPDF(file.data);
      if (text.trim()) {
        pdfTexts.push({
          name: file.name || 'PDF Document',
          text: text
        });
      }
    } else if (file.mimeType && file.mimeType.startsWith('image/')) {
      // Keep image files as-is
      images.push(file);
    }
    // Ignore any other file types
  }
  
  return { images, pdfTexts };
}

