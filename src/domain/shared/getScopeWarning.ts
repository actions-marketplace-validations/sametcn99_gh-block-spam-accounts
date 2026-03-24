export function getScopeWarning(oauthScopes: string | null): string | null {
  if (!oauthScopes) {
    return "GitHub did not return OAuth scope details. Blocking might still work with a fine-grained token that has Block another user: write.";
  }

  const normalizedScopes = oauthScopes
    .split(",")
    .map((scope) => scope.trim().toLowerCase())
    .filter((scope) => scope.length > 0);

  if (normalizedScopes.includes("user")) {
    return null;
  }

  return "This token does not advertise the classic user scope. Analysis can run, but blocking might fail unless your fine-grained token includes Block another user: write.";
}
