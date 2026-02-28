import type { PageSnapshot } from "../content/snapshot.js";
import type {
  ProductCategory,
  FieldResult,
  FieldStatus,
  ClaimFlag,
} from "../types/scan.js";
import { FIELD_GROUPS } from "./field-groups.js";
import { CLAIM_KEYWORDS } from "./claim-keywords.js";

const FIELD_SEARCH_PATTERNS: Record<string, RegExp[]> = {
  product_name: [
    /(?:product\s*name|item\s*name)[:\s]+(.+?)(?:\n|$)/i,
    /(?:og:title|twitter:title)/i,
  ],
  brand: [
    /(?:brand|manufacturer)[:\s]+(.+?)(?:\n|$)/i,
    /(?:og:brand|product:brand)/i,
  ],
  manufacturer_name: [
    /(?:manufacturer|made\s*by|produced\s*by)[:\s]+(.+?)(?:\n|$)/i,
  ],
  manufacturer_address: [
    /(?:manufacturer\s*address|company\s*address|business\s*address)[:\s]+(.+?)(?:\n|$)/i,
  ],
  contact_email_or_url: [
    /(?:contact\s*us|customer\s*service|support|email)[:\s]+(.+?)(?:\n|$)/i,
    /[\w.-]+@[\w.-]+\.\w{2,}/i,
  ],
  materials: [
    /(?:materials?|composition|made\s*(?:from|of|with)|fabric|ingredients?)[:\s]+(.+?)(?:\n|$)/i,
  ],
  country_of_origin: [
    /(?:country\s*of\s*origin|made\s*in|manufactured\s*in|origin|product\s*of)[:\s]+(.+?)(?:\n|$)/i,
  ],
  warnings: [
    /(?:warning|caution|danger|hazard|prop\s*65|⚠)[:\s]+(.+?)(?:\n|$)/i,
  ],
  instructions: [
    /(?:instructions?|directions?|how\s*to\s*use|usage)[:\s]+(.+?)(?:\n|$)/i,
  ],
  care_instructions: [
    /(?:care\s*instructions?|wash|cleaning|maintenance)[:\s]+(.+?)(?:\n|$)/i,
  ],
  marketing_claims: [/(?:features?|benefits?|highlights?)[:\s]+(.+?)(?:\n|$)/i],
  certifications: [
    /(?:certif(?:ied|ication)|certified\s*by|compliant|approved\s*by|tested\s*by)[:\s]+(.+?)(?:\n|$)/i,
  ],
};

const META_KEY_MAP: Record<string, string[]> = {
  product_name: ["og:title", "twitter:title", "product:name", "name"],
  brand: ["og:brand", "product:brand", "brand"],
  materials: ["product:material"],
  country_of_origin: ["product:origin", "og:country-name"],
};

export function detectField(
  key: string,
  text: string,
  meta: Record<string, string>,
): { status: FieldStatus; value?: string; confidence: number } {
  // Check meta tags first
  const metaKeys = META_KEY_MAP[key] || [];
  for (const mk of metaKeys) {
    if (meta[mk]) {
      return { status: "found", value: meta[mk], confidence: 0.9 };
    }
  }

  // Check text content with patterns
  const patterns = FIELD_SEARCH_PATTERNS[key] || [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = match[1]?.trim() || match[0].trim();
      return { status: "found", value, confidence: 0.7 };
    }
  }

  return { status: "missing", confidence: 1.0 };
}

export function evaluateFields(
  snapshot: PageSnapshot,
  _category: ProductCategory,
): FieldResult[] {
  const results: FieldResult[] = [];

  for (const group of FIELD_GROUPS) {
    for (const field of group.fields) {
      const detection = detectField(
        field.key,
        snapshot.textContent,
        snapshot.meta,
      );
      results.push({
        key: field.key,
        group: group.group,
        required: field.required,
        status: detection.status,
        value: detection.value,
        confidence: detection.confidence,
      });
    }
  }

  return results;
}

export function detectClaims(snapshot: PageSnapshot): ClaimFlag[] {
  const flags: ClaimFlag[] = [];
  const lowerText = snapshot.textContent.toLowerCase();

  for (const kw of CLAIM_KEYWORDS) {
    const pattern = new RegExp(`\\b${escapeRegex(kw.pattern)}\\b`, "gi");
    const match = lowerText.match(pattern);
    if (match) {
      // Extract surrounding context as source
      const idx = lowerText.indexOf(kw.pattern.toLowerCase());
      const start = Math.max(0, idx - 40);
      const end = Math.min(lowerText.length, idx + kw.pattern.length + 40);
      const source = snapshot.textContent.slice(start, end).trim();

      flags.push({
        claim: kw.pattern,
        riskLevel: kw.riskLevel,
        evidenceRequired: kw.evidenceRequired,
        source,
      });
    }
  }

  return flags;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function runRules(
  snapshot: PageSnapshot,
  category: ProductCategory,
): { fields: FieldResult[]; claims: ClaimFlag[] } {
  return {
    fields: evaluateFields(snapshot, category),
    claims: detectClaims(snapshot),
  };
}
