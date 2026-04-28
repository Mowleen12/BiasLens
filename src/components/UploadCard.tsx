import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { UploadCloud, FileSpreadsheet, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { SAMPLE_CSV } from "@/lib/sample-data";

export type ParsedDataset = {
  fileName: string;
  size: number;
  headers: string[];
  rows: Record<string, unknown>[];
};

type Status = "idle" | "reading" | "parsing" | "done" | "error";

function parseCsvText(text: string, fileName: string): ParsedDataset {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const headers = (result.meta.fields ?? [])
    .map((f) => (f ?? "").trim())
    .filter((f) => f.length > 0);
  const rows = (result.data || []).filter(
    (r) => r && Object.keys(r).some((k) => k && headers.includes(k.trim())),
  );
  return { fileName, size: text.length, headers, rows };
}

export function UploadCard({
  onLoaded,
  autoLoadSample,
}: {
  onLoaded: (d: ParsedDataset) => void;
  autoLoadSample?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [activeFile, setActiveFile] = useState<string>("");
  const [rowCount, setRowCount] = useState(0);
  const triggered = useRef(false);

  const busy = status === "reading" || status === "parsing";

  const handleFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file.");
      setStatus("error");
      return;
    }
    setActiveFile(file.name);
    setStatus("reading");
    setProgress(0);
    setRowCount(0);

    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 60)); // reading = 0–60%
      }
    };
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setStatus("parsing");
      setProgress(65);
      // Defer to next tick so UI updates before heavy parse
      setTimeout(() => {
        try {
          const ds = parseCsvText(text, file.name);
          if (ds.rows.length === 0) {
            setError("CSV is empty or could not be parsed.");
            setStatus("error");
            return;
          }
          setRowCount(ds.rows.length);
          setProgress(100);
          setStatus("done");
          setTimeout(() => onLoaded(ds), 250);
        } catch (e) {
          setError("Could not parse this CSV. Please check the file format.");
          setStatus("error");
        }
      }, 50);
    };
    reader.onerror = () => {
      setError("Could not read the file.");
      setStatus("error");
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    setError(null);
    setActiveFile("sample_hiring_data.csv");
    setStatus("reading");
    setProgress(20);
    setRowCount(0);
    setTimeout(() => {
      setStatus("parsing");
      setProgress(70);
      setTimeout(() => {
        const ds = parseCsvText(SAMPLE_CSV, "sample_hiring_data.csv");
        setRowCount(ds.rows.length);
        setProgress(100);
        setStatus("done");
        setTimeout(() => onLoaded(ds), 200);
      }, 250);
    }, 250);
  };

  useEffect(() => {
    if (autoLoadSample && !triggered.current) {
      triggered.current = true;
      loadSample();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoadSample]);

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          if (busy) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (busy) return;
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed bg-card p-10 text-center transition-all ${
          busy
            ? "border-primary/60 bg-accent/30"
            : dragOver
              ? "border-primary bg-accent/40 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-accent/20"
        }`}
      >
        {busy || status === "done" ? (
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              {status === "done" ? (
                <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
              ) : (
                <Loader2 className="h-7 w-7 animate-spin text-primary-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {status === "reading" && "Reading file…"}
              {status === "parsing" && "Parsing CSV…"}
              {status === "done" && "Ready!"}
            </h3>
            <p className="mt-1 truncate text-sm text-muted-foreground">{activeFile}</p>
            <div className="mt-5">
              <Progress value={progress} />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>
                  {status === "reading" && "Loading bytes…"}
                  {status === "parsing" && "Detecting columns and rows…"}
                  {status === "done" && `${rowCount.toLocaleString()} rows loaded`}
                </span>
                <span className="tabular-nums">{progress}%</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
              <UploadCloud className="h-7 w-7 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Upload your dataset</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag &amp; drop your CSV file here, or click to browse
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => inputRef.current?.click()}
                className="bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Choose CSV file
              </Button>
              <Button size="lg" variant="outline" onClick={loadSample}>
                <Sparkles className="mr-2 h-4 w-4" />
                Try sample dataset
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Only CSV files are supported · Your data stays in your browser
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p className="mt-3 text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
