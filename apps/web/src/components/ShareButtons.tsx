import { useState } from "react";
import { Check, Link as LinkIcon, Share2 } from "lucide-react";

type ShareButtonsProps = {
  title: string;
  url?: string;
  compact?: boolean;
};

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function ShareButtons({ title, url, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => url || (typeof window !== "undefined" ? window.location.href : "");
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${title} — ${getUrl()}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const shareX = () => {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(getUrl())}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — silently ignore.
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: `Check this out on Hafi: ${title}`, url: getUrl() });
    } catch {
      // User dismissed the share sheet — not an error.
    }
  };

  const baseBtn = compact
    ? "flex items-center justify-center border rounded-xl px-3.5 py-3 transition-colors"
    : "flex items-center justify-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors";

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Share">
      <button
        type="button"
        onClick={shareWhatsApp}
        title="Share on WhatsApp"
        aria-label="Share on WhatsApp"
        className={`${baseBtn} border-emerald-200 text-emerald-600 hover:bg-emerald-50`}
      >
        <WhatsAppIcon />
        {!compact && <span>WhatsApp</span>}
      </button>
      <button
        type="button"
        onClick={shareX}
        title="Share on X"
        aria-label="Share on X"
        className={`${baseBtn} border-gray-200 text-gray-800 hover:bg-gray-50`}
      >
        <XIcon />
        {!compact && <span>Post</span>}
      </button>
      <button
        type="button"
        onClick={copyLink}
        title={copied ? "Copied" : "Copy link"}
        aria-label={copied ? "Link copied" : "Copy link"}
        className={`${baseBtn} ${
          copied
            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
            : "border-purple-200 text-hafi-purple hover:bg-purple-50"
        }`}
      >
        {copied ? <Check size={18} /> : <LinkIcon size={18} />}
        {!compact && <span>{copied ? "Copied" : "Copy link"}</span>}
      </button>
      {canNativeShare && (
        <button
          type="button"
          onClick={nativeShare}
          title="More sharing options"
          aria-label="More sharing options"
          className={`${baseBtn} border-gray-200 text-gray-600 hover:bg-gray-50`}
        >
          <Share2 size={18} />
          {!compact && <span>More</span>}
        </button>
      )}
    </div>
  );
}
