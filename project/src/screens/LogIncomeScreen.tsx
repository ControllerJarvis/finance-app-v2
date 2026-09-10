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
import { Colors } from '../lib/theme';

type LogIncomeScreenProps = {
  navigation: any;
  route: any;
};

export function LogIncomeScreen({ navigation, route }: LogIncomeScreenProps) {
  const { currency } = useCurrency();
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [comment, setComment] = useState('');
  const [showAccounts, setShowAccounts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editId: string | null = route?.params?.editId ?? null;
  const isEditing = !!editId;

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .order('sort_order', { ascending: true });
      if (data) {
        setAccounts(data as Account[]);
        if (data.length > 0 && !selectedAccount) {
          setSelectedAccount((data[0] as Account).id);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      const { data } = await supabase
        .from('income_logs')
        .select('*')
        .eq('id', editId)
        .maybeSingle();
      if (data) {
        setAmount(String(data.amount));
        setSelectedAccount(data.account_id ?? '');
        setDate(data.date);
        setComment(data.comment ?? '');
      }
    })();
  }, [editId, isEditing]);

  const selectedAcc = accounts.find((a) => a.id === selectedAccount);

  const handleSave = useCallback(async () => {
    setError(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!selectedAccount) {
      setError('Please select a bank account');
      return;
    }
    setSaving(true);
    if (isEditing) {
      const { error: updateError } = await supabase
        .from('income_logs')
        .update({
          account_id: selectedAccount,
          amount: amt,
          date,
          comment: comment.trim() || null,
        })
        .eq('id', editId);
      setSaving(false);
      if (updateError) {
        setError('Failed to update income. Please try again.');
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('income_logs').insert({
        account_id: selectedAccount,
        amount: amt,
        date,
        comment: comment.trim() || null,
      });
      setSaving(false);
      if (insertError) {
        setError('Failed to save income. Please try again.');
        return;
      }
    }
    navigation.goBack();
  }, [amount, selectedAccount, date, comment, navigation, isEditing, editId]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backBtn}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Income' : 'Log Income'}</Text>
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
              label="Deposit To (Bank Account)"
              value={selectedAcc?.name ?? ''}
              onPress={() => setShowAccounts(true)}
              placeholder="Select account"
            />
            {selectedAcc && (
              <Text style={styles.balanceHint}>
                Current balance: {formatCurrency(Number(selectedAcc.balance), currency)}
              </Text>
            )}
            <TextField
              label="Date"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
            <TextField
              label="Comments / Purpose"
              value={comment}
              onChangeText={setComment}
              placeholder="e.g. Monthly salary for September"
              multiline
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <PrimaryButton
              label={saving ? 'Saving...' : isEditing ? 'Update Income' : 'Save Income'}
              onPress={handleSave}
              disabled={saving}
              color={Colors.success}
            />
          </Card>

          {!isEditing && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>How Income Works</Text>
              <Text style={styles.infoText}>
                100% of the logged amount is added directly to your selected bank account. The system
                then calculates your monthly budget guidelines automatically:
              </Text>
              <Text style={styles.infoLine}>• 40% Family Budget Limit</Text>
              <Text style={styles.infoLine}>• 20% Target to Save (Emergency/Savings)</Text>
              <Text style={styles.infoLine}>• 20% Self-Usage Budget Limit</Text>
              <Text style={styles.infoLine}>• 10% Charity Budget Limit</Text>
              <Text style={styles.infoLine}>• 10% Worryless Spendings Limit</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={showAccounts}
        onClose={() => setShowAccounts(false)}
        title="Select Bank Account"
      >
        <ScrollView>
          <OptionList
            options={accounts.map((a) => ({ label: a.name, value: a.id }))}
            onSelect={(v) => {
              setSelectedAccount(v);
              setShowAccounts(false);
            }}
            selected={selectedAccount}
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
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  infoLine: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
