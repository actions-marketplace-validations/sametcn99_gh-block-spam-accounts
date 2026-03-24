import type { GitHubProfile } from "../../types/github";
import type { DetectionSensitivity, SpamDetection } from "../../types/spam";
import { buildNormalizedProfileDetails } from "./buildNormalizedProfileDetails";
import { buildSpamRules, mainAccountPattern } from "./buildSpamRules";
import { normalizeText } from "./normalizeText";

type DetectionSignal = {
  reason: string;
  weight: number;
  isStrongSignal: boolean;
};

type DetectionThresholdProfile = {
  minTotalScoreWithoutStrongSignal: number;
  minReasonCountWithoutStrongSignal: number;
  ctaDensityThreshold: number;
  shortLinkMinimumCtaTerms: number;
  numericRatioThreshold: number;
};

function getThresholdProfile(sensitivity: DetectionSensitivity): DetectionThresholdProfile {
  if (sensitivity === "aggressive") {
    return {
      minTotalScoreWithoutStrongSignal: 3,
      minReasonCountWithoutStrongSignal: 1,
      ctaDensityThreshold: 3,
      shortLinkMinimumCtaTerms: 1,
      numericRatioThreshold: 0.4,
    };
  }

  if (sensitivity === "conservative") {
    return {
      minTotalScoreWithoutStrongSignal: 6,
      minReasonCountWithoutStrongSignal: 3,
      ctaDensityThreshold: 5,
      shortLinkMinimumCtaTerms: 3,
      numericRatioThreshold: 0.55,
    };
  }

  return {
    minTotalScoreWithoutStrongSignal: 4,
    minReasonCountWithoutStrongSignal: 2,
    ctaDensityThreshold: 4,
    shortLinkMinimumCtaTerms: 2,
    numericRatioThreshold: 0.45,
  };
}

function buildRawProfileDetails(profile: GitHubProfile): string {
  return [
    profile.login,
    profile.name,
    profile.bio,
    profile.company,
    profile.location,
    profile.websiteUrl,
    profile.twitterUsername,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

function deobfuscateCommonSubstitutions(value: string): string {
  return value
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7+]/g, "t")
    .replace(/[8]/g, "b");
}

function countRegexMatches(input: string, regex: RegExp): number {
  const matches = input.match(regex);
  return matches ? matches.length : 0;
}

function appendSignal(signalMap: Map<string, DetectionSignal>, signal: DetectionSignal): void {
  const existingSignal = signalMap.get(signal.reason);

  if (!existingSignal) {
    signalMap.set(signal.reason, signal);
    return;
  }

  signalMap.set(signal.reason, {
    reason: signal.reason,
    weight: Math.max(existingSignal.weight, signal.weight),
    isStrongSignal: existingSignal.isStrongSignal || signal.isStrongSignal,
  });
}

function collectHeuristicSignals(
  profile: GitHubProfile,
  rawProfileDetails: string,
  normalizedProfileDetails: string,
  deobfuscatedProfileDetails: string,
  thresholds: DetectionThresholdProfile,
): DetectionSignal[] {
  const heuristicSignals: DetectionSignal[] = [];
  const condensedProfileDetails = normalizedProfileDetails.replace(/\s+/g, "");
  const ctaTermMatches = countRegexMatches(
    deobfuscatedProfileDetails,
    /\b(?:follow|star|check|repo|repository|visit|support|block|remove|unfollow|main)\b/g,
  );

  if (
    /(?:followme|followback|f4f|f2f|checkmyrepo|checkmyrepos|starmyrepo|starmyrepos|blockif|sbtoremove)/.test(
      condensedProfileDetails,
    )
  ) {
    heuristicSignals.push({
      reason: "dense call-to-action token chain",
      weight: 3,
      isStrongSignal: false,
    });
  }

  if (
    /\b(?:follow|star|repo|block|remove|main)\b/.test(deobfuscatedProfileDetails) &&
    !/\b(?:follow|star|repo|block|remove|main)\b/.test(normalizedProfileDetails)
  ) {
    heuristicSignals.push({
      reason: "obfuscated call-to-action terms",
      weight: 3,
      isStrongSignal: false,
    });
  }

  const handleMentions = rawProfileDetails.match(/@[a-z\d-]{2,39}/gi) ?? [];
  if (
    handleMentions.length >= 2 &&
    /\b(?:main|alt|backup|second|real\s+account|new\s+account)\b/.test(deobfuscatedProfileDetails)
  ) {
    heuristicSignals.push({
      reason: "multiple account handle references",
      weight: 4,
      isStrongSignal: true,
    });
  }

  if (ctaTermMatches >= thresholds.ctaDensityThreshold) {
    heuristicSignals.push({
      reason: "high call-to-action density",
      weight: 2,
      isStrongSignal: false,
    });
  }

  const websiteUrl = (profile.websiteUrl ?? "").toLowerCase();
  if (
    websiteUrl.length > 0 &&
    /(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|shorturl\.at|linktr\.ee)/.test(websiteUrl) &&
    ctaTermMatches >= thresholds.shortLinkMinimumCtaTerms
  ) {
    heuristicSignals.push({
      reason: "short-link profile with call-to-action",
      weight: 3,
      isStrongSignal: false,
    });
  }

  const digitsInLogin = countRegexMatches(profile.login, /\d/g);
  const loginLength = profile.login.length;
  if (loginLength >= 8 && digitsInLogin / loginLength >= thresholds.numericRatioThreshold) {
    heuristicSignals.push({
      reason: "high numeric ratio in login",
      weight: 1,
      isStrongSignal: false,
    });
  }

  if (/([._-])\1{2,}/.test(profile.login)) {
    heuristicSignals.push({
      reason: "repetitive separator pattern in login",
      weight: 1,
      isStrongSignal: false,
    });
  }

  if (/([!?])\1{2,}/.test(rawProfileDetails)) {
    heuristicSignals.push({
      reason: "aggressive punctuation pattern",
      weight: 1,
      isStrongSignal: false,
    });
  }

  return heuristicSignals;
}

export function detectSpamProfiles(
  profiles: GitHubProfile[],
  customKeywords: string[],
  sensitivity: DetectionSensitivity,
): SpamDetection[] {
  const rules = buildSpamRules(customKeywords);
  const thresholds = getThresholdProfile(sensitivity);
  const detections: SpamDetection[] = [];

  for (const profile of profiles) {
    const rawProfileDetails = buildRawProfileDetails(profile);
    const normalizedProfileDetails = buildNormalizedProfileDetails(profile);
    const deobfuscatedProfileDetails = normalizeText(
      deobfuscateCommonSubstitutions(rawProfileDetails),
    );
    const signalMap = new Map<string, DetectionSignal>();

    for (const rule of rules) {
      const matchesNormalized = rule.regex.test(normalizedProfileDetails);
      const matchesDeobfuscated =
        !matchesNormalized && deobfuscatedProfileDetails.length > 0
          ? rule.regex.test(deobfuscatedProfileDetails)
          : false;

      if (!matchesNormalized && !matchesDeobfuscated) {
        continue;
      }

      appendSignal(signalMap, {
        reason: matchesDeobfuscated ? `${rule.reason} (obfuscated variant)` : rule.reason,
        weight: rule.weight ?? 2,
        isStrongSignal: Boolean(rule.isStrongSignal),
      });
    }

    if (
      mainAccountPattern.test(normalizedProfileDetails) ||
      mainAccountPattern.test(deobfuscatedProfileDetails)
    ) {
      appendSignal(signalMap, {
        reason: "main: @...",
        weight: 4,
        isStrongSignal: true,
      });
    }

    const heuristicSignals = collectHeuristicSignals(
      profile,
      rawProfileDetails,
      normalizedProfileDetails,
      deobfuscatedProfileDetails,
      thresholds,
    );
    for (const heuristicSignal of heuristicSignals) {
      appendSignal(signalMap, heuristicSignal);
    }

    const matchedSignals = [...signalMap.values()];
    const totalScore = matchedSignals.reduce((score, signal) => score + signal.weight, 0);
    const hasStrongSignal = matchedSignals.some((signal) => signal.isStrongSignal);

    if (matchedSignals.length === 0) {
      continue;
    }

    if (!hasStrongSignal && totalScore < thresholds.minTotalScoreWithoutStrongSignal) {
      continue;
    }

    if (!hasStrongSignal && matchedSignals.length < thresholds.minReasonCountWithoutStrongSignal) {
      continue;
    }

    const matchedReasons = matchedSignals
      .sort((leftSignal, rightSignal) => rightSignal.weight - leftSignal.weight)
      .map((signal) => signal.reason);

    detections.push({
      profile,
      matchedReasons,
    });
  }

  return detections;
}
