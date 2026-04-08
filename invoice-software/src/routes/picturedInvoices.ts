import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { fileUploadService } from '../services/fileUploadService.js';
import { invoiceOcrService } from '../services/invoiceOcrService.js';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Upload invoice image
router.post('/upload', fileUploadService.getInvoiceUpload().single('invoice'), async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create initial pictured invoice record
    const picturedInvoice = await prisma.picturedInvoice.create({
      data: {
        userId,
        fileName: req.file.originalname,
        filePath: req.file.path,
        status: 'uploaded'
      }
    });

    // Start OCR processing asynchronously
    processInvoiceOcr(picturedInvoice.id, req.file.path);

    res.status(201).json({
      message: 'Invoice uploaded successfully',
      picturedInvoice: {
        id: picturedInvoice.id,
        fileName: picturedInvoice.fileName,
        status: picturedInvoice.status,
        createdAt: picturedInvoice.createdAt
      }
    });
  } catch (error) {
    console.error('Invoice upload error:', error);
    res.status(500).json({ error: 'Failed to upload invoice' });
  }
});

// Get all pictured invoices for user
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const picturedInvoices = await prisma.picturedInvoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        vendorName: true,
        invoiceNumber: true,
        invoiceDate: true,
        subtotal: true,
        taxAmount: true,
        totalAmount: true,
        status: true,
        createdAt: true
      }
    });

    res.json({ picturedInvoices });
  } catch (error) {
    console.error('Pictured invoices fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch pictured invoices' });
  }
});

// Get specific pictured invoice
router.get('/:id', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const picturedInvoice = await prisma.picturedInvoice.findFirst({
      where: { id, userId },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        vendorName: true,
        invoiceNumber: true,
        invoiceDate: true,
        subtotal: true,
        taxAmount: true,
        totalAmount: true,
        rawText: true,
        status: true,
        createdAt: true
      }
    });

    if (!picturedInvoice) {
      return res.status(404).json({ error: 'Pictured invoice not found' });
    }

    res.json({ picturedInvoice });
  } catch (error) {
    console.error('Pictured invoice fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch pictured invoice' });
  }
});

// Delete pictured invoice
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const picturedInvoice = await prisma.picturedInvoice.findFirst({
      where: { id, userId }
    });

    if (!picturedInvoice) {
      return res.status(404).json({ error: 'Pictured invoice not found' });
    }

    // Delete file
    fileUploadService.deleteFile(picturedInvoice.filePath);

    // Delete record
    await prisma.picturedInvoice.delete({
      where: { id }
    });

    res.json({ message: 'Pictured invoice deleted successfully' });
  } catch (error) {
    console.error('Pictured invoice delete error:', error);
    res.status(500).json({ error: 'Failed to delete pictured invoice' });
  }
});

// Async function to process OCR
async function processInvoiceOcr(picturedInvoiceId: string, filePath: string) {
  try {
    // Update status to processing
    await prisma.picturedInvoice.update({
      where: { id: picturedInvoiceId },
      data: { status: 'processing' }
    });

    // Extract data
    const extractedData = await invoiceOcrService.extractInvoiceData(filePath);

    // Update record with extracted data
    await prisma.picturedInvoice.update({
      where: { id: picturedInvoiceId },
      data: {
        ...extractedData,
        status: 'parsed'
      }
    });
  } catch (error) {
    console.error('OCR processing failed:', error);

    // Update status to failed
    await prisma.picturedInvoice.update({
      where: { id: picturedInvoiceId },
      data: { status: 'failed' }
    });
  }
}

export default router;