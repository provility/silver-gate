import { config } from '../config/index.js';
import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

const MATHPIX_API_URL = 'https://api.mathpix.com/v3';

export const mathpixService = {
  /**
   * Convert a PDF document to LaTeX using MathPix API
   * @param {string} pdfSource - PDF URL or base64 encoded PDF
   * @param {string} scannedItemId - ID of the scanned item to update
   * @returns {Promise<string>} - LaTeX document
   */
  async convertPdfToLatex(pdfSource, scannedItemId) {
    try {
      // Update status to processing
      await this.updateConversionStatus(scannedItemId, 'processing');

      // Determine if source is URL or base64
      const isUrl = pdfSource.startsWith('http://') || pdfSource.startsWith('https://');

      // Prepare request body
      const requestBody = isUrl
        ? { url: pdfSource }
        : { src: `data:application/pdf;base64,${pdfSource}` };

      // Add conversion options
      requestBody.conversion_formats = { tex: true };
      requestBody.math_inline_delimiters = ['$', '$'];
      requestBody.math_display_delimiters = ['$$', '$$'];

      // Submit PDF for processing
      const response = await fetch(`${MATHPIX_API_URL}/pdf`, {
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
      const pdfId = result.pdf_id;

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
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResponse = await fetch(`${MATHPIX_API_URL}/pdf/${pdfId}`, {
        method: 'GET',
        headers: {
          'app_id': config.mathpix.appId,
          'app_key': config.mathpix.appKey,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check PDF status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();

      if (statusData.status === 'completed') {
        // Get the LaTeX output
        const texResponse = await fetch(`${MATHPIX_API_URL}/pdf/${pdfId}.tex`, {
          method: 'GET',
          headers: {
            'app_id': config.mathpix.appId,
            'app_key': config.mathpix.appKey,
          },
        });

        if (!texResponse.ok) {
          throw new Error(`Failed to get LaTeX output: ${texResponse.status}`);
        }

        return await texResponse.text();
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
