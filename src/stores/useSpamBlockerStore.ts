import { create } from "zustand";
import { buildCandidateLogins } from "../domain/shared/buildCandidateLogins";
import { createLogEntry } from "../domain/shared/createLogEntry";
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
import { followUserByLogin } from "../services/github/followUserByLogin";
import { unblockUserByLogin } from "../services/github/unblockUserByLogin";
import { unfollowUserByLogin } from "../services/github/unfollowUserByLogin";
import type { LogLevel, LogStage } from "../types/logging";
import type { DetectionSensitivity } from "../types/spam";
import type {
  AnalysisProgress,
  BlockOutcome,
  BlockProgress,
  ConnectionProgress,
  SpamBlockerState,
} from "../types/workflow";

const DEFAULT_DELAY_MS = 750;

const emptyAnalysisProgress: AnalysisProgress = {
  followersCount: 0,
  followingCount: 0,
  blockedCount: 0,
  candidateCount: 0,
  processedProfiles: 0,
  totalProfiles: 0,
};

const emptyBlockProgress: BlockProgress = {
  total: 0,
  completed: 0,
  succeeded: 0,
  failed: 0,
};

const emptyConnectionProgress: ConnectionProgress = {
  message: "Ready to connect.",
  processedProfiles: 0,
  totalProfiles: 0,
};

const baseState: SpamBlockerState = {
  token: "",
  connectionStatus: "idle",
  connectionProgress: emptyConnectionProgress,
  authenticatedUser: null,
  oauthScopes: null,
  scopeWarning: null,
  canReadBlockedUsers: true,
  blockedUserLogins: [],
  blockedUserProfiles: {},
  selectedBlockedUserLogins: [],
  followerLogins: [],
  followingLogins: [],
  socialProfiles: {},
  socialActionStatus: "idle",
  socialActionLogin: null,
  includeFollowingInAnalysis: false,
  detectionSensitivity: "balanced",
  customKeywords: [],
  detections: [],
  selectedLogins: [],
  analysisStatus: "idle",
  analysisProgress: emptyAnalysisProgress,
  blockStatus: "idle",
  blockDelayMs: DEFAULT_DELAY_MS,
  blockProgress: emptyBlockProgress,
  blockOutcomes: [],
  unblockStatus: "idle",
  unblockProgress: emptyBlockProgress,
  unblockOutcomes: [],
  rateLimit: null,
  logs: [],
  lastError: null,
};

type SpamBlockerActions = {
  setToken: (token: string) => void;
  setDetectionSensitivity: (sensitivity: DetectionSensitivity) => void;
  setIncludeFollowingInAnalysis: (includeFollowing: boolean) => void;
  setBlockDelayMs: (delayMs: number | null) => void;
  addCustomKeyword: (keyword: string) => void;
  removeCustomKeyword: (keyword: string) => void;
  setSelectedLogins: (logins: string[]) => void;
  setSelectedBlockedUserLogins: (logins: string[]) => void;
  selectAllDetections: () => void;
  selectAllBlockedUsers: () => void;
  resetSession: () => void;
  connectAccount: () => Promise<void>;
  analyzeAccounts: () => Promise<void>;
  blockSelectedAccounts: () => Promise<void>;
  removeConnections: () => Promise<void>;
  unblockSelectedAccounts: () => Promise<void>;
  unblockSingleAccount: (login: string) => Promise<void>;
  followAccount: (login: string) => Promise<void>;
  unfollowAccount: (login: string) => Promise<void>;
  blockAccount: (login: string) => Promise<void>;
  removeFollower: (login: string) => Promise<void>;
};

export type SpamBlockerStore = SpamBlockerState & SpamBlockerActions;

function appendLog(
  set: (
    partial: Partial<SpamBlockerStore> | ((state: SpamBlockerStore) => Partial<SpamBlockerStore>),
  ) => void,
  level: LogLevel,
  stage: LogStage,
  message: string,
  details?: string,
): void {
  const entry = createLogEntry(level, stage, message, details);

  set((state) => ({
    logs: [...state.logs, entry],
  }));
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

function createUnblockPermissionMessage(login: string): string {
  return `The token could not unblock @${login}. Unblocking users requires a classic PAT with the user scope or a fine-grained token with Block another user: write.`;
}

function appendOutcome(existingOutcomes: BlockOutcome[], outcome: BlockOutcome): BlockOutcome[] {
  return [...existingOutcomes, outcome];
}

function appendUniqueLogin(existingLogins: string[], login: string): string[] {
  return existingLogins.includes(login) ? existingLogins : [...existingLogins, login];
}

export const useSpamBlockerStore = create<SpamBlockerStore>((set, get) => ({
  ...baseState,
  setToken: (token) => {
    set({ token, lastError: null });
  },
  setDetectionSensitivity: (sensitivity) => {
    set({ detectionSensitivity: sensitivity });
    appendLog(set, "info", "analysis", `Detection profile changed to ${sensitivity}.`);
  },
  setIncludeFollowingInAnalysis: (includeFollowing) => {
    set({ includeFollowingInAnalysis: includeFollowing });
    appendLog(
      set,
      "info",
      "analysis",
      includeFollowing
        ? "Following accounts will be included in the next analysis."
        : "Following accounts will be excluded from the next analysis.",
    );
  },
  setBlockDelayMs: (delayMs) => {
    const safeDelay =
      Number.isFinite(delayMs) && delayMs !== null
        ? Math.max(0, Math.floor(delayMs))
        : DEFAULT_DELAY_MS;

    set({ blockDelayMs: safeDelay });
  },
  addCustomKeyword: (keyword) => {
    const cleanedKeyword = keyword.trim();

    if (!cleanedKeyword) {
      return;
    }

    const existingKeywords = get().customKeywords;

    if (
      existingKeywords.some(
        (existingKeyword) => existingKeyword.toLowerCase() === cleanedKeyword.toLowerCase(),
      )
    ) {
      appendLog(
        set,
        "warning",
        "analysis",
        `Keyword already exists in this session: ${cleanedKeyword}`,
      );
      return;
    }

    set({
      customKeywords: [...existingKeywords, cleanedKeyword],
    });

    appendLog(set, "info", "analysis", `Added session keyword: ${cleanedKeyword}`);
  },
  removeCustomKeyword: (keyword) => {
    set((state) => ({
      customKeywords: state.customKeywords.filter((currentKeyword) => currentKeyword !== keyword),
    }));

    appendLog(set, "info", "analysis", `Removed session keyword: ${keyword}`);
  },
  setSelectedLogins: (logins) => {
    set({ selectedLogins: logins });
    appendLog(set, "info", "selection", `Updated selection to ${logins.length} account(s).`);
  },
  setSelectedBlockedUserLogins: (logins) => {
    set({ selectedBlockedUserLogins: logins });
    appendLog(
      set,
      "info",
      "selection",
      `Updated unblock selection to ${logins.length} account(s).`,
    );
  },
  selectAllDetections: () => {
    const allLogins = get().detections.map((detection) => detection.profile.login);
    set({ selectedLogins: allLogins });
    appendLog(set, "info", "selection", `Selected all detected accounts (${allLogins.length}).`);
  },
  selectAllBlockedUsers: () => {
    const allLogins = get().blockedUserLogins;
    set({ selectedBlockedUserLogins: allLogins });
    appendLog(set, "info", "selection", `Selected all blocked accounts (${allLogins.length}).`);
  },
  resetSession: () => {
    set({
      ...baseState,
      logs: [],
    });

    appendLog(set, "info", "system", "Session state cleared.");
  },
  connectAccount: async () => {
    const token = get().token.trim();

    if (!token) {
      set({
        lastError: "Token is required to connect.",
        connectionStatus: "error",
      });
      appendLog(set, "error", "auth", "Token is missing. Paste a token and retry.");
      return;
    }

    set({
      connectionStatus: "running",
      connectionProgress: {
        message: "Validating your token and GitHub identity...",
        processedProfiles: 0,
        totalProfiles: 0,
      },
      lastError: null,
    });

    appendLog(set, "info", "auth", "Connecting to GitHub...");

    try {
      const octokit = createGitHubClient(token);
      const authResponse = await fetchAuthenticatedUser(octokit);
      const scopeWarning = getScopeWarning(authResponse.oauthScopes);
      const rateLimitInfo = extractRateLimitInfo(authResponse.headers);

      try {
        set({
          connectionProgress: {
            message: "Checking access to your followers list...",
            processedProfiles: 0,
            totalProfiles: 0,
          },
        });
        await octokit.rest.users.listFollowersForAuthenticatedUser({ per_page: 1 });
      } catch (permError) {
        const permStatus = getErrorStatus(permError);

        if (permStatus === 403) {
          const permissionError =
            "This token does not have the required permissions. Please create a new token with the user scope (classic PAT) or the Followers & Block another user permissions (fine-grained PAT) and try again.";

          set({
            connectionStatus: "error",
            connectionProgress: {
              ...get().connectionProgress,
              message: "Your token does not have the required GitHub permissions.",
            },
            lastError: permissionError,
          });

          appendLog(set, "error", "auth", "Missing required permissions.", permissionError);
          return;
        }
      }

      set({
        connectionProgress: {
          message: "Loading followers, following accounts, and blocked accounts...",
          processedProfiles: 0,
          totalProfiles: 0,
        },
      });
      const [followers, following, blockedResult] = await Promise.all([
        fetchFollowers(octokit),
        fetchFollowing(octokit),
        fetchBlockedLogins(octokit),
      ]);
      const socialLogins = Array.from(new Set([...followers, ...following].map(({ login }) => login)));
      set({
        connectionProgress: {
          message: `Loading detailed profiles for ${socialLogins.length} account(s)...`,
          processedProfiles: 0,
          totalProfiles: socialLogins.length,
        },
      });
      const socialProfiles = Object.fromEntries(
        (await fetchProfiles(octokit, socialLogins, {
          onProfileProcessed: (processedProfiles, totalProfiles) => {
            set((state) => ({
              connectionProgress: {
                ...state.connectionProgress,
                processedProfiles,
                totalProfiles,
              },
            }));
          },
        })).map((profile) => [profile.login, profile]),
      );

      set({
        connectionStatus: "completed",
        authenticatedUser: authResponse.user,
        oauthScopes: authResponse.oauthScopes,
        scopeWarning,
        canReadBlockedUsers: blockedResult.canReadBlockList,
        blockedUserLogins: blockedResult.blockedUserLogins,
        blockedUserProfiles: {},
        selectedBlockedUserLogins: [],
        followerLogins: followers.map(({ login }) => login),
        followingLogins: following.map(({ login }) => login),
        socialProfiles,
        connectionProgress: {
          message: "Connection complete. Your social lists are ready.",
          processedProfiles: socialLogins.length,
          totalProfiles: socialLogins.length,
        },
        rateLimit: rateLimitInfo,
      });

      appendLog(set, "success", "auth", `Connected as @${authResponse.user.login}.`);

      if (blockedResult.canReadBlockList) {
        appendLog(
          set,
          "success",
          "auth",
          `Loaded ${blockedResult.blockedUserLogins.length} blocked account(s).`,
        );
      } else {
        appendLog(
          set,
          "warning",
          "auth",
          "Could not read blocked accounts. The token may need blocked-users read access.",
        );
      }

      if (scopeWarning) {
        appendLog(set, "warning", "auth", scopeWarning);
      }

      appendLog(
        set,
        "success",
        "fetch",
        `Loaded ${followers.length} follower(s) and ${following.length} following account(s) with profile details.`,
      );
    } catch (error) {
      const status = getErrorStatus(error);
      const message = status ? `${toMessage(error)} (status ${status})` : toMessage(error);

      set({
        connectionStatus: "error",
        connectionProgress: {
          ...get().connectionProgress,
          message: "Connection could not be completed.",
        },
        lastError: message,
      });

      appendLog(set, "error", "auth", "Connection failed.", message);
    }
  },
  analyzeAccounts: async () => {
    const token = get().token.trim();
    const authenticatedUser = get().authenticatedUser;
    const includeFollowingInAnalysis = get().includeFollowingInAnalysis;

    if (!token || !authenticatedUser) {
      set({
        lastError: "Connect your account before analyzing.",
        analysisStatus: "error",
      });
      appendLog(set, "error", "analysis", "Not connected. Click Connect first.");
      return;
    }

    set({
      analysisStatus: "running",
      blockStatus: "idle",
      blockOutcomes: [],
      blockProgress: emptyBlockProgress,
      unblockStatus: "idle",
      unblockOutcomes: [],
      unblockProgress: emptyBlockProgress,
      detections: [],
      selectedLogins: [],
      blockedUserLogins: [],
      blockedUserProfiles: {},
      selectedBlockedUserLogins: [],
      lastError: null,
      analysisProgress: emptyAnalysisProgress,
    });

    appendLog(set, "info", "analysis", "Starting spam analysis.");

    try {
      const octokit = createGitHubClient(token);

      const [followers, following, blockedResult] = await Promise.all([
        fetchFollowers(octokit),
        includeFollowingInAnalysis ? fetchFollowing(octokit) : Promise.resolve([]),
        fetchBlockedLogins(octokit),
      ]);

      const followerLogins = followers.map((account) => account.login);
      const followingLogins = following.map((account) => account.login);
      const candidateLogins = buildCandidateLogins([...followerLogins, ...followingLogins], {
        blockedLogins: blockedResult.blockedLogins,
        authenticatedLogin: authenticatedUser.login,
      });

      set({
        canReadBlockedUsers: blockedResult.canReadBlockList,
        blockedUserLogins: blockedResult.blockedUserLogins,
        blockedUserProfiles: {},
        selectedBlockedUserLogins: [],
        analysisProgress: {
          followersCount: followers.length,
          followingCount: following.length,
          blockedCount: blockedResult.blockedLogins.size,
          candidateCount: candidateLogins.length,
          processedProfiles: 0,
          totalProfiles: candidateLogins.length,
        },
      });

      appendLog(
        set,
        "info",
        "fetch",
        `Fetched ${followers.length} follower(s), ${following.length} following account(s)${includeFollowingInAnalysis ? "" : " (excluded from analysis)"}, ${blockedResult.blockedLogins.size} blocked account(s), and ${candidateLogins.length} candidate account(s).`,
      );

      if (!blockedResult.canReadBlockList) {
        appendLog(
          set,
          "warning",
          "fetch",
          "Could not read current blocked users for deduplication. Analysis continues without this optimization.",
        );
      }

      if (candidateLogins.length === 0) {
        set({ analysisStatus: "completed" });
        appendLog(set, "info", "analysis", "No candidate accounts available for spam analysis.");
        return;
      }

      const profiles = await fetchProfiles(octokit, candidateLogins, {
        onProfileProcessed: (processedCount, totalProfiles) => {
          set((state) => ({
            analysisProgress: {
              ...state.analysisProgress,
              processedProfiles: processedCount,
              totalProfiles,
            },
          }));
        },
      });

      appendLog(set, "info", "fetch", `Fetched ${profiles.length} profile(s) successfully.`);

      let blockedUserProfiles: Record<string, import("../types/github").GitHubProfile> = {};

      if (blockedResult.canReadBlockList && blockedResult.blockedUserLogins.length > 0) {
        const blockedProfiles = await fetchProfiles(octokit, blockedResult.blockedUserLogins);
        blockedUserProfiles = Object.fromEntries(
          blockedProfiles.map((profile) => [profile.login, profile]),
        );
        set({ blockedUserProfiles });
        appendLog(
          set,
          "info",
          "fetch",
          `Fetched ${blockedProfiles.length} blocked user profile(s).`,
        );
      }

      const detections = detectSpamProfiles(
        profiles,
        get().customKeywords,
        get().detectionSensitivity,
      );
      const selectedLogins = detections.map((detection) => detection.profile.login);

      set((state) => ({
        detections,
        selectedLogins,
        analysisStatus: "completed",
        analysisProgress: {
          ...state.analysisProgress,
          processedProfiles: state.analysisProgress.totalProfiles,
        },
      }));

      appendLog(
        set,
        "success",
        "analysis",
        `Detected ${detections.length} spam account(s) with ${get().detectionSensitivity} sensitivity.`,
      );

      if (detections.length > 0) {
        appendLog(
          set,
          "info",
          "selection",
          `All detected accounts are selected by default (${selectedLogins.length}).`,
        );
      }
    } catch (error) {
      const status = getErrorStatus(error);
      const message = status ? `${toMessage(error)} (status ${status})` : toMessage(error);

      set({
        analysisStatus: "error",
        lastError: message,
      });

      appendLog(set, "error", "analysis", "Analysis failed.", message);
    }
  },
  blockSelectedAccounts: async () => {
    const token = get().token.trim();
    const selectedLogins = get().selectedLogins;

    if (!token) {
      set({
        blockStatus: "error",
        lastError: "Token is required to block accounts.",
      });
      appendLog(set, "error", "block", "Token is missing. Paste a token and retry.");
      return;
    }

    if (selectedLogins.length === 0) {
      set({
        blockStatus: "error",
        lastError: "Select at least one account before blocking.",
      });
      appendLog(set, "warning", "block", "No accounts are selected for blocking.");
      return;
    }

    if (get().unblockStatus === "running") {
      set({
        blockStatus: "error",
        lastError: "Wait until unblocking is finished before starting blocking.",
      });
      appendLog(set, "warning", "block", "Blocking cannot start while unblocking is running.");
      return;
    }

    set({
      blockStatus: "running",
      blockProgress: {
        total: selectedLogins.length,
        completed: 0,
        succeeded: 0,
        failed: 0,
      },
      blockOutcomes: [],
      lastError: null,
    });

    appendLog(
      set,
      "info",
      "block",
      `Starting block queue for ${selectedLogins.length} account(s).`,
    );

    try {
      const octokit = createGitHubClient(token);
      const delayMs = get().blockDelayMs;

      for (const login of selectedLogins) {
        try {
          await blockUserByLogin(octokit, login);

          set((state) => {
            const detection = state.detections.find((d) => d.profile.login === login);
            const existingProfile = state.blockedUserProfiles[login];
            const newProfile = detection
              ? { [login]: detection.profile }
              : existingProfile
                ? { [login]: existingProfile }
                : {};

            return {
              blockOutcomes: appendOutcome(state.blockOutcomes, {
                login,
                success: true,
                errorMessage: null,
              }),
              blockedUserLogins: appendUniqueLogin(state.blockedUserLogins, login),
              blockedUserProfiles: { ...state.blockedUserProfiles, ...newProfile },
              blockProgress: {
                ...state.blockProgress,
                completed: state.blockProgress.completed + 1,
                succeeded: state.blockProgress.succeeded + 1,
              },
            };
          });

          appendLog(set, "success", "block", `Blocked @${login}.`);
        } catch (error) {
          const status = getErrorStatus(error);
          const errorMessage =
            status === 403 || status === 404
              ? createBlockPermissionMessage(login)
              : toMessage(error);

          set((state) => ({
            blockOutcomes: appendOutcome(state.blockOutcomes, {
              login,
              success: false,
              errorMessage,
            }),
            blockProgress: {
              ...state.blockProgress,
              completed: state.blockProgress.completed + 1,
              failed: state.blockProgress.failed + 1,
            },
          }));

          appendLog(set, "error", "block", `Failed to block @${login}.`, errorMessage);
        }

        if (delayMs > 0) {
          await sleep(delayMs);
        }
      }

      set({ blockStatus: "completed" });

      const { succeeded, failed } = get().blockProgress;
      appendLog(
        set,
        "success",
        "block",
        `Blocking completed: ${succeeded} succeeded, ${failed} failed.`,
      );
    } catch (error) {
      const message = toMessage(error);

      set({
        blockStatus: "error",
        lastError: message,
      });

      appendLog(set, "error", "block", "Blocking flow failed unexpectedly.", message);
    }
  },
  removeConnections: async () => {
    const token = get().token.trim();
    const selectedLogins = [...get().selectedLogins];
    const followerLogins = get().followerLogins;
    const followingLogins = get().followingLogins;

    if (!token) {
      set({
        blockStatus: "error",
        lastError: "Token is required to remove connections.",
      });
      appendLog(set, "error", "block", "Token is missing. Paste a token and retry.");
      return;
    }

    if (selectedLogins.length === 0) {
      set({
        blockStatus: "error",
        lastError: "Select at least one account before removing connections.",
      });
      appendLog(set, "warning", "block", "No accounts are selected for connection removal.");
      return;
    }

    if (get().unblockStatus === "running") {
      set({
        blockStatus: "error",
        lastError: "Wait until unblocking is finished before removing followers.",
      });
      appendLog(
        set,
        "warning",
        "block",
        "Connection removal cannot start while unblocking is running.",
      );
      return;
    }

    set({
      blockStatus: "running",
      blockProgress: {
        total: selectedLogins.length,
        completed: 0,
        succeeded: 0,
        failed: 0,
      },
      blockOutcomes: [],
      lastError: null,
    });

    appendLog(
      set,
      "info",
      "block",
      `Starting connection removal for ${selectedLogins.length} account(s).`,
    );

    try {
      const octokit = createGitHubClient(token);
      const delayMs = get().blockDelayMs;

      for (const login of selectedLogins) {
        const followsYou = followerLogins.includes(login);
        const youFollow = followingLogins.includes(login);
        let wasBlocked = false;

        try {
          if (followsYou) {
            await blockUserByLogin(octokit, login);
            wasBlocked = true;
            await unblockUserByLogin(octokit, login);
          } else if (youFollow) {
            await unfollowUserByLogin(octokit, login);
          } else {
            throw new Error("This account is no longer in your follower or following lists.");
          }

          set((state) => {
            const { [login]: _, ...remainingBlockedProfiles } = state.blockedUserProfiles;
            return {
              blockOutcomes: appendOutcome(state.blockOutcomes, {
                login,
                success: true,
                errorMessage: null,
                action: "remove",
              }),
              blockedUserLogins: state.blockedUserLogins.filter(
                (blockedLogin) => blockedLogin !== login,
              ),
              blockedUserProfiles: remainingBlockedProfiles,
              followerLogins: state.followerLogins.filter((currentLogin) => currentLogin !== login),
              followingLogins: state.followingLogins.filter((currentLogin) => currentLogin !== login),
              blockProgress: {
                ...state.blockProgress,
                completed: state.blockProgress.completed + 1,
                succeeded: state.blockProgress.succeeded + 1,
              },
            };
          });

          appendLog(
            set,
            "success",
            "block",
            followsYou
              ? `Removed @${login} from your followers.`
              : `Unfollowed @${login} to remove the connection.`,
          );
        } catch (error) {
          const status = getErrorStatus(error);
          const errorMessage =
            status === 403 || status === 404
              ? createBlockPermissionMessage(login)
              : toMessage(error);

          set((state) => ({
            ...(wasBlocked
              ? {
                  blockedUserLogins: appendUniqueLogin(state.blockedUserLogins, login),
                  blockedUserProfiles: state.socialProfiles[login]
                    ? { ...state.blockedUserProfiles, [login]: state.socialProfiles[login] }
                    : state.blockedUserProfiles,
                }
              : {}),
            blockOutcomes: appendOutcome(state.blockOutcomes, {
              login,
              success: false,
              errorMessage,
              action: "remove",
            }),
            blockProgress: {
              ...state.blockProgress,
              completed: state.blockProgress.completed + 1,
              failed: state.blockProgress.failed + 1,
            },
          }));

          appendLog(
            set,
            "error",
            "block",
            `Failed to remove the connection with @${login}.`,
            errorMessage,
          );
        }

        if (delayMs > 0) {
          await sleep(delayMs);
        }
      }

      set({ blockStatus: "completed" });

      const { succeeded, failed } = get().blockProgress;
      appendLog(
        set,
        "success",
        "block",
        `Connection removal completed: ${succeeded} succeeded, ${failed} failed.`,
      );
    } catch (error) {
      const message = toMessage(error);

      set({
        blockStatus: "error",
        lastError: message,
      });

      appendLog(set, "error", "block", "Connection removal flow failed unexpectedly.", message);
    }
  },
  unblockSelectedAccounts: async () => {
    const token = get().token.trim();
    const selectedBlockedUserLogins = [...get().selectedBlockedUserLogins];

    if (!token) {
      set({
        unblockStatus: "error",
        lastError: "Token is required to unblock accounts.",
      });
      appendLog(set, "error", "unblock", "Token is missing. Paste a token and retry.");
      return;
    }

    if (selectedBlockedUserLogins.length === 0) {
      set({
        unblockStatus: "error",
        lastError: "Select at least one blocked account before unblocking.",
      });
      appendLog(set, "warning", "unblock", "No blocked accounts are selected for unblocking.");
      return;
    }

    if (get().blockStatus === "running") {
      set({
        unblockStatus: "error",
        lastError: "Wait until blocking is finished before starting unblocking.",
      });
      appendLog(set, "warning", "unblock", "Unblocking cannot start while blocking is running.");
      return;
    }

    set({
      unblockStatus: "running",
      unblockProgress: {
        total: selectedBlockedUserLogins.length,
        completed: 0,
        succeeded: 0,
        failed: 0,
      },
      unblockOutcomes: [],
      lastError: null,
    });

    appendLog(
      set,
      "info",
      "unblock",
      `Starting unblock queue for ${selectedBlockedUserLogins.length} account(s).`,
    );

    try {
      const octokit = createGitHubClient(token);
      const delayMs = get().blockDelayMs;

      for (const login of selectedBlockedUserLogins) {
        try {
          await unblockUserByLogin(octokit, login);

          set((state) => {
            const { [login]: _, ...remainingBlockedProfiles } = state.blockedUserProfiles;
            return {
              unblockOutcomes: appendOutcome(state.unblockOutcomes, {
                login,
                success: true,
                errorMessage: null,
              }),
              blockedUserLogins: state.blockedUserLogins.filter(
                (blockedLogin) => blockedLogin !== login,
              ),
              selectedBlockedUserLogins: state.selectedBlockedUserLogins.filter(
                (blockedLogin) => blockedLogin !== login,
              ),
              blockedUserProfiles: remainingBlockedProfiles,
              unblockProgress: {
                ...state.unblockProgress,
                completed: state.unblockProgress.completed + 1,
                succeeded: state.unblockProgress.succeeded + 1,
              },
            };
          });

          appendLog(set, "success", "unblock", `Unblocked @${login}.`);
        } catch (error) {
          const status = getErrorStatus(error);
          const errorMessage =
            status === 403 || status === 404
              ? createUnblockPermissionMessage(login)
              : toMessage(error);

          set((state) => ({
            unblockOutcomes: appendOutcome(state.unblockOutcomes, {
              login,
              success: false,
              errorMessage,
            }),
            unblockProgress: {
              ...state.unblockProgress,
              completed: state.unblockProgress.completed + 1,
              failed: state.unblockProgress.failed + 1,
            },
          }));

          appendLog(set, "error", "unblock", `Failed to unblock @${login}.`, errorMessage);
        }

        if (delayMs > 0) {
          await sleep(delayMs);
        }
      }

      set({ unblockStatus: "completed" });

      const { succeeded, failed } = get().unblockProgress;
      appendLog(
        set,
        "success",
        "unblock",
        `Unblocking completed: ${succeeded} succeeded, ${failed} failed.`,
      );
    } catch (error) {
      const message = toMessage(error);

      set({
        unblockStatus: "error",
        lastError: message,
      });

      appendLog(set, "error", "unblock", "Unblocking flow failed unexpectedly.", message);
    }
  },
  unblockSingleAccount: async (login) => {
    set({ selectedBlockedUserLogins: [login] });
    appendLog(set, "info", "selection", `Prepared single-account unblock for @${login}.`);
    await get().unblockSelectedAccounts();
  },
  followAccount: async (login) => {
    const token = get().token.trim();
    if (!token || get().socialActionStatus === "running") return;

    set({ socialActionStatus: "running", socialActionLogin: login, lastError: null });
    try {
      await followUserByLogin(createGitHubClient(token), login);
      set((state) => ({
        followingLogins: appendUniqueLogin(state.followingLogins, login),
        socialActionStatus: "completed",
        socialActionLogin: null,
      }));
      appendLog(set, "success", "fetch", `Followed @${login}.`);
    } catch (error) {
      const message = toMessage(error);
      set({ socialActionStatus: "error", socialActionLogin: null, lastError: message });
      appendLog(set, "error", "fetch", `Failed to follow @${login}.`, message);
    }
  },
  unfollowAccount: async (login) => {
    const token = get().token.trim();
    if (!token || get().socialActionStatus === "running") return;

    set({ socialActionStatus: "running", socialActionLogin: login, lastError: null });
    try {
      await unfollowUserByLogin(createGitHubClient(token), login);
      set((state) => ({
        followingLogins: state.followingLogins.filter((currentLogin) => currentLogin !== login),
        socialActionStatus: "completed",
        socialActionLogin: null,
      }));
      appendLog(set, "success", "fetch", `Unfollowed @${login}.`);
    } catch (error) {
      const message = toMessage(error);
      set({ socialActionStatus: "error", socialActionLogin: null, lastError: message });
      appendLog(set, "error", "fetch", `Failed to unfollow @${login}.`, message);
    }
  },
  blockAccount: async (login) => {
    const token = get().token.trim();
    if (!token || get().socialActionStatus === "running") return;

    set({ socialActionStatus: "running", socialActionLogin: login, lastError: null });
    try {
      await blockUserByLogin(createGitHubClient(token), login);
      set((state) => ({
        blockedUserLogins: appendUniqueLogin(state.blockedUserLogins, login),
        blockedUserProfiles: state.socialProfiles[login]
          ? { ...state.blockedUserProfiles, [login]: state.socialProfiles[login] }
          : state.blockedUserProfiles,
        socialActionStatus: "completed",
        socialActionLogin: null,
      }));
      appendLog(set, "success", "block", `Blocked @${login}.`);
    } catch (error) {
      const message = toMessage(error);
      set({ socialActionStatus: "error", socialActionLogin: null, lastError: message });
      appendLog(set, "error", "block", `Failed to block @${login}.`, message);
    }
  },
  removeFollower: async (login) => {
    const token = get().token.trim();
    if (!token || get().socialActionStatus === "running") return;

    set({ socialActionStatus: "running", socialActionLogin: login, lastError: null });
    let wasBlocked = false;
    try {
      const octokit = createGitHubClient(token);
      await blockUserByLogin(octokit, login);
      wasBlocked = true;
      await unblockUserByLogin(octokit, login);
      set((state) => ({
        followerLogins: state.followerLogins.filter((currentLogin) => currentLogin !== login),
        blockedUserLogins: state.blockedUserLogins.filter((currentLogin) => currentLogin !== login),
        socialActionStatus: "completed",
        socialActionLogin: null,
      }));
      appendLog(set, "success", "block", `Removed @${login} from followers.`);
    } catch (error) {
      const message = toMessage(error);
      set((state) => ({
        ...(wasBlocked
          ? {
              blockedUserLogins: appendUniqueLogin(state.blockedUserLogins, login),
              blockedUserProfiles: state.socialProfiles[login]
                ? { ...state.blockedUserProfiles, [login]: state.socialProfiles[login] }
                : state.blockedUserProfiles,
            }
          : {}),
        socialActionStatus: "error",
        socialActionLogin: null,
        lastError: message,
      }));
      appendLog(set, "error", "block", `Failed to remove @${login} from followers.`, message);
    }
  },
}));
