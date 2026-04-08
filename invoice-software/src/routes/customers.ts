import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { validateString, validateRequired } from '../lib/validation.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/**
 * GET /customers
 * List all customers
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * GET /customers/:id
 * Get a single customer
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

/**
 * POST /customers
 * Create a new customer
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, address, city, state, zipCode, country }: CreateCustomerRequest = req.body;

    // Validate required fields
    const nameValidation = validateString(name, 'Name', 100);
    if (!nameValidation.valid) {
      res.status(400).json({ error: nameValidation.error });
      return;
    }

    // Validate optional email if provided
    if (email) {
      const emailValidation = validateString(email, 'Email', 100);
      if (!emailValidation.valid) {
        res.status(400).json({ error: emailValidation.error });
        return;
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        country: country || null,
      },
    });

    res.status(201).json(customer);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      res.status(409).json({ error: 'Customer with this name and email already exists' });
      return;
    }
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

/**
 * PUT /customers/:id
 * Update a customer
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, city, state, zipCode, country }: CreateCustomerRequest = req.body;

    // Validate if updating name
    if (name !== undefined) {
      const nameValidation = validateString(name, 'Name', 100);
      if (!nameValidation.valid) {
        res.status(400).json({ error: nameValidation.error });
        return;
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        country: country || undefined,
      },
    });

    res.json(customer);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      res.status(409).json({ error: 'Customer with this name and email already exists' });
      return;
    }
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

/**
 * DELETE /customers/:id
 * Delete a customer
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if customer has invoices
    const invoiceCount = await prisma.invoice.count({ where: { customerId: id } });
    if (invoiceCount > 0) {
      res.status(400).json({ error: 'Cannot delete customer with existing invoices' });
      return;
    }

    await prisma.customer.delete({ where: { id } });

    res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
