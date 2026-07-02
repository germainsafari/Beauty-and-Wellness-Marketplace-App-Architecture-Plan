import { useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { getApiUrl, getToken, trpcCall } from "../lib/api";

/** Uploaded documents live on the API origin; the Vite proxy only covers /trpc. */
export function resolveUploadUrl(url: string): string {
  if (url.startsWith("/uploads/")) {
    return `${getApiUrl() || "http://localhost:3001"}${url}`;
  }
  return url;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2MB — matches the API limit

export type DocumentTypeOption = {
  value: "national_id" | "passport" | "business_registration";
  label: string;
};

type UploadState =
  | { phase: "idle" }
  | { phase: "reading" }
  | { phase: "uploading" }
  | { phase: "submitting" }
  | { phase: "success"; url: string }
  | { phase: "error"; message: string };

function isAcceptedFile(file: File): boolean {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

export default function DocumentUpload({
  documentTypes,
  onSubmitted,
}: {
  documentTypes: DocumentTypeOption[];
  onSubmitted?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const [documentType, setDocumentType] = useState<DocumentTypeOption["value"]>(
    documentTypes[0]?.value ?? "national_id"
  );
  const [dragging, setDragging] = useState(false);

  const busy =
    state.phase === "reading" || state.phase === "uploading" || state.phase === "submitting";

  const handleFile = async (file: File) => {
    if (busy) return;
    if (!isAcceptedFile(file)) {
      setState({ phase: "error", message: "Only images or PDF documents are accepted." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setState({ phase: "error", message: "File is too large — maximum size is 2MB." });
      return;
    }
    try {
      setState({ phase: "reading" });
      const dataUrl = await readFileAsDataUrl(file);

      setState({ phase: "uploading" });
      const token = getToken();
      const res = await fetch(`${getApiUrl() || "http://localhost:3001"}/uploads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ kind: "verification", mimeType: file.type, data: dataUrl }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.id) {
        throw new Error(body?.error || body?.message || `Upload failed (${res.status})`);
      }

      setState({ phase: "submitting" });
      await trpcCall("verification.submit", { uploadId: body.id, documentType }, "mutation");

      setState({ phase: "success", url: resolveUploadUrl(body.url as string) });
      onSubmitted?.();
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Upload failed. Please try again.",
      });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {documentTypes.length > 1 && (
        <div>
          <label className="text-xs font-bold text-gray-500">Document type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentTypeOption["value"])}
            disabled={busy}
            className="w-full mt-1 border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-hafi-purple bg-white"
          >
            {documentTypes.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !busy) inputRef.current?.click();
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          dragging
            ? "border-hafi-purple bg-purple-50"
            : "border-purple-200 bg-purple-50/40 hover:border-hafi-purple hover:bg-purple-50"
        } ${busy ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        {busy ? (
          <div className="flex flex-col items-center gap-2 text-hafi-purple">
            <Loader2 size={22} className="animate-spin" />
            <p className="text-sm font-bold">
              {state.phase === "reading" && "Reading file..."}
              {state.phase === "uploading" && "Uploading document..."}
              {state.phase === "submitting" && "Submitting for review..."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileUp size={22} className="text-hafi-purple" />
            <p className="text-sm font-bold text-hafi-purple">
              Click or drop your document here
            </p>
            <p className="text-xs text-gray-400">Image or PDF, up to 2MB</p>
          </div>
        )}
      </div>

      {state.phase === "success" && (
        <p className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>
            Document submitted for review.{" "}
            <a
              href={state.url}
              target="_blank"
              rel="noreferrer"
              className="underline font-bold"
            >
              View document
            </a>
          </span>
        </p>
      )}
      {state.phase === "error" && (
        <p className="text-sm font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-xl">
          {state.message}
        </p>
      )}
    </div>
  );
}
