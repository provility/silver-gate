import { config } from '../config/index.js';
import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

const MATHPIX_API_URL = 'https://api.mathpix.com/v3';

export const mathpixService = {
  /**
   * Convert a PDF document to LaTeX using MathPix API
   * @param {string|Buffer} pdfSource - PDF URL, base64 encoded PDF, or Buffer
   * @param {string} scannedItemId - ID of the scanned item to update
   * @returns {Promise<string>} - LaTeX document
   */
  async convertPdfToLatex(pdfSource, scannedItemId) {
    try {
      // Update status to processing
      await this.updateConversionStatus(scannedItemId, 'processing');

      // Determine if source is URL or binary data
      const isUrl = typeof pdfSource === 'string' &&
        (pdfSource.startsWith('http://') || pdfSource.startsWith('https://'));

      let response;

      if (isUrl) {
        // For URLs, use JSON body
        const requestBody = {
          url: pdfSource,
          conversion_formats: { 'tex.zip': true },
          math_inline_delimiters: ['$', '$'],
          math_display_delimiters: ['$$', '$$'],
        };

        logger.info('MATHPIX', `Submitting PDF URL to MathPix API...`);

        response = await fetch(`${MATHPIX_API_URL}/pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'app_id': config.mathpix.appId,
            'app_key': config.mathpix.appKey,
          },
          body: JSON.stringify(requestBody),
        });
      } else {
        // For binary/base64 data, use multipart/form-data
        logger.info('MATHPIX', `Submitting PDF file to MathPix API (multipart)...`);

        // Convert base64 to Buffer if needed
        const pdfBuffer = Buffer.isBuffer(pdfSource)
          ? pdfSource
          : Buffer.from(pdfSource, 'base64');

        logger.info('MATHPIX', `PDF size: ${Math.round(pdfBuffer.length / 1024)}KB`);

        // Create form data with file blob
        const formData = new FormData();
        const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
        formData.append('file', pdfBlob, 'document.pdf');

        // Add options as JSON (MathPix PDF API uses 'tex.zip' not 'tex')
        const options = {
          conversion_formats: { 'tex.zip': true },
          math_inline_delimiters: ['$', '$'],
          math_display_delimiters: ['$$', '$$'],
        };
        formData.append('options_json', JSON.stringify(options));

        response = await fetch(`${MATHPIX_API_URL}/pdf`, {
          method: 'POST',
          headers: {
            'app_id': config.mathpix.appId,
            'app_key': config.mathpix.appKey,
          },
          body: formData,
        });
      }

      const result = await response.json();
      logger.info('MATHPIX', `API Response: ${JSON.stringify(result)}`);

      if (!response.ok) {
        throw new Error(result.error || result.error_info?.message || `MathPix API error: ${response.status}`);
      }

      const pdfId = result.pdf_id;
      if (!pdfId) {
        throw new Error(`MathPix did not return a pdf_id. Response: ${JSON.stringify(result)}`);
      }

      logger.info('MATHPIX', `PDF submitted successfully. ID: ${pdfId}`);

      // Store the request ID
      await supabase
        .from('scanned_items')
        .update({ mathpix_request_id: pdfId })
        .eq('id', scannedItemId);

      // Poll for completion
      const latexContent = await this.pollForCompletion(pdfId, scannedItemId);

      // Update the scanned item with LaTeX content
      await this.updateWithLatex(scannedItemId, latexContent);

      return latexContent;
    } catch (error) {
      logger.error('MATHPIX', `Conversion error: ${error.message}`);
      await this.updateConversionError(scannedItemId, error.message);
      throw error;
    }
  },

  /**
   * Poll MathPix API for PDF processing completion
   */
  async pollForCompletion(pdfId, scannedItemId, maxAttempts = 60, intervalMs = 2000) {
    logger.info('MATHPIX', `Polling for completion. PDF ID: ${pdfId}`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResponse = await fetch(`${MATHPIX_API_URL}/pdf/${pdfId}`, {
        method: 'GET',
        headers: {
          'app_id': config.mathpix.appId,
          'app_key': config.mathpix.appKey,
        },
      });

      if (!statusResponse.ok) {
        const errorBody = await statusResponse.text();
        logger.error('MATHPIX', `Status check failed. Status: ${statusResponse.status}, Body: ${errorBody}`);
        throw new Error(`Failed to check PDF status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      logger.info('MATHPIX', `Status: ${statusData.status}, Progress: ${statusData.percent_done || 0}%`);

      if (statusData.status === 'completed') {
        // Get the LaTeX output (tex.zip format)
        logger.info('MATHPIX', `Downloading LaTeX output...`);

        const texResponse = await fetch(`${MATHPIX_API_URL}/pdf/${pdfId}.tex`, {
          method: 'GET',
          headers: {
            'app_id': config.mathpix.appId,
            'app_key': config.mathpix.appKey,
          },
        });

        if (texResponse.ok) {
          const content = await texResponse.text();
          logger.success('MATHPIX', `Downloaded .tex format: ${Math.round(content.length / 1024)}KB`);
          return content;
        }

        // If .tex fails, try .mmd (Mathpix Markdown) as fallback
        logger.info('MATHPIX', `.tex not available (${texResponse.status}), trying .mmd format...`);
        const mmdResponse = await fetch(`${MATHPIX_API_URL}/pdf/${pdfId}.mmd`, {
          method: 'GET',
          headers: {
            'app_id': config.mathpix.appId,
            'app_key': config.mathpix.appKey,
          },
        });

        if (mmdResponse.ok) {
          const content = await mmdResponse.text();
          logger.success('MATHPIX', `Downloaded .mmd format: ${Math.round(content.length / 1024)}KB`);
          return content;
        }

        throw new Error(`Failed to get LaTeX output: ${texResponse.status}`);
      }

      if (statusData.status === 'error') {
        throw new Error(statusData.error || 'MathPix processing failed');
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('MathPix conversion timed out');
  },

  /**
   * Convert a single image to LaTeX (for smaller documents)
   */
  async convertImageToLatex(imageSource) {
    const isUrl = imageSource.startsWith('http://') || imageSource.startsWith('https://');

    const requestBody = isUrl
      ? { src: imageSource }
      : { src: `data:image/png;base64,${imageSource}` };

    requestBody.formats = ['text', 'latex_styled'];
    requestBody.math_inline_delimiters = ['$', '$'];
    requestBody.math_display_delimiters = ['$$', '$$'];

    const response = await fetch(`${MATHPIX_API_URL}/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'app_id': config.mathpix.appId,
        'app_key': config.mathpix.appKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `MathPix API error: ${response.status}`);
    }

    const result = await response.json();
    return result.latex_styled || result.text || '';
  },

  /**
   * Update scanned item with converted LaTeX
   */
  async updateWithLatex(scannedItemId, latexContent) {
    const { error } = await supabase
      .from('scanned_items')
      .update({
        latex_doc: latexContent,
        latex_conversion_status: 'completed',
        status: 'completed',
        conversion_error: null,
      })
      .eq('id', scannedItemId);

    if (error) throw error;
  },

  /**
   * Update conversion status
   */
  async updateConversionStatus(scannedItemId, status) {
    const { error } = await supabase
      .from('scanned_items')
      .update({ latex_conversion_status: status })
      .eq('id', scannedItemId);

    if (error) throw error;
  },

  /**
   * Update with conversion error
   */
  async updateConversionError(scannedItemId, errorMessage) {
    const { error } = await supabase
      .from('scanned_items')
      .update({
        latex_conversion_status: 'failed',
        status: 'failed',
        conversion_error: errorMessage,
      })
      .eq('id', scannedItemId);

    if (error) logger.error('MATHPIX', `Failed to update error status: ${error.message}`);
  },
};

export default mathpixService;
