export type ProductCategory =
  | "textiles"
  | "children"
  | "cosmetics"
  | "electronics"
  | "general";

export type FieldStatus = "found" | "missing" | "partial";

export interface FieldResult {
  key: string;
  group: string;
  required: boolean;
  status: FieldStatus;
  value?: string;
  confidence: number;
}

export interface ClaimFlag {
  claim: string;
  riskLevel: "low" | "medium" | "high";
  evidenceRequired: string;
  source?: string;
}

export interface ScanResult {
  url: string;
  title: string;
  category: ProductCategory;
  timestamp: string;
  fields: FieldResult[];
  claims: ClaimFlag[];
  riskScore: number;
  maxScore: number;
}
