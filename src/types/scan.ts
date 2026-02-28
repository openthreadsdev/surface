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

export interface FieldPenalty {
  key: string;
  group: string;
  required: boolean;
  penalty: number;
  reason: string;
}

export interface ClaimPenalty {
  claim: string;
  riskLevel: "low" | "medium" | "high";
  penalty: number;
  reason: string;
}

export interface RiskScoreBreakdown {
  score: number;
  maxScore: number;
  fieldPenalties: FieldPenalty[];
  claimPenalties: ClaimPenalty[];
}

export interface ScanResult {
  url: string;
  title: string;
  category: ProductCategory;
  timestamp: string;
  fields: FieldResult[];
  claims: ClaimFlag[];
  riskBreakdown?: RiskScoreBreakdown;
}
