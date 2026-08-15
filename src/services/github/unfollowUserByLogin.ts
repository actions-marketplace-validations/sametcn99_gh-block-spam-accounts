import type { Octokit } from "octokit";

export async function unfollowUserByLogin(octokit: Octokit, login: string): Promise<void> {
  await octokit.rest.users.unfollow({ username: login });
}
