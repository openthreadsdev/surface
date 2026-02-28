import type {
  FieldResult,
  ClaimFlag,
  FieldPenalty,
  ClaimPenalty,
  RiskScoreBreakdown,
} from "../types/scan.js";

export const REQUIRED_FIELD_WEIGHT = 10;
export const OPTIONAL_FIELD_WEIGHT = 3;

export const CLAIM_RISK_WEIGHTS: Record<"low" | "medium" | "high", number> = {
  low: 2,
  medium: 5,
  high: 8,
};

export function calculateFieldPenalties(fields: FieldResult[]): FieldPenalty[] {
  const penalties: FieldPenalty[] = [];

  for (const field of fields) {
    if (field.status === "missing") {
      const weight = field.required
        ? REQUIRED_FIELD_WEIGHT
        : OPTIONAL_FIELD_WEIGHT;
      penalties.push({
        key: field.key,
        group: field.group,
        required: field.required,
        penalty: weight,
        reason: field.required
          ? `Required field "${field.key}" is missing`
          : `Optional field "${field.key}" is missing`,
      });
    }
  }

  return penalties;
}

export function calculateClaimPenalties(claims: ClaimFlag[]): ClaimPenalty[] {
  const seen = new Set<string>();
  const penalties: ClaimPenalty[] = [];

  for (const claim of claims) {
    const key = claim.claim.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const weight = CLAIM_RISK_WEIGHTS[claim.riskLevel];
    penalties.push({
      claim: claim.claim,
      riskLevel: claim.riskLevel,
      penalty: weight,
      reason: `Unsubstantiated "${claim.claim}" claim (${claim.riskLevel} risk)`,
    });
  }

  return penalties;
}

export function calculateMaxFieldScore(fields: FieldResult[]): number {
  let max = 0;
  for (const field of fields) {
    max += field.required ? REQUIRED_FIELD_WEIGHT : OPTIONAL_FIELD_WEIGHT;
  }
  return max;
}

/**
 * Calculates the risk score breakdown for a scan result.
 *
 * The score is the sum of field penalties (missing required/optional fields)
 * and claim penalties (unsubstantiated marketing claims).
 *
 * The maxScore represents the maximum possible penalty:
 * - All fields missing (sum of all field weights)
 * - Plus actual claim penalties found on the page
 *
 * Note: Since claim penalties are added to both score and maxScore,
 * the score/maxScore ratio varies primarily based on field completeness.
 * Claims increase the absolute score but don't change the percentage.
 */
export function calculateRiskScore(
  fields: FieldResult[],
  claims: ClaimFlag[],
): RiskScoreBreakdown {
  const fieldPenalties = calculateFieldPenalties(fields);
  const claimPenalties = calculateClaimPenalties(claims);

  const fieldScore = fieldPenalties.reduce((sum, p) => sum + p.penalty, 0);
  const claimScore = claimPenalties.reduce((sum, p) => sum + p.penalty, 0);
  const score = fieldScore + claimScore;

  const maxScore =
    calculateMaxFieldScore(fields) +
    claimPenalties.reduce((sum, p) => sum + p.penalty, 0);

  return {
    score,
    maxScore,
    fieldPenalties,
    claimPenalties,
  };
}
