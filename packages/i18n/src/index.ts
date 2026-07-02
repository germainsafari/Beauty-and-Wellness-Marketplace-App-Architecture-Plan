import { en, type TranslationKey } from "./locales/en";
import { rw } from "./locales/rw";
import { fr } from "./locales/fr";
import { sw } from "./locales/sw";

export type Locale = "en" | "rw" | "fr" | "sw";

export const LOCALES: { code: Locale; labelKey: TranslationKey }[] = [
  { code: "en", labelKey: "lang.en" },
  { code: "rw", labelKey: "lang.rw" },
  { code: "fr", labelKey: "lang.fr" },
  { code: "sw", labelKey: "lang.sw" },
];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "hafi_locale";

const catalogs: Record<Locale, Record<TranslationKey, string>> = { en, rw, fr, sw };

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "rw" || value === "fr" || value === "sw";
}

export function translate(locale: Locale, key: TranslationKey): string {
  return catalogs[locale]?.[key] ?? catalogs.en[key] ?? key;
}

export function createTranslator(locale: Locale) {
  return (key: TranslationKey) => translate(locale, key);
}

/** AI system-prompt language instruction per locale */
export const AI_LOCALE_INSTRUCTIONS: Record<Locale, string> = {
  en: "Always respond in English unless the user writes in another language.",
  rw: "Subiza mu Kinyarwanda (Ikinyarwanda). Koresha imvugo isobanutse kandi y'ubuhanga.",
  fr: "Répondez toujours en français (Français).",
  sw: "Jibu kila wakati kwa Kiswahili.",
};

export const AI_GREETINGS: Record<Locale, string> = {
  en: "Hey! 💜 I'm Hafi AI — your local service concierge. I search our live database for electricians, mechanics, salons, lash bars, marketplace deals, and more. What do you need booked, fixed, found, or compared today?",
  rw: "Muraho! 💜 Ndi Hafi AI — umujyanama wawe w' serivisi z'igihugu. Nshaka mu database yacu aba electrician, mechanics, salon, lashes, amadeals y'isoko, n'ibindi. Ukeneye iki gufatwa gahunda, gukosorwa, kubona cyangwa kugereranya uyu munsi?",
  fr: "Bonjour ! 💜 Je suis Hafi AI — votre concierge services locaux. Je consulte notre base de données : électriciens, mécaniciens, salons, cils, marketplace, etc. Que souhaitez-vous réserver, réparer, trouver ou comparer aujourd'hui ?",
  sw: "Habari! 💜 Mimi ni Hafi AI — mshauri wako wa huduma za mahali. Natafuta kwenye database yetu: fundi umeme, makanika, salon, kope, soko, na zaidi. Unahitaji kuweka miadi, kurekebisha, kupata au kulinganisha nini leo?",
};

export { en, rw, fr, sw, type TranslationKey };

export { LocaleProvider, useLocale, useT, type LocaleStorage } from "./react";
