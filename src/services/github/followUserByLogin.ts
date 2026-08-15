import type { Octokit } from "octokit";

export async function followUserByLogin(octokit: Octokit, login: string): Promise<void> {
  await octokit.rest.users.follow({ username: login });
}
