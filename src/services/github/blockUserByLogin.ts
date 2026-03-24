import type { Octokit } from "octokit";

export async function blockUserByLogin(octokit: Octokit, login: string): Promise<void> {
  await octokit.rest.users.block({ username: login });
}
