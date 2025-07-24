import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import type { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService';

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'development-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

// Setup auth middleware
export function setupAuth(app: Express) {
  app.set('trust proxy', 1);
  app.use(getSession());
}

// Password utilities
export const passwordUtils = {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  },

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  generateToken(): string {
    return nanoid(32);
  }
};

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// Auth middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Auth service
export const authService = {
  async signup(email: string, password: string, firstName: string, lastName: string) {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password and create user
    const passwordHash = await passwordUtils.hash(password);
    const verificationToken = passwordUtils.generateToken();
    
    const user = await storage.createUser({
      id: nanoid(),
      email,
      passwordHash,
      firstName,
      lastName,
      isVerified: false,
      verificationToken,
      subscriptionStatus: 'trial',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, firstName || 'User', verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail signup if email fails
    }

    return user;
  },

  async login(email: string, password: string) {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await passwordUtils.verify(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    return user;
  },

  async verifyEmail(token: string) {
    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      throw new Error('Invalid verification token');
    }

    await storage.verifyUser(user.id);
    return user;
  },

  async requestPasswordReset(email: string) {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('No user found with this email');
    }

    const resetToken = passwordUtils.generateToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await storage.setPasswordResetToken(user.id, resetToken, resetTokenExpiry);

    // Send reset email
    try {
      await sendPasswordResetEmail(email, user.firstName || 'User', resetToken);
    } catch (error) {
      console.error('Failed to send reset email:', error);
      throw new Error('Failed to send reset email');
    }

    return true;
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await storage.getUserByResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      throw new Error('Reset token has expired');
    }

    const passwordHash = await passwordUtils.hash(newPassword);
    await storage.updateUserPassword(user.id, passwordHash);
    await storage.clearPasswordResetToken(user.id);

    return user;
  }
};