import fs from 'fs';
import path from 'path';

export interface ExtractedInvoiceData {
  vendorName?: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  rawText?: string;
}

export class InvoiceOcrService {
  /**
   * Mock OCR extraction - in production, this would integrate with:
   * - Tesseract.js for OCR
   * - Google Cloud Vision API
   * - AWS Textract
   * - Azure Computer Vision
   */
  async extractInvoiceData(filePath: string): Promise<ExtractedInvoiceData> {
    try {
      // TODO: Implement actual OCR processing
      // For now, return mock data based on file name patterns
      const fileName = path.basename(filePath).toLowerCase();

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock extraction logic
      const mockData: ExtractedInvoiceData = {
        rawText: `Mock extracted text from ${fileName}`,
      };

      // Simple pattern matching for demo
      if (fileName.includes('acme')) {
        mockData.vendorName = 'ACME Corporation';
        mockData.invoiceNumber = 'INV-2024-001';
        mockData.invoiceDate = new Date('2024-01-15');
        mockData.subtotal = 1500.00;
        mockData.taxAmount = 120.00;
        mockData.totalAmount = 1620.00;
      } else if (fileName.includes('tech')) {
        mockData.vendorName = 'Tech Solutions Inc';
        mockData.invoiceNumber = 'TS-2024-045';
        mockData.invoiceDate = new Date('2024-02-01');
        mockData.subtotal = 2500.00;
        mockData.taxAmount = 200.00;
        mockData.totalAmount = 2700.00;
      } else {
        // Random mock data for other files
        mockData.vendorName = 'Unknown Vendor';
        mockData.invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
        mockData.invoiceDate = new Date();
        mockData.subtotal = Math.floor(Math.random() * 5000) + 500;
        mockData.taxAmount = mockData.subtotal! * 0.08;
        mockData.totalAmount = mockData.subtotal! + mockData.taxAmount!;
      }

      return mockData;
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract invoice data');
    }
  }

  /**
   * Validate supported file types
   */
  isValidFileType(filename: string): boolean {
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
  }

  /**
   * Get file size limit (10MB)
   */
  getMaxFileSize(): number {
    return 10 * 1024 * 1024; // 10MB
  }
}

export const invoiceOcrService = new InvoiceOcrService();