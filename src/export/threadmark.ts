import type {
  ScanResult,
  ThreadmarkBundle,
  RiskSummary,
} from "../types/scan.js";

export const THREADMARK_VERSION = "1.0.0";
export const THREADMARK_GENERATOR = "openthreads-trace";

export function buildThreadmarkBundle(
  scanResult: ScanResult,
  exportedAt?: string,
): ThreadmarkBundle {
  const riskSummary: RiskSummary | null = scanResult.riskBreakdown
    ? {
        score: scanResult.riskBreakdown.score,
        maxScore: scanResult.riskBreakdown.maxScore,
        fieldPenaltyCount: scanResult.riskBreakdown.fieldPenalties.length,
        claimPenaltyCount: scanResult.riskBreakdown.claimPenalties.length,
      }
    : null;

  return {
    version: THREADMARK_VERSION,
    generator: THREADMARK_GENERATOR,
    exportedAt: exportedAt ?? new Date().toISOString(),
    scan: {
      url: scanResult.url,
      title: scanResult.title,
      category: scanResult.category,
      scannedAt: scanResult.timestamp,
    },
    fields: scanResult.fields,
    claims: scanResult.claims,
    evidence: scanResult.evidence,
    riskSummary,
  };
}

export function serializeBundle(bundle: ThreadmarkBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function generateFilename(bundle: ThreadmarkBundle): string {
  const date = bundle.exportedAt.slice(0, 10);
  const host = safeHostname(bundle.scan.url);
  return `threadmark-${host}-${date}.json`;
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/[^a-zA-Z0-9.-]/g, "_");
  } catch {
    return "unknown";
  }
}
