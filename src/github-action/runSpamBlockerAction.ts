import { buildCandidateLogins } from "../domain/shared/buildCandidateLogins";
import { extractRateLimitInfo } from "../domain/shared/extractRateLimitInfo";
import { getErrorStatus } from "../domain/shared/getErrorStatus";
import { getScopeWarning } from "../domain/shared/getScopeWarning";
import { sleep } from "../domain/shared/sleep";
import { detectSpamProfiles } from "../domain/spam/detectSpamProfiles";
import { blockUserByLogin } from "../services/github/blockUserByLogin";
import { createGitHubClient } from "../services/github/createGitHubClient";
import { fetchAuthenticatedUser } from "../services/github/fetchAuthenticatedUser";
import { fetchBlockedLogins } from "../services/github/fetchBlockedLogins";
import { fetchFollowers } from "../services/github/fetchFollowers";
import { fetchFollowing } from "../services/github/fetchFollowing";
import { fetchProfiles } from "../services/github/fetchProfiles";
import type { AuthenticatedGitHubUser, RateLimitInfo } from "../types/github";
import type { DetectionSensitivity, SpamDetection } from "../types/spam";
import type { BlockOutcome } from "../types/workflow";

export type ActionTargetType = "followers" | "following" | "both";
export type ActionLogLevel = "info" | "warning" | "error" | "success";

export type ActionLogger = {
  log: (level: ActionLogLevel, message: string) => void;
};

export type RunSpamBlockerActionOptions = {
  token: string;
  detectionSensitivity: DetectionSensitivity;
  customKeywords: string[];
  applyBlocks: boolean;
  delayMs: number;
  targetType: ActionTargetType;
  excludedUsers: string[];
};

export type RunSpamBlockerActionResult = {
  authenticatedUser: AuthenticatedGitHubUser;
  oauthScopes: string | null;
  scopeWarning: string | null;
  rateLimit: RateLimitInfo | null;
  canReadBlockedUsers: boolean;
  targetType: ActionTargetType;
  followersCount: number;
  followingCount: number;
  blockedCount: number;
  candidateCount: number;
  detectedLogins: string[];
  detections: SpamDetection[];
  blockOutcomes: BlockOutcome[];
  blockedLogins: string[];
  failedBlockLogins: string[];
};

function appendBlockOutcome(outcomes: BlockOutcome[], outcome: BlockOutcome): BlockOutcome[] {
  return [...outcomes, outcome];
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error.";
}

function createBlockPermissionMessage(login: string): string {
  return `The token could not block @${login}. Blocking users requires a classic PAT with the user scope or a fine-grained token with Block another user: write.`;
}

function logMessage(
  logger: ActionLogger | undefined,
  level: ActionLogLevel,
  message: string,
): void {
  logger?.log(level, message);
}

function shouldFetchFollowers(targetType: ActionTargetType): boolean {
  return targetType === "followers" || targetType === "both";
}

function shouldFetchFollowing(targetType: ActionTargetType): boolean {
  return targetType === "following" || targetType === "both";
}

export async function runSpamBlockerAction(
  options: RunSpamBlockerActionOptions,
  logger?: ActionLogger,
): Promise<RunSpamBlockerActionResult> {
  const token = options.token.trim();

  if (!token) {
    throw new Error("github-token input is required.");
  }

  const octokit = createGitHubClient(token);

  logMessage(logger, "info", "Connecting to GitHub.");

  const authResponse = await fetchAuthenticatedUser(octokit);
  const rateLimit = extractRateLimitInfo(authResponse.headers);
  const scopeWarning = getScopeWarning(authResponse.oauthScopes);

  logMessage(logger, "success", `Authenticated as @${authResponse.user.login}.`);

  if (scopeWarning) {
    logMessage(logger, "warning", scopeWarning);
  }

  logMessage(logger, "info", `Fetching ${options.targetType} account list(s).`);

  const [followers, following, blockedResult] = await Promise.all([
    shouldFetchFollowers(options.targetType) ? fetchFollowers(octokit) : Promise.resolve([]),
    shouldFetchFollowing(options.targetType) ? fetchFollowing(octokit) : Promise.resolve([]),
    fetchBlockedLogins(octokit),
  ]);

  const sourceLogins = [...followers, ...following].map((account) => account.login);
  const candidateLogins = buildCandidateLogins(sourceLogins, {
    authenticatedLogin: authResponse.user.login,
    blockedLogins: blockedResult.blockedLogins,
    excludedLogins: options.excludedUsers,
  });

  logMessage(
    logger,
    "info",
    `Prepared ${candidateLogins.length} candidate account(s) from ${followers.length} follower(s) and ${following.length} following account(s).`,
  );

  if (!blockedResult.canReadBlockList) {
    logMessage(
      logger,
      "warning",
      "Blocked users could not be fetched. Analysis will continue without deduplication against the current block list.",
    );
  }

  if (candidateLogins.length === 0) {
    return {
      authenticatedUser: authResponse.user,
      oauthScopes: authResponse.oauthScopes,
      scopeWarning,
      rateLimit,
      canReadBlockedUsers: blockedResult.canReadBlockList,
      targetType: options.targetType,
      followersCount: followers.length,
      followingCount: following.length,
      blockedCount: blockedResult.blockedLogins.size,
      candidateCount: 0,
      detectedLogins: [],
      detections: [],
      blockOutcomes: [],
      blockedLogins: [],
      failedBlockLogins: [],
    };
  }

  logMessage(logger, "info", `Fetching ${candidateLogins.length} profile(s).`);

  const profiles = await fetchProfiles(octokit, candidateLogins, {
    onProfileProcessed: (processedProfiles, totalProfiles) => {
      if (processedProfiles === totalProfiles || processedProfiles % 25 === 0) {
        logMessage(
          logger,
          "info",
          `Fetched ${processedProfiles}/${totalProfiles} profile(s).`,
        );
      }
    },
  });

  const detections = detectSpamProfiles(
    profiles,
    options.customKeywords,
    options.detectionSensitivity,
  );
  const detectedLogins = detections.map((detection) => detection.profile.login);

  logMessage(
    logger,
    "success",
    `Detected ${detections.length} suspicious account(s) with ${options.detectionSensitivity} sensitivity.`,
  );

  if (!options.applyBlocks) {
    if (detections.length > 0) {
      logMessage(logger, "info", "Dry-run mode is active. No block requests were sent.");
    }

    return {
      authenticatedUser: authResponse.user,
      oauthScopes: authResponse.oauthScopes,
      scopeWarning,
      rateLimit,
      canReadBlockedUsers: blockedResult.canReadBlockList,
      targetType: options.targetType,
      followersCount: followers.length,
      followingCount: following.length,
      blockedCount: blockedResult.blockedLogins.size,
      candidateCount: candidateLogins.length,
      detectedLogins,
      detections,
      blockOutcomes: [],
      blockedLogins: [],
      failedBlockLogins: [],
    };
  }

  if (detections.length === 0) {
    logMessage(logger, "info", "No detections to block.");

    return {
      authenticatedUser: authResponse.user,
      oauthScopes: authResponse.oauthScopes,
      scopeWarning,
      rateLimit,
      canReadBlockedUsers: blockedResult.canReadBlockList,
      targetType: options.targetType,
      followersCount: followers.length,
      followingCount: following.length,
      blockedCount: blockedResult.blockedLogins.size,
      candidateCount: candidateLogins.length,
      detectedLogins,
      detections,
      blockOutcomes: [],
      blockedLogins: [],
      failedBlockLogins: [],
    };
  }

  logMessage(logger, "info", `Blocking ${detections.length} detected account(s).`);

  let blockOutcomes: BlockOutcome[] = [];

  for (const [index, detection] of detections.entries()) {
    const login = detection.profile.login;

    try {
      await blockUserByLogin(octokit, login);
      blockOutcomes = appendBlockOutcome(blockOutcomes, {
        login,
        success: true,
        errorMessage: null,
      });

      logMessage(logger, "success", `Blocked @${login}.`);
    } catch (error) {
      const status = getErrorStatus(error);
      const errorMessage =
        status === 403 || status === 404 ? createBlockPermissionMessage(login) : toMessage(error);

      blockOutcomes = appendBlockOutcome(blockOutcomes, {
        login,
        success: false,
        errorMessage,
      });

      logMessage(logger, "error", `Failed to block @${login}: ${errorMessage}`);
    }

    if (options.delayMs > 0 && index < detections.length - 1) {
      await sleep(options.delayMs);
    }
  }

  const blockedLogins = blockOutcomes
    .filter((outcome) => outcome.success)
    .map((outcome) => outcome.login);
  const failedBlockLogins = blockOutcomes
    .filter((outcome) => !outcome.success)
    .map((outcome) => outcome.login);

  logMessage(
    logger,
    "success",
    `Blocking completed: ${blockedLogins.length} succeeded, ${failedBlockLogins.length} failed.`,
  );

  return {
    authenticatedUser: authResponse.user,
    oauthScopes: authResponse.oauthScopes,
    scopeWarning,
    rateLimit,
    canReadBlockedUsers: blockedResult.canReadBlockList,
    targetType: options.targetType,
    followersCount: followers.length,
    followingCount: following.length,
    blockedCount: blockedResult.blockedLogins.size,
    candidateCount: candidateLogins.length,
    detectedLogins,
    detections,
    blockOutcomes,
    blockedLogins,
    failedBlockLogins,
  };
}