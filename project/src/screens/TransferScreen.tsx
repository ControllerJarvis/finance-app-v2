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

type TransferScreenProps = {
  navigation: any;
  route: any;
};

export function TransferScreen({ navigation, route }: TransferScreenProps) {
  const { currency } = useCurrency();
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [amount, setAmount] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [comment, setComment] = useState('');
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
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
      if (data) setAccounts(data as Account[]);
    })();
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      const { data } = await supabase
        .from('transfers')
        .select('*')
        .eq('id', editId)
        .maybeSingle();
      if (data) {
        setAmount(String(data.amount));
        setFromAccount(data.from_account_id ?? '');
        setToAccount(data.to_account_id ?? '');
        setDate(data.date);
        setComment(data.comment ?? '');
      }
    })();
  }, [editId, isEditing]);

  const fromAcc = accounts.find((a) => a.id === fromAccount);
  const toAcc = accounts.find((a) => a.id === toAccount);

  const handleSave = useCallback(async () => {
    setError(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!fromAccount) {
      setError('Please select a source account');
      return;
    }
    if (!toAccount) {
      setError('Please select a destination account');
      return;
    }
    if (fromAccount === toAccount) {
      setError('Source and destination must be different');
      return;
    }
    setSaving(true);
    if (isEditing) {
      const { error: updateError } = await supabase
        .from('transfers')
        .update({
          from_account_id: fromAccount,
          to_account_id: toAccount,
          amount: amt,
          date,
          comment: comment.trim() || null,
        })
        .eq('id', editId);
      setSaving(false);
      if (updateError) {
        setError('Failed to update transfer. Please try again.');
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('transfers').insert({
        from_account_id: fromAccount,
        to_account_id: toAccount,
        amount: amt,
        date,
        comment: comment.trim() || null,
      });
      setSaving(false);
      if (insertError) {
        setError('Failed to save transfer. Please try again.');
        return;
      }
    }
    navigation.goBack();
  }, [amount, fromAccount, toAccount, date, comment, navigation, isEditing, editId]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backBtn}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Transfer' : 'Internal Transfer'}</Text>
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
            <SelectField
              label="From Account"
              value={fromAcc?.name ?? ''}
              onPress={() => setShowFrom(true)}
              placeholder="Select source account"
            />
            {fromAcc && (
              <Text style={styles.balanceHint}>
                Balance: {formatCurrency(Number(fromAcc.balance), currency)}
              </Text>
            )}
            <SelectField
              label="To Account"
              value={toAcc?.name ?? ''}
              onPress={() => setShowTo(true)}
              placeholder="Select destination account"
            />
            {toAcc && (
              <Text style={styles.balanceHint}>
                Balance: {formatCurrency(Number(toAcc.balance), currency)}
              </Text>
            )}
            <TextField
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
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
              placeholder="e.g. Moving savings to JazzCash"
              multiline
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <PrimaryButton
              label={saving ? 'Saving...' : isEditing ? 'Update Transfer' : 'Save Transfer'}
              onPress={handleSave}
              disabled={saving}
              color={Colors.accent}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={showFrom} onClose={() => setShowFrom(false)} title="From Account">
        <ScrollView>
          <OptionList
            options={accounts.map((a) => ({ label: a.name, value: a.id }))}
            onSelect={(v) => { setFromAccount(v); setShowFrom(false); }}
            selected={fromAccount}
          />
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={showTo} onClose={() => setShowTo(false)} title="To Account">
        <ScrollView>
          <OptionList
            options={accounts.map((a) => ({ label: a.name, value: a.id }))}
            onSelect={(v) => { setToAccount(v); setShowTo(false); }}
            selected={toAccount}
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
});
