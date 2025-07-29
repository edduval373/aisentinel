import { storage } from '../storage';
import { SubscriptionPlan, InsertSubscriptionPlan, UserSubscription, InsertUserSubscription } from '../../shared/schema';

export class SubscriptionService {
  // Initialize default subscription plans
  async initializeDefaultPlans(): Promise<void> {
    const existingPlans = await storage.getSubscriptionPlans();
    if (existingPlans.length > 0) return; // Plans already exist

    const defaultPlans: InsertSubscriptionPlan[] = [
      {
        name: 'trial',
        displayName: '30-Day Free Trial',
        price: '0.00',
        billingPeriod: 'monthly',
        maxUsers: 1,
        dailyApiLimit: 10,
        monthlyApiLimit: 100,
        requiresCreditCard: true,
        requiresApiKey: false,
        features: ['100 AI interactions', 'Basic chat interface', 'Email support'],
        isActive: true,
      },
      {
        name: 'personal',
        displayName: 'Personal Plan',
        price: '9.99',
        billingPeriod: 'monthly',
        maxUsers: 1,
        dailyApiLimit: 100,
        monthlyApiLimit: 2000,
        requiresCreditCard: true,
        requiresApiKey: false,
        features: ['2,000 AI interactions/month', 'All AI models', 'File uploads', 'Priority support'],
        isActive: true,
      },
      {
        name: 'company',
        displayName: 'Company Plan',
        price: '50.00',
        billingPeriod: 'monthly',
        maxUsers: 50, // Up to 50 users at base price
        dailyApiLimit: 999999, // Unlimited since they use their own API keys
        monthlyApiLimit: 999999, // Unlimited since they use their own API keys
        requiresCreditCard: true,
        requiresApiKey: true,
        features: [
          'Unlimited AI interactions (your API keys)',
          'Up to 50 team members',
          'API key management',
          'Role-based access control',
          'Company branding',
          'Priority support',
          'Admin dashboard'
        ],
        isActive: true,
      }
    ];

    for (const plan of defaultPlans) {
      await storage.createSubscriptionPlan(plan);
    }
  }

  // Get user's current subscription status and limits
  async getUserSubscriptionStatus(userId: string): Promise<{
    plan: SubscriptionPlan;
    subscription: UserSubscription | null;
    dailyUsage: number;
    monthlyUsage: number;
    canMakeRequest: boolean;
    requiresCreditCard: boolean;
    isTrialExpired: boolean;
  }> {
    const subscription = await storage.getUserActiveSubscription(userId);
    
    if (!subscription) {
      // New user gets trial plan
      const trialPlan = await storage.getSubscriptionPlanByName('trial');
      return {
        plan: trialPlan!,
        subscription: null,
        dailyUsage: 0,
        monthlyUsage: 0,
        canMakeRequest: false, // Must add credit card first
        requiresCreditCard: true,
        isTrialExpired: false,
      };
    }

    const plan = await storage.getSubscriptionPlan(subscription.planId);
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

    const dailyUsage = await storage.getApiUsageForDate(userId, today);
    const monthlyUsage = await storage.getApiUsageForMonth(userId, thisMonth);

    const isTrialExpired = subscription.trialEnd && new Date() > subscription.trialEnd;
    const canMakeRequest = 
      !isTrialExpired &&
      dailyUsage < plan!.dailyApiLimit &&
      monthlyUsage < plan!.monthlyApiLimit;

    return {
      plan: plan!,
      subscription,
      dailyUsage,
      monthlyUsage,
      canMakeRequest,
      requiresCreditCard: plan!.requiresCreditCard,
      isTrialExpired: !!isTrialExpired,
    };
  }

  // Create subscription for user after credit card validation
  async createUserSubscription(userId: string, planName: string, stripeCustomerId?: string): Promise<UserSubscription> {
    const plan = await storage.getSubscriptionPlanByName(planName);
    if (!plan) {
      throw new Error(`Subscription plan '${planName}' not found`);
    }

    const subscription: InsertUserSubscription = {
      userId,
      companyId: null, // Will be set based on user's company
      planId: plan.id,
      status: 'active',
      stripeCustomerId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      trialEnd: planName === 'trial' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
    };

    return await storage.createUserSubscription(subscription);
  }

  // Track API usage
  async trackApiUsage(userId: string, companyId: number | null, tokenCount: number = 1): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    await storage.incrementApiUsage(userId, companyId, today, tokenCount);
  }

  // Check if user can make API request
  async canUserMakeRequest(userId: string): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: boolean }> {
    const status = await this.getUserSubscriptionStatus(userId);

    if (status.requiresCreditCard && !status.subscription) {
      return {
        allowed: false,
        reason: 'Credit card required to start free trial',
        upgradeRequired: false,
      };
    }

    if (status.isTrialExpired) {
      return {
        allowed: false,
        reason: 'Free trial has expired. Please upgrade to continue.',
        upgradeRequired: true,
      };
    }

    if (!status.canMakeRequest) {
      if (status.dailyUsage >= status.plan.dailyApiLimit) {
        return {
          allowed: false,
          reason: `Daily limit reached (${status.plan.dailyApiLimit} requests/day). Upgrade for higher limits.`,
          upgradeRequired: true,
        };
      }

      if (status.monthlyUsage >= status.plan.monthlyApiLimit) {
        return {
          allowed: false,
          reason: `Monthly limit reached (${status.plan.monthlyApiLimit} requests/month). Upgrade for higher limits.`,
          upgradeRequired: true,
        };
      }
    }

    return { allowed: true };
  }
}

export const subscriptionService = new SubscriptionService();