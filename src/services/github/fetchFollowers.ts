import type { Octokit } from "octokit";
import type { GitHubAccount } from "../../types/github";

export async function fetchFollowers(octokit: Octokit): Promise<GitHubAccount[]> {
  const followers = await octokit.paginate(octokit.rest.users.listFollowersForAuthenticatedUser, {
    per_page: 100,
  });

  return followers.map((user) => ({
    login: user.login,
  }));
}
