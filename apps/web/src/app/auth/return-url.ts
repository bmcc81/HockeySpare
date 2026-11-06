/**
 * Where to go after signing in or registering: the page the person was trying
 * to reach (`?returnUrl=/requests/team/new`), or `fallback`. Only same-site
 * paths are accepted so a crafted link can't send someone to another site.
 */
export function safeReturnUrl(raw: string | null | undefined, fallback: string): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return fallback;
  }

  // Don't bounce back to the auth pages themselves.
  if (/^\/(login|register)(\/|\?|$)/.test(raw)) {
    return fallback;
  }

  return raw;
}
