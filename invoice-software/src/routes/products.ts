import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { validateString, validateNumber, validateRequired } from '../lib/validation.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

interface CreateProductRequest {
  name: string;
  description?: string;
  unitPrice: number;
  quantity?: number;
  sku?: string;
}

/**
 * GET /products
 * List all products
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * GET /products/:id
 * Get a single product
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

/**
 * POST /products
 * Create a new product
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, unitPrice, quantity, sku }: CreateProductRequest = req.body;

    // Validate required fields
    const nameValidation = validateString(name, 'Name', 100);
    if (!nameValidation.valid) {
      res.status(400).json({ error: nameValidation.error });
      return;
    }

    const unitPriceValidation = validateNumber(unitPrice, 'Unit price', 0, Infinity);
    if (!unitPriceValidation.valid) {
      res.status(400).json({ error: unitPriceValidation.error });
      return;
    }

    // Validate optional fields
    if (quantity !== undefined) {
      const quantityValidation = validateNumber(quantity, 'Quantity', 0, Infinity);
      if (!quantityValidation.valid) {
        res.status(400).json({ error: quantityValidation.error });
        return;
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        unitPrice,
        quantity: quantity || 0,
        sku: sku || null,
      },
    });

    res.status(201).json(product);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      res.status(409).json({ error: 'Product with this SKU already exists' });
      return;
    }
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/**
 * PUT /products/:id
 * Update a product
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, unitPrice, quantity, sku }: CreateProductRequest = req.body;

    // Validate inputs if provided
    if (name !== undefined) {
      const nameValidation = validateString(name, 'Name', 100);
      if (!nameValidation.valid) {
        res.status(400).json({ error: nameValidation.error });
        return;
      }
    }

    if (unitPrice !== undefined) {
      const unitPriceValidation = validateNumber(unitPrice, 'Unit price', 0, Infinity);
      if (!unitPriceValidation.valid) {
        res.status(400).json({ error: unitPriceValidation.error });
        return;
      }
    }

    if (quantity !== undefined) {
      const quantityValidation = validateNumber(quantity, 'Quantity', 0, Infinity);
      if (!quantityValidation.valid) {
        res.status(400).json({ error: quantityValidation.error });
        return;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description || undefined,
        unitPrice: unitPrice !== undefined ? unitPrice : undefined,
        quantity: quantity !== undefined ? quantity : undefined,
        sku: sku || undefined,
      },
    });

    res.json(product);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      res.status(409).json({ error: 'Product with this SKU already exists' });
      return;
    }
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * DELETE /products/:id
 * Delete a product
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if product is used in any invoices
    const invoiceItemCount = await prisma.invoiceItem.count({ where: { productId: id } });
    if (invoiceItemCount > 0) {
      res.status(400).json({ error: 'Cannot delete product used in invoices' });
      return;
    }

    await prisma.product.delete({ where: { id } });

    res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
