import { Globe } from "lucide-react";
import { LOCALES, type Locale } from "@hafi/i18n";
import { useLocale } from "@hafi/i18n";

export default function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "flex-wrap"}`}>
      {!compact && (
        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
          <Globe size={14} /> {t("lang.choose")}
        </span>
      )}
      <div className="flex gap-1 bg-white/80 border border-purple-100 rounded-xl p-1">
        {LOCALES.map(({ code, labelKey }) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code as Locale)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              locale === code
                ? "bg-hafi-purple text-white shadow-sm"
                : "text-gray-500 hover:bg-purple-50 hover:text-hafi-purple"
            }`}
            title={t(labelKey)}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
