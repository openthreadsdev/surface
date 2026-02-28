import type { EvidenceClip } from "../types/scan.js";

let clipCounter = 0;

export function generateClipId(): string {
  clipCounter += 1;
  return `clip-${Date.now()}-${clipCounter}`;
}

export function resetClipCounter(): void {
  clipCounter = 0;
}

export function extractContext(
  fullText: string,
  selectedText: string,
  radius: number = 80,
): string {
  const idx = fullText.indexOf(selectedText);
  if (idx === -1) return selectedText;

  const start = Math.max(0, idx - radius);
  const end = Math.min(fullText.length, idx + selectedText.length + radius);
  let context = fullText.slice(start, end).trim();

  if (start > 0) context = "…" + context;
  if (end < fullText.length) context = context + "…";

  return context;
}

export function createClip(
  text: string,
  pageText: string,
  url: string,
  options?: { fieldKey?: string; claimKeyword?: string },
): EvidenceClip | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  return {
    id: generateClipId(),
    text: trimmed,
    context: extractContext(pageText, trimmed),
    url,
    timestamp: new Date().toISOString(),
    fieldKey: options?.fieldKey,
    claimKeyword: options?.claimKeyword,
  };
}

export function addClip(
  clips: EvidenceClip[],
  clip: EvidenceClip,
): EvidenceClip[] {
  return [...clips, clip];
}

export function removeClip(
  clips: EvidenceClip[],
  clipId: string,
): EvidenceClip[] {
  return clips.filter((c) => c.id !== clipId);
}

export function getClipsForField(
  clips: EvidenceClip[],
  fieldKey: string,
): EvidenceClip[] {
  return clips.filter((c) => c.fieldKey === fieldKey);
}

export function getClipsForClaim(
  clips: EvidenceClip[],
  claimKeyword: string,
): EvidenceClip[] {
  return clips.filter((c) => c.claimKeyword === claimKeyword);
}
