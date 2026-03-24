import { Octokit } from "octokit";

export function createGitHubClient(token: string): Octokit {
  return new Octokit({ auth: token });
}
