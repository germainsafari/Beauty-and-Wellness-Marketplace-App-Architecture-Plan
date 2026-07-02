import type { TranslationKey } from "@hafi/i18n";

export const ONBOARDING_SLIDES: {
  id: string;
  image: string;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
}[] = [
  {
    id: "beauty",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80",
    titleKey: "onboarding.beauty.title",
    subtitleKey: "onboarding.beauty.subtitle",
  },
  {
    id: "youth",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80",
    titleKey: "onboarding.youth.title",
    subtitleKey: "onboarding.youth.subtitle",
  },
  {
    id: "trades",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80",
    titleKey: "onboarding.trades.title",
    subtitleKey: "onboarding.trades.subtitle",
  },
  {
    id: "community",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80",
    titleKey: "onboarding.community.title",
    subtitleKey: "onboarding.community.subtitle",
  },
];

export const DEMO_ACCOUNTS = [
  { label: "Client", phone: "+250780000002" },
  { label: "Salon", phone: "+250780000001" },
  { label: "Electrician", phone: "+250780000005" },
  { label: "Mechanic", phone: "+250780000006" },
  { label: "Lash bar", phone: "+250780000008" },
];

export const DEMO_DOC_URLS = [
  { label: "National ID", url: "https://example.com/demo/national-id.jpg" },
  { label: "Business cert", url: "https://example.com/demo/business-registration.pdf" },
];
