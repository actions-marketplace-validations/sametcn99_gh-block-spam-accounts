import type { Octokit } from "octokit";
import { getHeaderValue } from "../../domain/shared/getHeaderValue";
import type { AuthenticatedGitHubUser } from "../../types/github";

export type AuthenticatedUserResponse = {
  user: AuthenticatedGitHubUser;
  oauthScopes: string | null;
  headers: Record<string, string | number | string[] | undefined>;
};

export async function fetchAuthenticatedUser(octokit: Octokit): Promise<AuthenticatedUserResponse> {
  const { data, headers } = await octokit.rest.users.getAuthenticated();

  const normalizedHeaders = headers as Record<string, string | number | string[] | undefined>;

  return {
    user: {
      login: data.login,
      name: data.name,
      avatarUrl: data.avatar_url,
      htmlUrl: data.html_url,
    },
    oauthScopes: getHeaderValue(normalizedHeaders, "x-oauth-scopes"),
    headers: normalizedHeaders,
  };
}
