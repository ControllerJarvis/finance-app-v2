import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, CurrencyCode } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENCY_CACHE_KEY = '@finance_currency';

type CurrencyContextType = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => Promise<void>;
  loading: boolean;
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'Rs.',
  setCurrency: async () => {},
  loading: true,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('Rs.');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CURRENCY_CACHE_KEY);
        if (cached) {
          setCurrencyState(cached as CurrencyCode);
        }
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'currency')
          .maybeSingle();
        if (data?.value) {
          setCurrencyState(data.value as CurrencyCode);
          await AsyncStorage.setItem(CURRENCY_CACHE_KEY, data.value);
        }
      } catch {
        // use cached or default
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setCurrency = useCallback(async (c: CurrencyCode) => {
    setCurrencyState(c);
    await AsyncStorage.setItem(CURRENCY_CACHE_KEY, c);
    await supabase
      .from('settings')
      .upsert({ key: 'currency', value: c, updated_at: new Date().toISOString() });
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
