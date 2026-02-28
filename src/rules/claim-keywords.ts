export interface ClaimKeyword {
  pattern: string;
  riskLevel: "low" | "medium" | "high";
  evidenceRequired: string;
}

export const CLAIM_KEYWORDS: ClaimKeyword[] = [
  {
    pattern: "eco-friendly",
    riskLevel: "high",
    evidenceRequired: "Third-party environmental certification",
  },
  {
    pattern: "sustainable",
    riskLevel: "high",
    evidenceRequired: "Sustainability certification or lifecycle analysis",
  },
  {
    pattern: "biodegradable",
    riskLevel: "high",
    evidenceRequired: "Biodegradability test results (e.g., ASTM D6400)",
  },
  {
    pattern: "non-toxic",
    riskLevel: "high",
    evidenceRequired: "Toxicology report or safety data sheet",
  },
  {
    pattern: "organic",
    riskLevel: "medium",
    evidenceRequired: "Organic certification (e.g., USDA, GOTS)",
  },
  {
    pattern: "natural",
    riskLevel: "medium",
    evidenceRequired: "Ingredient/material disclosure substantiating claim",
  },
  {
    pattern: "hypoallergenic",
    riskLevel: "medium",
    evidenceRequired: "Dermatological testing results",
  },
  {
    pattern: "recyclable",
    riskLevel: "low",
    evidenceRequired: "Material composition confirming recyclability",
  },
  {
    pattern: "vegan",
    riskLevel: "low",
    evidenceRequired: "Material/ingredient list confirming no animal products",
  },
  {
    pattern: "cruelty-free",
    riskLevel: "medium",
    evidenceRequired: "Cruelty-free certification (e.g., Leaping Bunny, PETA)",
  },
];
