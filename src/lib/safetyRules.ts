/**
 * Safety & Content Moderation Guardrails for User-Created Polls
 */

const BLOCKED_PATTERNS = [
  /\b(kill|murder|bomb|suicide|terrorist|nazi|hitler|slur)\b/i,
  /\b(free money|crypto giveaway|click here|t\.me\/|bit\.ly\/)\b/i,
  /\b(ponzi|scam|phishing|hack your account)\b/i,
  /\b(hate speech|white power|racial slur)\b/i
];

export interface SafetyCheckResult {
  passed: boolean;
  riskLevel: "clean" | "low" | "flagged";
  reason?: string;
}

export function evaluatePollSafety(title: string, description: string = "", options: string[] = []): SafetyCheckResult {
  const cleanTitle = (title || "").trim();
  const cleanDesc = (description || "").trim();

  // 1. Length validation
  if (cleanTitle.length < 8) {
    return {
      passed: false,
      riskLevel: "flagged",
      reason: "Poll title must be at least 8 characters long."
    };
  }

  if (cleanTitle.length > 280) {
    return {
      passed: false,
      riskLevel: "flagged",
      reason: "Poll title cannot exceed 280 characters."
    };
  }

  // 2. Options validation
  const validOptions = options.map(o => o.trim()).filter(Boolean);
  if (validOptions.length < 2) {
    return {
      passed: false,
      riskLevel: "flagged",
      reason: "Poll must have at least 2 distinct options."
    };
  }

  const uniqueOptions = new Set(validOptions.map(o => o.toLowerCase()));
  if (uniqueOptions.size !== validOptions.length) {
    return {
      passed: false,
      riskLevel: "flagged",
      reason: "Poll options must be distinct from one another."
    };
  }

  // 3. Toxicity and spam scanning
  const fullContent = `${cleanTitle} ${cleanDesc} ${validOptions.join(" ")}`;
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(fullContent)) {
      return {
        passed: false,
        riskLevel: "flagged",
        reason: "Content flagged for safety violation (harmful keywords or spam detected)."
      };
    }
  }

  return {
    passed: true,
    riskLevel: "clean"
  };
}
