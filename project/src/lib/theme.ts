import { MainCategory, Subcategory } from './supabase';

export const Colors = {
  bg: '#0A0B0F',
  bgElevated: '#13151B',
  card: '#1A1D26',
  cardElevated: '#22262F',
  border: '#2A2E3A',
  borderLight: '#353945',
  text: '#F4F5F7',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  success: '#10B981',
  successDark: '#059669',
  warning: '#F59E0B',
  error: '#EF4444',
  errorDark: '#DC2626',
  accent: '#8B5CF6',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.6)',
};

export const CategoryColors: Record<MainCategory, string> = {
  Family: '#3B82F6',
  'Emergency/Savings': '#10B981',
  'Self-Usage': '#F59E0B',
  Charity: '#8B5CF6',
  'Worryless Spendings': '#EC4899',
};

export const SubcategoryIcons: Record<Subcategory, string> = {
  Bills: '📄',
  Transportation: '🚗',
  Food: '🍽️',
  Entertainment: '🎬',
  Home: '🏠',
  'Loan Given': '📤',
  'Loan Received': '📥',
  Office: '💼',
  Clothing: '👕',
  Social: '👥',
  Gaming: '🎮',
};

export const MainCategoryIcons: Record<MainCategory, string> = {
  Family: '👨‍👩‍👧‍👦',
  'Emergency/Savings': '🏦',
  'Self-Usage': '😎',
  Charity: '🤝',
  'Worryless Spendings': '🎉',
};

export const PieChartColors = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#A855F7',
  '#14B8A6',
  '#EAB308',
];
