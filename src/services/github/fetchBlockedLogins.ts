import type { Octokit } from "octokit";
import { getErrorStatus } from "../../domain/shared/getErrorStatus";

export type BlockedLoginsResult = {
  blockedLogins: Set<string>;
  blockedUserLogins: string[];
  canReadBlockList: boolean;
};

export async function fetchBlockedLogins(octokit: Octokit): Promise<BlockedLoginsResult> {
  try {
    const blockedUsers = await octokit.paginate(octokit.rest.users.listBlockedByAuthenticatedUser, {
      per_page: 100,
    });

    return {
      blockedLogins: new Set(blockedUsers.map((user) => user.login)),
      blockedUserLogins: blockedUsers.map((user) => user.login),
      canReadBlockList: true,
    };
  } catch (error) {
    const status = getErrorStatus(error);

    if (status === 403 || status === 404) {
      return {
        blockedLogins: new Set<string>(),
        blockedUserLogins: [],
        canReadBlockList: false,
      };
    }

    throw error;
  }
}
