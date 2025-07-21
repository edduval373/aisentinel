import { Request, Response } from 'express';
import { subscriptionService } from '../services/subscriptionService';
import { requireAuth } from '../middleware/auth';
import { Router } from 'express';

const router = Router();

// Initialize default subscription plans
router.post('/plans/initialize', requireAuth, async (req: Request, res: Response) => {
  try {
    await subscriptionService.initializeDefaultPlans();
    res.json({ success: true, message: 'Default plans initialized' });
  } catch (error) {
    console.error('Error initializing plans:', error);
    res.status(500).json({ error: 'Failed to initialize plans' });
  }
});

// Get all subscription plans
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = [
      {
        id: 1,
        name: 'trial',
        displayName: '30-Day Free Trial',
        price: '0.00',
        billingPeriod: 'monthly',
        maxUsers: 1,
        dailyApiLimit: 100,
        monthlyApiLimit: 100,
        requiresCreditCard: true,
        requiresApiKey: false,
        features: ['100 AI interactions during trial', 'Basic chat interface', 'All AI models', 'Email support'],
        isActive: true,
      },
      {
        id: 2,
        name: 'personal',
        displayName: 'Personal Plan',
        price: '9.99',
        billingPeriod: 'monthly',
        maxUsers: 1,
        dailyApiLimit: 100,
        monthlyApiLimit: 2000,
        requiresCreditCard: true,
        requiresApiKey: false,
        features: ['2,000 AI interactions/month', 'All AI models and features', 'Priority support', 'Usage analytics'],
        isActive: true,
      },
      {
        id: 3,
        name: 'company',
        displayName: 'Company Plan',
        price: '99.00',
        billingPeriod: 'monthly',
        maxUsers: null,
        dailyApiLimit: 1000,
        monthlyApiLimit: 20000,
        requiresCreditCard: true,
        requiresApiKey: true,
        features: ['20,000 AI interactions/month', 'Unlimited users', 'Company branding', 'Admin dashboard', 'API management'],
        isActive: true,
      }
    ];
    
    res.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get user's subscription status
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // For now, return trial status - in production this would check actual subscription
    const status = {
      plan: {
        name: 'trial',
        displayName: '30-Day Free Trial',
        dailyApiLimit: 100,
        monthlyApiLimit: 100,
        requiresCreditCard: true,
      },
      subscription: null,
      dailyUsage: 0,
      monthlyUsage: 0,
      canMakeRequest: false, // Requires credit card validation
      requiresCreditCard: true,
      isTrialExpired: false,
      needsCreditCard: true,
    };

    res.json(status);
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Check if user can make API request
router.get('/can-request', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // For now, require credit card for all requests
    const result = {
      allowed: false,
      reason: 'Credit card validation required to prevent abuse. Start your secure 30-day free trial.',
      upgradeRequired: false,
      needsCreditCard: true,
    };

    res.json(result);
  } catch (error) {
    console.error('Error checking request permission:', error);
    res.status(500).json({ error: 'Failed to check request permission' });
  }
});

// Create subscription (placeholder for Stripe integration)
router.post('/create', requireAuth, async (req: Request, res: Response) => {
  try {
    const { planName, paymentMethodId } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Credit card validation required' });
    }

    // In production, this would integrate with Stripe
    const subscription = {
      id: Date.now(),
      userId,
      planName,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentMethodValidated: true,
    };

    res.json({ 
      success: true, 
      subscription,
      message: 'Subscription created successfully. Credit card validated.'
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

export default router;