import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createTranslator,
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
  type TranslationKey,
} from "./index";

export interface LocaleStorage {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
}

const defaultStorage: LocaleStorage = {
  getItem: (key) => (typeof localStorage !== "undefined" ? localStorage.getItem(key) : null),
  setItem: (key, value) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  },
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  storage = defaultStorage,
}: {
  children: React.ReactNode;
  storage?: LocaleStorage;
}) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.getItem(LOCALE_STORAGE_KEY);
        if (stored && isLocale(stored)) setLocaleState(stored);
      } catch {
        /* ignore */
      }
    })();
  }, [storage]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      void Promise.resolve(storage.setItem(LOCALE_STORAGE_KEY, next));
    },
    [storage]
  );

  const t = useMemo(() => createTranslator(locale), [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useT() {
  return useLocale().t;
}
