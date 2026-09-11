import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { PieChart, PieSlice } from '../components/PieChart';
import { useCurrency } from '../lib/CurrencyContext';
import { formatCurrency, isSameMonth, isSameYear, getMonthName } from '../lib/format';
import {
  supabase,
  IncomeLog,
  ExpenseLog,
  Account,
  MAIN_CATEGORIES,
  MainCategory,
  SUBCATEGORIES,
  Subcategory,
  MAIN_CATEGORY_LABELS,
} from '../lib/supabase';
import { Colors, CategoryColors, SubcategoryIcons, MainCategoryIcons, PieChartColors } from '../lib/theme';

type HistoryScreenProps = {
  navigation: any;
};

type ViewMode = 'monthly' | 'yearly';
type ChartMode = 'main' | 'sub';

export function HistoryScreen({ navigation }: HistoryScreenProps) {
  const { currency } = useCurrency();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [chartMode, setChartMode] = useState<ChartMode>('main');
  const [incomeLogs, setIncomeLogs] = useState<IncomeLog[]>([]);
  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [incRes, expRes, accRes] = await Promise.all([
        supabase.from('income_logs').select('*').order('date', { ascending: false }),
        supabase.from('expense_logs').select('*').order('date', { ascending: false }),
        supabase.from('accounts').select('*').order('sort_order', { ascending: true }),
      ]);
      if (incRes.data) setIncomeLogs(incRes.data as IncomeLog[]);
      if (expRes.data) setExpenseLogs(expRes.data as ExpenseLog[]);
      if (accRes.data) setAccounts(accRes.data as Account[]);
    } catch (err) {
      console.error('Error fetching history data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Build periods safely
  const periods: { label: string; match: (d: string) => boolean }[] = [];
  const now = new Date();

  if (viewMode === 'monthly') {
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push({
        label: `${getMonthName(d.getMonth())} ${d.getFullYear()}`,
        match: (dateStr: string) => dateStr ? isSameMonth(dateStr, d) : false,
      });
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const year = now.getFullYear() - i;
      periods.push({
        label: `${year}`,
        match: (dateStr: string) => dateStr ? isSameYear(dateStr, new Date(year, 0, 1)) : false,
      });
    }
  }

  const safeIncomeLogs = Array.isArray(incomeLogs) ? incomeLogs : [];
  const safeExpenseLogs = Array.isArray(expenseLogs) ? expenseLogs : [];

  const currentPeriod = periods[selectedPeriod] ?? periods[0];
  const periodIncome = safeIncomeLogs.filter((i) => i?.date && currentPeriod?.match(i.date));
  const periodExpenses = safeExpenseLogs.filter((e) => e?.date && currentPeriod?.match(e.date));
  
  const totalIncome = periodIncome.reduce((s, i) => s + Number(i?.amount ?? 0), 0);
  const totalExpenses = periodExpenses.reduce((s, e) => s + Number(e?.amount ?? 0), 0);
  const netSavings = totalIncome - totalExpenses;

  // Build pie chart data safely
  const pieSlices: PieSlice[] = [];
  if (chartMode === 'main') {
    (MAIN_CATEGORIES ?? []).forEach((cat: MainCategory) => {
      const total = periodExpenses
        .filter((e) => e?.main_category === cat)
        .reduce((s, e) => s + Number(e?.amount ?? 0), 0);
      if (total > 0) {
        pieSlices.push({
          label: MAIN_CATEGORY_LABELS[cat] ?? cat,
          value: total,
          color: CategoryColors[cat] ?? Colors.primary,
        });
      }
    });
  } else {
    (SUBCATEGORIES ?? []).forEach((sub: Subcategory, idx: number) => {
      const total = periodExpenses
        .filter((e) => e?.subcategory === sub)
        .reduce((s, e) => s + Number(e?.amount ?? 0), 0);
      if (total > 0) {
        pieSlices.push({
          label: sub,
          value: total,
          color: PieChartColors[idx % PieChartColors.length],
        });
      }
    });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>History & Reports</Text>
          <Text style={styles.headerSubtitle}>Income vs Expenses breakdown</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('SettingsTab')}>
          <View style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* View Mode Toggle */}
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleActive]}
            onPress={() => { setViewMode('monthly'); setSelectedPeriod(0); }}
          >
            <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'yearly' && styles.toggleActive]}
            onPress={() => { setViewMode('yearly'); setSelectedPeriod(0); }}
          >
            <Text style={[styles.toggleText, viewMode === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
          </Pressable>
        </View>

        {/* Period Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
          {periods.map((p, i) => (
            <Pressable
              key={p.label}
              style={[styles.periodChip, selectedPeriod === i && styles.periodChipActive]}
              onPress={() => setSelectedPeriod(i)}
            >
              <Text style={[styles.periodChipText, selectedPeriod === i && styles.periodChipTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              {formatCurrency(totalIncome, currency)}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: Colors.error }]}>
              {formatCurrency(totalExpenses, currency)}
            </Text>
          </Card>
        </View>
        <Card elevated style={styles.netCard}>
          <Text style={styles.netLabel}>Net Savings</Text>
          <Text style={[styles.netValue, { color: netSavings >= 0 ? Colors.success : Colors.error }]}>
            {formatCurrency(netSavings, currency)}
          </Text>
        </Card>

        {/* Pie Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartToggleRow}>
            <Pressable
              style={[styles.chartToggle, chartMode === 'main' && styles.chartToggleActive]}
              onPress={() => setChartMode('main')}
            >
              <Text style={[styles.chartToggleText, chartMode === 'main' && styles.chartToggleTextActive]}>
                Main Categories
              </Text>
            </Pressable>
            <Pressable
              style={[styles.chartToggle, chartMode === 'sub' && styles.chartToggleActive]}
              onPress={() => setChartMode('sub')}
            >
              <Text style={[styles.chartToggleText, chartMode === 'sub' && styles.chartToggleTextActive]}>
                Subcategories
              </Text>
            </Pressable>
          </View>

          {pieSlices.length > 0 ? (
            <>
              <View style={styles.chartWrap}>
                <PieChart slices={pieSlices} size={180} />
              </View>
              <View style={styles.legendWrap}>
                {pieSlices.map((slice, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>{slice.label}</Text>
                    <Text style={styles.legendValue}>{formatCurrency(slice.value, currency)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No expense data for this period</Text>
            </View>
          )}
        </Card>

        {/* Breakdown by Main Category */}
        {chartMode === 'main' && (
          <>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            <Card style={styles.breakdownCard}>
              {(MAIN_CATEGORIES ?? []).map((cat: MainCategory) => {
                const total = periodExpenses
                  .filter((e) => e?.main_category === cat)
                  .reduce((s, e) => s + Number(e?.amount ?? 0), 0);
                return (
                  <View key={cat} style={styles.breakdownRow}>
                    <Text style={styles.breakdownIcon}>{MainCategoryIcons[cat] ?? '📁'}</Text>
                    <Text style={styles.breakdownName}>{MAIN_CATEGORY_LABELS[cat] ?? cat}</Text>
                    <Text style={styles.breakdownAmount}>{formatCurrency(total, currency)}</Text>
                  </View>
                );
              })}
            </Card>
          </>
        )}

        {/* Breakdown by Subcategory */}
        {chartMode === 'sub' && (
          <>
            <Text style={styles.sectionTitle}>Subcategory Breakdown</Text>
            <Card style={styles.breakdownCard}>
              {(SUBCATEGORIES ?? []).map((sub: Subcategory) => {
                const total = periodExpenses
                  .filter((e) => e?.subcategory === sub)
                  .reduce((s, e) => s + Number(e?.amount ?? 0), 0);
                if (total === 0) return null;
                return (
                  <View key={sub} style={styles.breakdownRow}>
                    <Text style={styles.breakdownIcon}>{(SubcategoryIcons as any)[sub] ?? '🏷️'}</Text>
                    <Text style={styles.breakdownName}>{sub}</Text>
                    <Text style={styles.breakdownAmount}>{formatCurrency(total, currency)}</Text>
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingsIcon: {
    fontSize: 22,
  },
  scroll: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  periodScroll: {
    marginBottom: 16,
  },
  periodChip: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodChipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  periodChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  netCard: {
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  netValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  chartCard: {
    marginBottom: 16,
    padding: 20,
  },
  chartToggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  chartToggle: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  chartToggleActive: {
    backgroundColor: Colors.cardElevated,
  },
  chartToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  chartToggleTextActive: {
    color: Colors.text,
  },
  chartWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  legendWrap: {
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  breakdownCard: {
    padding: 4,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breakdownIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  breakdownName: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  breakdownAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
});
