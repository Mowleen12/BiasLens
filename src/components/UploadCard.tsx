import { useRef, useState } from "react";
import Papa from "papaparse";
import { UploadCloud, FileSpreadsheet, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { SAMPLE_CSV } from "@/lib/sample-data";

export type ParsedDataset = {
  fileName: string;
  size: number;
  headers: string[];
  rows: Record<string, unknown>[];
};

function parseCsvText(text: string, fileName: string): ParsedDataset {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const rows = (result.data || []).filter((r) => r && Object.keys(r).length > 0);
  const headers = result.meta.fields?.map((f) => f.trim()) ?? [];
  return { fileName, size: text.length, headers, rows };
}

export function UploadCard({ onLoaded }: { onLoaded: (d: ParsedDataset) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const ds = parseCsvText(text, file.name);
      if (ds.rows.length === 0) {
        setError("CSV is empty or could not be parsed.");
        return;
      }
      onLoaded(ds);
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    const ds = parseCsvText(SAMPLE_CSV, "sample_hiring_data.csv");
    onLoaded(ds);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed bg-card p-10 text-center transition-all ${
          dragOver
            ? "border-primary bg-accent/40 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-accent/20"
        }`}
      >
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