import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { SpeedDial } from '../components/SpeedDial';
import { useCurrency } from '../lib/CurrencyContext';
import { formatCurrency, isSameMonth, formatDate } from '../lib/format';
import {
  supabase,
  Account,
  IncomeLog,
  ExpenseLog,
  Transfer,
  MainCategory,
  MAIN_CATEGORIES,
  BUDGET_RULES,
  MAIN_CATEGORY_LABELS,
} from '../lib/supabase';
import { Colors, CategoryColors, MainCategoryIcons, SubcategoryIcons } from '../lib/theme';

type RecentTransaction = {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string;
  comment: string | null;
  subcategory?: string;
  main_category?: string;
  account_name?: string;
  from_account?: string;
  to_account?: string;
};

type HomeScreenProps = {
  navigation: any;
};

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { currency } = useCurrency();
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [incomeLogs, setIncomeLogs] = useState<IncomeLog[]>([]);
  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [recent, setRecent] = useState<RecentTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [accRes, incRes, expRes, trRes] = await Promise.all([
      supabase.from('accounts').select('*').order('sort_order', { ascending: true }),
      supabase.from('income_logs').select('*').order('date', { ascending: false }),
      supabase.from('expense_logs').select('*').order('date', { ascending: false }),
      supabase.from('transfers').select('*').order('date', { ascending: false }),
    ]);

    setAccounts((accRes.data as Account[]) ?? []);
    setIncomeLogs((incRes.data as IncomeLog[]) ?? []);
    setExpenseLogs((expRes.data as ExpenseLog[]) ?? []);
    setTransfers((trRes.data as Transfer[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const safeIncome = incomeLogs ?? [];
    const safeExpense = expenseLogs ?? [];
    const safeTransfers = transfers ?? [];
    const safeAccounts = accounts ?? [];

    const merged: RecentTransaction[] = [
      ...safeIncome.map((i) => {
        const acc = safeAccounts.find((a) => a.id === i.account_id);
        return {
          id: i.id,
          type: 'income' as const,
          amount: i.amount,
          date: i.date,
          comment: i.comment,
          account_name: acc?.name,
        };
      }),
      ...safeExpense.map((e) => {
        const acc = safeAccounts.find((a) => a.id === e.account_id);
        return {
          id: e.id,
          type: 'expense' as const,
          amount: e.amount,
          date: e.date,
          comment: e.comment,
          subcategory: e.subcategory,
          main_category: e.main_category,
          account_name: acc?.name,
        };
      }),
      ...safeTransfers.map((t) => {
        const from = safeAccounts.find((a) => a.id === t.from_account_id);
        const to = safeAccounts.find((a) => a.id === t.to_account_id);
        return {
          id: t.id,
          type: 'transfer' as const,
          amount: t.amount,
          date: t.date,
          comment: t.comment,
          from_account: from?.name,
          to_account: to?.name,
        };
      }),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setRecent(merged.slice(0, 15));
  }, [incomeLogs, expenseLogs, transfers, accounts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const now = new Date();
  const monthIncome = (incomeLogs ?? []).filter((i) => isSameMonth(i.date, now));
  const totalMonthIncome = monthIncome.reduce((sum, i) => sum + Number(i.amount), 0);

  const monthExpenses = (expenseLogs ?? []).filter((e) => isSameMonth(e.date, now));
  const totalSavings = (incomeLogs ?? []).reduce((s, i) => s + Number(i.amount), 0) - (expenseLogs ?? []).reduce((s, e) => s + Number(e.amount), 0);

  const spentByCategory: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    spentByCategory[e.main_category] = (spentByCategory[e.main_category] ?? 0) + Number(e.amount);
  });

  const totalBalance = (accounts ?? []).reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top + 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>Finance</Text>
            <Text style={styles.appSubtitle}>By Usman Afzal</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('SettingsTab')}>
            <View style={styles.settingsBtn}>
              <Text style={styles.settingsIcon}>⚙</Text>
            </View>
          </Pressable>
        </View>

        {/* Total Balance Card */}
        <Card elevated style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalBalance, currency)}</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalCol}>
              <Text style={styles.totalColLabel}>This Month Income</Text>
              <Text style={[styles.totalColValue, { color: Colors.success }]}>
                {formatCurrency(totalMonthIncome, currency)}
              </Text>
            </View>
            <View style={styles.totalCol}>
              <Text style={styles.totalColLabel}>Total Savings</Text>
              <Text style={[styles.totalColValue, { color: Colors.accent }]}>
                {formatCurrency(totalSavings, currency)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Bank Accounts */}
        <Text style={styles.sectionTitle}>Bank Accounts</Text>
        <View style={styles.accountsGrid}>
          {(accounts ?? []).map((acc) => (
            <Card key={acc.id} style={styles.accountCard}>
              <Text style={styles.accountName} numberOfLines={1}>{acc.name}</Text>
              <Text style={styles.accountBalance}>{formatCurrency(Number(acc.balance), currency)}</Text>
            </Card>
          ))}
        </View>

        {/* Budget Progress */}
        <Text style={styles.sectionTitle}>Monthly Budget Guidelines</Text>
        {totalMonthIncome > 0 ? (
          <Card style={styles.budgetCard}>
            {(MAIN_CATEGORIES ?? []).map((cat: MainCategory) => {
              const limit = totalMonthIncome * BUDGET_RULES[cat];
              const spent = spentByCategory[cat] ?? 0;
              const progress = limit > 0 ? spent / limit : 0;
              const breached = spent > limit;
              return (
                <View key={cat} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetIcon}>{MainCategoryIcons[cat]}</Text>
                    <Text style={styles.budgetName}>{MAIN_CATEGORY_LABELS[cat]}</Text>
                    <Text
                      style={[
                        styles.budgetAmount,
                        breached && { color: Colors.error },
                      ]}
                    >
                      {formatCurrency(spent, currency)} / {formatCurrency(limit, currency)}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={progress}
                    color={CategoryColors[cat]}
                    breached={breached}
                    height={8}
                  />
                </View>
              );
            })}
          </Card>
        ) : (
          <Card style={styles.emptyBudget}>
            <Text style={styles.emptyBudgetText}>
              Log your monthly income to see budget guidelines
            </Text>
            <Pressable onPress={() => navigation.navigate('LogIncome')}>
              <Text style={styles.emptyBudgetLink}>Log Income →</Text>
            </Pressable>
          </Card>
        )}

        {/* Recent Transactions */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {(recent ?? []).length === 0 && !loading ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No transactions yet. Tap "Log Expense" to get started.</Text>
          </Card>
        ) : (
          <View style={styles.txList}>
            {(recent ?? []).map((tx) => (
              <Pressable
                key={`${tx.type}-${tx.id}`}
                onPress={() => {
                  if (tx.type === 'income') {
                    navigation.navigate('LogIncome', { editId: tx.id });
                  } else if (tx.type === 'expense') {
                    navigation.navigate('LogExpense', { editId: tx.id });
                  } else {
                    navigation.navigate('Transfer', { editId: tx.id });
                  }
                }}
                style={({ pressed }) => pressed && { opacity: 0.7 }}
              >
                <Card key={`${tx.type}-${tx.id}`} style={styles.txCard}>
                  <View style={styles.txRow}>
                  <View style={styles.txIconWrap}>
                    <Text style={styles.txIcon}>
                      {tx.type === 'income' ? '💰' : tx.type === 'expense' ? (SubcategoryIcons as any)[tx.subcategory ?? ''] ?? '💸' : '🔄'}
                    </Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {tx.type === 'income'
                        ? `Income → ${tx.account_name ?? 'Account'}`
                        : tx.type === 'expense'
                        ? `${tx.subcategory} → ${tx.main_category}`
                        : `${tx.from_account} → ${tx.to_account}`}
                    </Text>
                    <Text style={styles.txComment} numberOfLines={1}>
                      {tx.comment || 'No comment'}
                    </Text>
                    <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: tx.type === 'income' ? Colors.success : tx.type === 'expense' ? Colors.error : Colors.accent },
                    ]}
                  >
                    {tx.type === 'expense' ? '-' : '+'}
                    {formatCurrency(tx.amount, currency)}
                  </Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <SpeedDial
        actions={[
          {
            label: 'Log Income',
            icon: '+',
            color: Colors.success,
            onPress: () => navigation.navigate('LogIncome'),
          },
          {
            label: 'Log Expense',
            icon: '−',
            color: Colors.error,
            onPress: () => navigation.navigate('LogExpense'),
          },
          {
            label: 'Transfer',
            icon: '🔄',
            color: Colors.accent,
            onPress: () => navigation.navigate('Transfer'),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  appSubtitle: {
    fontSize: 14,
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
  totalCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalCol: {
    flex: 1,
  },
  totalColLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  totalColValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  accountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  accountCard: {
    width: '48%',
    flexGrow: 1,
    padding: 14,
  },
  accountName: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  budgetCard: {
    marginHorizontal: 16,
  },
  budgetItem: {
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  budgetName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  budgetAmount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyBudget: {
    marginHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyBudgetText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyBudgetLink: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  txList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  txCard: {
    padding: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txIcon: {
    fontSize: 20,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  txComment: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  txDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCard: {
    marginHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
