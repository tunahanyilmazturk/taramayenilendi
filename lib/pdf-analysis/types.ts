export type ExtractionMode = "text" | "ocr" | "mixed";

export type AnalysisProgress = {
  fileIndex: number;
  fileCount: number;
  fileName: string;
  page: number;
  pageCount: number;
  phase: "reading" | "ocr" | "interpreting";
  percent: number;
  message: string;
};

export type AnalyzedValue = {
  key: string;
  group: string;
  label: string;
  value: string;
  unit?: string;
  reference?: string;
  status: "normal" | "attention" | "unknown";
  confidence: number;
  source: string;
};

export type AnalyzedPdf = {
  id: string;
  fileName: string;
  pages: number;
  extractionMode: ExtractionMode;
  patientName: string;
  identityNumber: string;
  documentDate: string;
  documentType: string;
  values: AnalyzedValue[];
  confidence: number;
  warnings: string[];
  rawText: string;
};

export type AnalysisOptions = {
  knownTestNames?: string[];
  onProgress?: (progress: AnalysisProgress) => void;
};
