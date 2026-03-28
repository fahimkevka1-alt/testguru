export type CampaignGoal = 'Website Traffic' | 'Sales' | 'Lead Generation' | 'Brand Awareness';

export interface Ad {
  headline1: string;
  headline2: string;
  headline3?: string;
  description1: string;
  description2: string;
}

export interface AdGroup {
  name: string;
  keywords: string[];
  suggestedKeywords?: string[];
  ads: Ad[];
}

export interface ExpectedKpis {
  ctr: string;
  conversionRate: string;
  cpa: string;
}

export interface Campaign {
  campaignName: string;
  goal: CampaignGoal;
  adGroups: AdGroup[];
  negativeKeywords?: string[];
  expectedKpis: ExpectedKpis;
}

export interface PricingTier {
  tierName: string;
  monthlyBudget: number;
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  campaign?: Campaign;
  pricingTiers?: PricingTier[];
}