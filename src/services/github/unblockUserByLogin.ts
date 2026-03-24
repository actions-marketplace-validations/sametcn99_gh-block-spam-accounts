import type { Octokit } from "octokit";

export async function unblockUserByLogin(octokit: Octokit, login: string): Promise<void> {
  await octokit.rest.users.unblock({ username: login });
}
