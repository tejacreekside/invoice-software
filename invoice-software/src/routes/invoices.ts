import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { validateString, validateNumber, validateRequired, validateDate } from '../lib/validation.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { calculateInvoice, calculateLineTotal } from '../lib/invoiceCalculator.js';
import {
  validateInvoiceDates,
  isValidTransition,
  validatePaymentAmount,
  canEditInvoice,
  validateDiscount,
  determineInvoiceStatus,
} from '../lib/invoiceRules.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

interface InvoiceItem {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

interface CreateInvoiceRequest {
  customerId: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
}

interface UpdateInvoiceRequest {
  issueDate?: string;
  dueDate?: string;
  items?: InvoiceItem[];
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
}

interface PaymentRequest {
  amountPaid: number;
}

/**
 * GET /invoices
 * List all invoices for the authenticated user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const invoices = await prisma.invoice.findMany({
      where: {
        userId: req.user?.userId,
        ...(status && { status: status as string }),
      },
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * GET /invoices/:id
 * Get a single invoice
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Check authorization
    if (invoice.userId !== req.user?.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

/**
 * POST /invoices
 * Create a new invoice
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerId, issueDate, dueDate, items, taxRate = 0, discountAmount = 0, notes }: CreateInvoiceRequest =
      req.body;

    // Validate required fields
    const customerReq = validateRequired(customerId, 'Customer ID');
    if (!customerReq.valid) {
      res.status(400).json({ error: customerReq.error });
      return;
    }

    const issueDateValidation = validateDate(issueDate, 'Issue date');
    if (!issueDateValidation.valid) {
      res.status(400).json({ error: issueDateValidation.error });
      return;
    }

    const dueDateValidation = validateDate(dueDate, 'Due date');
    if (!dueDateValidation.valid) {
      res.status(400).json({ error: dueDateValidation.error });
      return;
    }

    // Validate date logic
    const issueDateObj = new Date(issueDate);
    const dueDateObj = new Date(dueDate);
    const datesValidation = validateInvoiceDates(issueDateObj, dueDateObj);
    if (!datesValidation.isValid) {
      res.status(400).json({ error: datesValidation.error });
      return;
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Invoice must have at least one item' });
      return;
    }

    for (const [index, item] of items.entries()) {
      const itemIndex = index + 1;
      const productIdValidation = validateRequired(item.productId, `Item ${itemIndex} productId`);
      if (!productIdValidation.valid) {
        res.status(400).json({ error: productIdValidation.error });
        return;
      }

      const quantityValidation = validateNumber(item.quantity, `Item ${itemIndex} quantity`, 1);
      if (!quantityValidation.valid) {
        res.status(400).json({ error: quantityValidation.error });
        return;
      }

      if (item.unitPrice !== undefined) {
        const unitPriceValidation = validateNumber(item.unitPrice, `Item ${itemIndex} unit price`, 0);
        if (!unitPriceValidation.valid) {
          res.status(400).json({ error: unitPriceValidation.error });
          return;
        }
      }
    }

    const taxRateValidation = validateNumber(taxRate, 'Tax rate', 0, 1);
    if (!taxRateValidation.valid) {
      res.status(400).json({ error: taxRateValidation.error });
      return;
    }

    // Validate customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    // Calculate totals
    const calculatedItems = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const unitPrice = item.unitPrice !== undefined ? item.unitPrice : product.unitPrice;
        const lineTotal = calculateLineTotal(item.quantity, unitPrice);

        return {
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        };
      })
    );

    const calculation = calculateInvoice({
      items: calculatedItems,
      taxRate,
      discountAmount,
      amountPaid: 0,
    });

    const discountValidation = validateDiscount(discountAmount, calculation.subtotal);
    if (!discountValidation.isValid) {
      res.status(400).json({ error: discountValidation.error });
      return;
    }

    if (!calculation.isValid) {
      res.status(400).json({ error: 'Invalid invoice calculation', errors: calculation.errors });
      return;
    }

    // Generate invoice number (simple: timestamp-based)
    const invoiceNumber = `INV-${Date.now()}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId: req.user!.userId,
        customerId,
        issueDate: issueDateObj,
        dueDate: dueDateObj,
        status: 'draft',
        subtotal: calculation.subtotal,
        taxRate,
        taxAmount: calculation.taxAmount,
        discountAmount,
        total: calculation.total,
        balanceDue: calculation.balanceDue,
        notes: notes || null,
        items: {
          create: await Promise.all(
            items.map(async (item, index) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: calculatedItems[index]!.unitPrice,
              lineTotal: calculatedItems[index]!.lineTotal,
            }))
          ),
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(201).json(invoice);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Create invoice error:', error);
    res.status(400).json({ error: `Failed to create invoice: ${message}` });
  }
});

/**
 * PUT /invoices/:id
 * Update an invoice (only drafts and sent)
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { issueDate, dueDate, items, taxRate, discountAmount, notes }: UpdateInvoiceRequest = req.body;

    // Get current invoice
    const currentInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!currentInvoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Check authorization
    if (currentInvoice.userId !== req.user?.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    // Check if invoice can be edited
    if (!canEditInvoice(currentInvoice.status as any)) {
      res.status(400).json({ error: 'This invoice cannot be edited' });
      return;
    }

    // Validate new dates if provided
    if (issueDate || dueDate) {
      const newIssueDate = issueDate ? new Date(issueDate) : currentInvoice.issueDate;
      const newDueDate = dueDate ? new Date(dueDate) : currentInvoice.dueDate;
      const datesValidation = validateInvoiceDates(newIssueDate, newDueDate);
      if (!datesValidation.isValid) {
        res.status(400).json({ error: datesValidation.error });
        return;
      }
    }

    // If items are being updated
    if (items !== undefined) {
      if (!Array.isArray(items)) {
        res.status(400).json({ error: 'Items must be an array' });
        return;
      }

      if (items.length === 0) {
        res.status(400).json({ error: 'Invoice must have at least one item' });
        return;
      }
    }

    const updateData: any = {
      issueDate: issueDate ? new Date(issueDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes: notes !== undefined ? notes : undefined,
    };

    // If items are being updated, recalculate
    if (items && items.length > 0) {
      for (const [index, item] of items.entries()) {
        const itemIndex = index + 1;
        const productIdValidation = validateRequired(item.productId, `Item ${itemIndex} productId`);
        if (!productIdValidation.valid) {
          res.status(400).json({ error: productIdValidation.error });
          return;
        }

        const quantityValidation = validateNumber(item.quantity, `Item ${itemIndex} quantity`, 1);
        if (!quantityValidation.valid) {
          res.status(400).json({ error: quantityValidation.error });
          return;
        }

        if (item.unitPrice !== undefined) {
          const unitPriceValidation = validateNumber(item.unitPrice, `Item ${itemIndex} unit price`, 0);
          if (!unitPriceValidation.valid) {
            res.status(400).json({ error: unitPriceValidation.error });
            return;
          }
        }
      }

      const calculatedItems = await Promise.all(
        items.map(async (item) => {
          const product = await prisma.product.findUnique({ where: { id: item.productId } });
          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          const unitPrice = item.unitPrice !== undefined ? item.unitPrice : product.unitPrice;
          const lineTotal = calculateLineTotal(item.quantity, unitPrice);

          return {
            quantity: item.quantity,
            unitPrice,
            lineTotal,
          };
        })
      );

      const newTaxRate = taxRate !== undefined ? taxRate : currentInvoice.taxRate;
      const newDiscountAmount = discountAmount !== undefined ? discountAmount : currentInvoice.discountAmount;

      const taxRateValidation = validateNumber(newTaxRate, 'Tax rate', 0, 1);
      if (!taxRateValidation.valid) {
        res.status(400).json({ error: taxRateValidation.error });
        return;
      }

      const calculation = calculateInvoice({
        items: calculatedItems,
        taxRate: newTaxRate,
        discountAmount: newDiscountAmount,
        amountPaid: currentInvoice.amountPaid,
      });

      const discountValidation = validateDiscount(newDiscountAmount, calculation.subtotal);
      if (!discountValidation.isValid) {
        res.status(400).json({ error: discountValidation.error });
        return;
      }

      if (!calculation.isValid) {
        res.status(400).json({ error: 'Invalid invoice calculation', errors: calculation.errors });
        return;
      }

      // Delete old items and create new ones
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

      updateData.subtotal = calculation.subtotal;
      updateData.taxRate = newTaxRate;
      updateData.taxAmount = calculation.taxAmount;
      updateData.discountAmount = newDiscountAmount;
      updateData.total = calculation.total;
      updateData.balanceDue = calculation.balanceDue;
      updateData.items = {
        create: await Promise.all(
          items.map(async (item, index) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: calculatedItems[index]!.unitPrice,
            lineTotal: calculatedItems[index]!.lineTotal,
          }))
        ),
      };
    } else if (taxRate !== undefined || discountAmount !== undefined) {
      // If only tax or discount changed, recalculate
      const newTaxRate = taxRate !== undefined ? taxRate : currentInvoice.taxRate;
      const newDiscountAmount = discountAmount !== undefined ? discountAmount : currentInvoice.discountAmount;

      const taxRateValidation = validateNumber(newTaxRate, 'Tax rate', 0, 1);
      if (!taxRateValidation.valid) {
        res.status(400).json({ error: taxRateValidation.error });
        return;
      }

      const calculation = calculateInvoice({
        items: currentInvoice.items.map((item: any) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        taxRate: newTaxRate,
        discountAmount: newDiscountAmount,
        amountPaid: currentInvoice.amountPaid,
      });

      const discountValidation = validateDiscount(newDiscountAmount, calculation.subtotal);
      if (!discountValidation.isValid) {
        res.status(400).json({ error: discountValidation.error });
        return;
      }

      if (!calculation.isValid) {
        res.status(400).json({ error: 'Invalid invoice calculation', errors: calculation.errors });
        return;
      }

      updateData.taxRate = newTaxRate;
      updateData.taxAmount = calculation.taxAmount;
      updateData.discountAmount = newDiscountAmount;
      updateData.total = calculation.total;
      updateData.balanceDue = calculation.balanceDue;
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json(updatedInvoice);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update invoice error:', error);
    res.status(400).json({ error: `Failed to update invoice: ${message}` });
  }
});

/**
 * POST /invoices/:id/status
 * Update invoice status
 */
router.post('/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    if (!newStatus) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Check authorization
    if (invoice.userId !== req.user?.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    // Validate status transition
    if (!isValidTransition(invoice.status as any, newStatus)) {
      res.status(400).json({ error: `Cannot transition from ${invoice.status} to ${newStatus}` });
      return;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: newStatus },
      include: {
        customer: true,
        items: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

/**
 * POST /invoices/:id/payment
 * Record a payment against an invoice
 */
router.post('/:id/payment', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amountPaid }: PaymentRequest = req.body;

    // Validate payment amount
    const amountValidation = validateNumber(amountPaid, 'Amount paid', 0.01);
    if (!amountValidation.valid) {
      res.status(400).json({ error: amountValidation.error });
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Check authorization
    if (invoice.userId !== req.user?.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    // Validate payment
    const paymentValidation = validatePaymentAmount(amountPaid, invoice.balanceDue);
    if (!paymentValidation.isValid) {
      res.status(400).json({ error: paymentValidation.error });
      return;
    }

    // Calculate new amounts
    const totalAmountPaid = invoice.amountPaid + amountPaid;
    const newBalanceDue = Math.max(0, invoice.total - totalAmountPaid);

    // Determine new status
    const newStatus = determineInvoiceStatus(newBalanceDue, invoice.dueDate, invoice.status as any);

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: totalAmountPaid,
        balanceDue: newBalanceDue,
        status: newStatus,
      },
      include: {
        customer: true,
        items: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

export default router;
