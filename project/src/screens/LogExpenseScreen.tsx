import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { BottomSheet } from '../components/BottomSheet';
import { TextField, SelectField, OptionList, PrimaryButton } from '../components/FormFields';
import { useCurrency } from '../lib/CurrencyContext';
import { formatCurrency } from '../lib/format';
import { supabase, Account } from '../lib/supabase';
import { 
  Colors, 
  SubcategoryIcons, 
  MainCategoryIcons, 
  CategoryColors,
  SUBCATEGORIES,
  Subcategory,
  MAIN_CATEGORIES,
  MainCategory,
  MAIN_CATEGORY_LABELS,
} from '../lib/theme';

type LogExpenseScreenProps = {
  navigation: any;
  route: any;
};

export function LogExpenseScreen({ navigation, route }: LogExpenseScreenProps) {
  const { currency } = useCurrency();
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subcategory, setSubcategory] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [comment, setComment] = useState('');
  const [showAccounts, setShowAccounts] = useState(false);
  const [showSubcats, setShowSubcats] = useState(false);
  const [showMainCats, setShowMainCats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editId: string | null = route?.params?.editId ?? null;
  const isEditing = !!editId;

  useEffect(() => {
    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('accounts')
          .select('*')
          .order('sort_order', { ascending: true });
        
        if (fetchError) {
          console.error('Error fetching accounts:', fetchError);
          return;
        }

        if (Array.isArray(data)) {
          setAccounts(data as Account[]);
          if (data.length > 0 && !selectedAccount) {
            const firstAcc = data[0] as Account;
            if (firstAcc?.id) {
              setSelectedAccount(firstAcc.id);
            }
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching accounts:', err);
      }
    })();
  }, [selectedAccount]);

  useEffect(() => {
    if (!isEditing || !editId) return;
    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('expense_logs')
          .select('*')
          .eq('id', editId)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching expense log for edit:', fetchError);
          return;
        }

        if (data) {
          setAmount(data.amount !== null && data.amount !== undefined ? String(data.amount) : '');
          setSelectedAccount(data.account_id ?? '');
          setDate(data.date ?? new Date().toISOString().split('T')[0]);
          setSubcategory(data.subcategory ?? '');
          setMainCategory(data.main_category ?? '');
          setComment(data.comment ?? '');
        }
      } catch (err) {
        console.error('Unexpected error fetching expense log:', err);
      }
    })();
  }, [editId, isEditing]);

  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const selectedAcc = safeAccounts.find((a) => a?.id === selectedAccount);

  const handleSave = useCallback(async () => {
    setError(null);
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!selectedAccount) {
      setError('Please select a source bank account');
      return;
    }
    if (!subcategory) {
      setError('Please select a subcategory');
      return;
    }
    if (!mainCategory) {
      setError('Please select a main budget category');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && editId) {
        const { error: updateError } = await supabase
          .from('expense_logs')
          .update({
            account_id: selectedAccount,
            amount: amt,
            date,
            subcategory,
            main_category: mainCategory,
            comment: comment.trim() || null,
          })
          .eq('id', editId);

        if (updateError) {
          setError('Failed to update expense. Please try again.');
          setSaving(false);
          return;
        }
      } else {
        const { error: insertError } = await supabase.from('expense_logs').insert({
          account_id: selectedAccount,
          amount: amt,
          date,
          subcategory,
          main_category: mainCategory,
          comment: comment.trim() || null,
        });

        if (insertError) {
          setError('Failed to save expense. Please try again.');
          setSaving(false);
          return;
        }
      }
      setSaving(false);
      navigation.goBack();
    } catch (err) {
      console.error('Unexpected error saving expense:', err);
      setError('An unexpected error occurred. Please try again.');
      setSaving(false);
    }
  }, [amount, selectedAccount, date, subcategory, mainCategory, comment, navigation, isEditing, editId]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backBtn}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Expense' : 'Log Expense'}</Text>
        <View style={{ width: 28 }} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.formCard}>
            <TextField
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            <SelectField
              label="Source Bank Account"
              value={selectedAcc?.name ?? ''}
              onPress={() => setShowAccounts(true)}
              placeholder="Select account"
            />
            {selectedAcc && (
              <Text style={styles.balanceHint}>
                Current balance: {formatCurrency(Number(selectedAcc.balance ?? 0), currency)}
              </Text>
            )}
            <TextField
              label="Date"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />

            {/* Two-Tier Category Selection */}
            <SelectField
              label="Subcategory"
              value={subcategory}
              onPress={() => setShowSubcats(true)}
              placeholder="Pick a subcategory"
            />
            <SelectField
              label="Main Budget Category"
              value={mainCategory ? (MAIN_CATEGORY_LABELS?.[mainCategory as MainCategory] ?? mainCategory) : ''}
              onPress={() => setShowMainCats(true)}
              placeholder="Map to main category"
            />

            {(subcategory || mainCategory) && (
              <View style={styles.categoryPreview}>
                {subcategory && (
                  <View style={styles.previewChip}>
                    <Text style={styles.previewIcon}>{(SubcategoryIcons as any)?.[subcategory as Subcategory] ?? '🏷️'}</Text>
                    <Text style={styles.previewText}>{subcategory}</Text>
                  </View>
                )}
                {subcategory && mainCategory && <Text style={styles.previewArrow}>→</Text>}
                {mainCategory && (
                  <View style={[styles.previewChip, { backgroundColor: ((CategoryColors?.[mainCategory as MainCategory] ?? Colors.primary)) + '22' }]}>
                    <Text style={styles.previewIcon}>{MainCategoryIcons?.[mainCategory as MainCategory] ?? '📁'}</Text>
                    <Text style={styles.previewText}>{MAIN_CATEGORY_LABELS?.[mainCategory as MainCategory] ?? mainCategory}</Text>
                  </View>
                )}
              </View>
            )}

            <TextField
              label="Description / Comment"
              value={comment}
              onChangeText={setComment}
              placeholder="e.g. Pizza's For Weekend Party At Home"
              multiline
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <PrimaryButton
              label={saving ? 'Saving...' : isEditing ? 'Update Expense' : 'Save Expense'}
              onPress={handleSave}
              disabled={saving}
              color={Colors.error}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={showAccounts} onClose={() => setShowAccounts(false)} title="Select Source Account">
        <ScrollView>
          <OptionList
            options={safeAccounts.map((a) => ({ label: a?.name ?? 'Unnamed Account', value: a?.id ?? '' }))}
            onSelect={(v) => { setSelectedAccount(v); setShowAccounts(false); }}
            selected={selectedAccount}
          />
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={showSubcats} onClose={() => setShowSubcats(false)} title="Select Subcategory">
        <ScrollView>
          <OptionList
            options={(SUBCATEGORIES ?? []).map((s) => ({ label: s, value: s, icon: (SubcategoryIcons as any)?.[s] ?? '🏷️' }))}
            onSelect={(v) => { setSubcategory(v); setShowSubcats(false); }}
            selected={subcategory}
          />
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={showMainCats} onClose={() => setShowMainCats(false)} title="Select Main Budget Category">
        <ScrollView>
          <OptionList
            options={(MAIN_CATEGORIES ?? []).map((c) => ({
              label: MAIN_CATEGORY_LABELS?.[c] ?? c,
              value: c,
              icon: MainCategoryIcons?.[c] ?? '📁',
              color: CategoryColors?.[c] ?? Colors.primary,
            }))}
            onSelect={(v) => { setMainCategory(v); setShowMainCats(false); }}
            selected={mainCategory}
          />
        </ScrollView>
      </BottomSheet>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    fontSize: 22,
    color: Colors.textSecondary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  formCard: {
    marginBottom: 16,
  },
  balanceHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 2,
  },
  categoryPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  previewText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  previewArrow: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: 12,
  },
});
