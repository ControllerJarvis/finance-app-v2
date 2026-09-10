import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/Card';
import { useCurrency } from '../lib/CurrencyContext';
import { CURRENCY_OPTIONS, CurrencyCode, supabase, Account } from '../lib/supabase';
import { Colors } from '../lib/theme';


type SettingsScreenProps = {
  navigation: any;
};

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { currency, setCurrency } = useCurrency();
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccountName, setNewAccountName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .order('sort_order', { ascending: true });
      if (data) setAccounts(data as Account[]);
    })();
  }, []);

  const handleCurrencyChange = useCallback(async (c: CurrencyCode) => {
    await setCurrency(c);
  }, [setCurrency]);

  const handleAddAccount = useCallback(async () => {
    if (!newAccountName.trim()) return;
    setAdding(true);
    const maxOrder = accounts.reduce((max, a) => Math.max(max, a.sort_order), 0);
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        name: newAccountName.trim(),
        balance: 0,
        is_preloaded: false,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();
    setAdding(false);
    if (error) {
      Alert.alert('Error', 'Failed to add account');
      return;
    }
    if (data) {
      setAccounts([...accounts, data as Account]);
      setNewAccountName('');
    }
  }, [newAccountName, accounts]);

  const handleDeleteAccount = useCallback(async (acc: Account) => {
    if (acc.is_preloaded) {
      Alert.alert('Cannot Delete', 'Pre-loaded accounts cannot be removed.');
      return;
    }
    Alert.alert(
      'Delete Account',
      `Remove "${acc.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('accounts').delete().eq('id', acc.id);
            if (error) {
              Alert.alert('Error', 'Failed to delete account');
              return;
            }
            setAccounts(accounts.filter((a) => a.id !== acc.id));
          },
        },
      ]
    );
  }, [accounts]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ width: 28 }} />
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Currency Section */}
        <Text style={styles.sectionTitle}>Preferred Currency</Text>
        <Card style={styles.sectionCard}>
          {CURRENCY_OPTIONS.map((opt) => (
            <Pressable
              key={opt.symbol}
              style={({ pressed }) => [
                styles.currencyRow,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => handleCurrencyChange(opt.symbol)}
            >
              <View style={styles.currencyInfo}>
                <Text style={styles.currencySymbol}>{opt.symbol}</Text>
                <View>
                  <Text style={styles.currencyLabel}>{opt.label}</Text>
                  <Text style={styles.currencyCode}>{opt.code}</Text>
                </View>
              </View>
              {currency === opt.symbol && (
                <View style={styles.selectedDot}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </Card>

        {/* Accounts Section */}
        <Text style={styles.sectionTitle}>Bank Accounts</Text>
        <Card style={styles.sectionCard}>
          {accounts.map((acc) => (
            <View key={acc.id} style={styles.accountRow}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{acc.name}</Text>
                {acc.is_preloaded && <Text style={styles.preloadedBadge}>Pre-loaded</Text>}
              </View>
              {!acc.is_preloaded && (
                <Pressable onPress={() => handleDeleteAccount(acc)} hitSlop={12}>
                  <Text style={styles.deleteBtn}>Delete</Text>
                </Pressable>
              )}
            </View>
          ))}
        </Card>

        {/* Add Account */}
        <Text style={styles.sectionTitle}>Add Custom Account</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              value={newAccountName}
              onChangeText={setNewAccountName}
              placeholder="Account name"
              placeholderTextColor={Colors.textMuted}
            />
            <Pressable
              style={[styles.addBtn, (!newAccountName.trim() || adding) && { opacity: 0.4 }]}
              onPress={handleAddAccount}
              disabled={!newAccountName.trim() || adding}
            >
              <Text style={styles.addBtnText}>{adding ? '...' : 'Add'}</Text>
            </Pressable>
          </View>
        </Card>

        <Text style={styles.footerText}>Finance By Usman Afzal</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 24,
  },
  sectionCard: {
    padding: 4,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginRight: 16,
    minWidth: 40,
  },
  currencyLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  currencyCode: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  selectedDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  preloadedBadge: {
    fontSize: 11,
    color: Colors.primary,
    marginLeft: 10,
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '600',
  },
  deleteBtn: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  footerVersion: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
