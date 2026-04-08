import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword, generateToken } from '../lib/auth.js';
import { validateEmail, validatePassword, validateRequired, validateString } from '../lib/validation.js';

const router = Router();

interface SignUpRequest {
  email: string;
  password: string;
  name: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

/**
 * POST /auth/signup
 * Create a new user account
 */
router.post('/signup', async (req: Request<unknown, unknown, SignUpRequest>, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validate inputs
    const emailValidation = validateRequired(email, 'Email');
    if (!emailValidation.valid) {
      res.status(400).json({ error: emailValidation.error });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    const passwordValidation = validateRequired(password, 'Password');
    if (!passwordValidation.valid) {
      res.status(400).json({ error: passwordValidation.error });
      return;
    }

    const passwordStrengthValidation = validatePassword(password);
    if (!passwordStrengthValidation.valid) {
      res.status(400).json({ error: passwordStrengthValidation.error });
      return;
    }

    const nameValidation = validateString(name, 'Name', 100);
    if (!nameValidation.valid) {
      res.status(400).json({ error: nameValidation.error });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * POST /auth/login
 * Authenticate a user and return JWT token
 */
router.post('/login', async (req: Request<unknown, unknown, LoginRequest>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    const emailValidation = validateRequired(email, 'Email');
    if (!emailValidation.valid) {
      res.status(400).json({ error: emailValidation.error });
      return;
    }

    const passwordValidation = validateRequired(password, 'Password');
    if (!passwordValidation.valid) {
      res.status(400).json({ error: passwordValidation.error });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

export default router;
