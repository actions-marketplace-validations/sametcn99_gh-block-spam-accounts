import type { Octokit } from "octokit";
import type { GitHubAccount } from "../../types/github";

export async function fetchFollowing(octokit: Octokit): Promise<GitHubAccount[]> {
  const following = await octokit.paginate(octokit.rest.users.listFollowedByAuthenticatedUser, {
    per_page: 100,
  });

  return following.map((user) => ({
    login: user.login,
  }));
}
