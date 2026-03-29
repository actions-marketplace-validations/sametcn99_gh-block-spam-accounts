export type BuildCandidateLoginsOptions = {
  authenticatedLogin?: string;
  blockedLogins?: Iterable<string>;
  excludedLogins?: Iterable<string>;
};

export function buildCandidateLogins(
  logins: string[],
  options: BuildCandidateLoginsOptions = {},
): string[] {
  const authenticatedLogin = options.authenticatedLogin?.trim().toLowerCase() ?? null;
  const blockedLogins = new Set(
    Array.from(options.blockedLogins ?? [], (login) => login.trim().toLowerCase()),
  );
  const excludedLogins = new Set(
    Array.from(options.excludedLogins ?? [], (login) => login.trim().toLowerCase()),
  );
  const seenLogins = new Set<string>();

  return logins.filter((login) => {
    const normalizedLogin = login.trim().toLowerCase();

    if (!normalizedLogin) {
      return false;
    }

    if (normalizedLogin === authenticatedLogin) {
      return false;
    }

    if (blockedLogins.has(normalizedLogin) || excludedLogins.has(normalizedLogin)) {
      return false;
    }

    if (seenLogins.has(normalizedLogin)) {
      return false;
    }

    seenLogins.add(normalizedLogin);
    return true;
  });
}
