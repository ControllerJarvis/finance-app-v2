import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Account = {
  id: string;
  name: string;
  balance: number;
  is_preloaded: boolean;
  sort_order: number;
  created_at: string;
};

export type IncomeLog = {
  id: string;
  account_id: string | null;
  amount: number;
  date: string;
  comment: string | null;
  created_at: string;
};

export type ExpenseLog = {
  id: string;
  account_id: string | null;
  amount: number;
  date: string;
  subcategory: string;
  main_category: string;
  comment: string | null;
  created_at: string;
};

export type Transfer = {
  id: string;
  from_account_id: string | null;
  to_account_id: string | null;
  amount: number;
  date: string;
  comment: string | null;
  created_at: string;
};

export type CurrencyCode = 'Rs.' | '$' | '€';

export const CURRENCY_OPTIONS: { label: string; symbol: CurrencyCode; code: string }[] = [
  { label: 'Pakistani Rupee', symbol: 'Rs.', code: 'PKR' },
  { label: 'US Dollar', symbol: '$', code: 'USD' },
  { label: 'Euro', symbol: '€', code: 'EUR' },
];

export const SUBCATEGORIES = [
  'Bills',
  'Transportation',
  'Food',
  'Entertainment',
  'Home',
  'Loan Given',
  'Loan Received',
  'Office',
  'Clothing',
  'Social',
  'Gaming',
] as const;

export type Subcategory = (typeof SUBCATEGORIES)[number];

export const MAIN_CATEGORIES = [
  'Family',
  'Emergency/Savings',
  'Self-Usage',
  'Charity',
  'Worryless Spendings',
] as const;

export type MainCategory = (typeof MAIN_CATEGORIES)[number];

export const BUDGET_RULES: Record<MainCategory, number> = {
  Family: 0.4,
  'Emergency/Savings': 0.2,
  'Self-Usage': 0.2,
  Charity: 0.1,
  'Worryless Spendings': 0.1,
};

export const MAIN_CATEGORY_LABELS: Record<MainCategory, string> = {
  Family: 'Family Budget',
  'Emergency/Savings': 'Target to Save',
  'Self-Usage': 'Self-Usage',
  Charity: 'Charity',
  'Worryless Spendings': 'Worryless Spendings',
};
