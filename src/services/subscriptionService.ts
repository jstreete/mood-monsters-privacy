import { Platform } from 'react-native';

export interface SubscriptionPackage {
  id: string;
  identifier: string;
  title: string;
  description: string;
  priceString: string;
  price: number;
  period: 'monthly' | 'annual';
  trialDays: number;
}

export const SUBSCRIPTION_PLANS: SubscriptionPackage[] = [
  {
    id: 'monthly_799',
    identifier: 'moodmonsters_799_1m',
    title: 'Monthly Subscription',
    description: 'Full access billed monthly. Includes 7-day free trial.',
    priceString: '$7.99 / month',
    price: 7.99,
    period: 'monthly',
    trialDays: 7,
  },
  {
    id: 'annual_6900',
    identifier: 'moodmonsters_6900_1y',
    title: 'Annual Subscription',
    description: 'Best value! Save 28% billed annually. Includes 7-day free trial.',
    priceString: '$69.00 / year ($5.75/mo)',
    price: 69.00,
    period: 'annual',
    trialDays: 7,
  },
];

export const ENTITLEMENT_ID = 'pro_access';

class SubscriptionService {
  private isInitialized = false;

  public async initialize(apiKey?: string): Promise<void> {
    if (this.isInitialized) return;
    try {
      if (apiKey) {
        // RevenueCat Purchases SDK setup when API key is provided
        // Purchases.configure({ apiKey });
        console.log('RevenueCat initialized with API key');
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('RevenueCat initialization deferred:', e);
    }
  }

  public getPackages(): SubscriptionPackage[] {
    return SUBSCRIPTION_PLANS;
  }

  public async purchasePackage(pkg: SubscriptionPackage): Promise<boolean> {
    try {
      // In production with react-native-purchases:
      // const { customerInfo } = await Purchases.purchasePackage(rcPackage);
      // return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      console.log(`[SubscriptionService] Simulating purchase of ${pkg.title}`);
      return true;
    } catch (e) {
      console.error('Purchase failed:', e);
      return false;
    }
  }

  public async restorePurchases(): Promise<boolean> {
    try {
      // const customerInfo = await Purchases.restorePurchases();
      // return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      console.log('[SubscriptionService] Simulating purchase restore');
      return true;
    } catch (e) {
      console.error('Restore failed:', e);
      return false;
    }
  }
}

export const subscriptionService = new SubscriptionService();
