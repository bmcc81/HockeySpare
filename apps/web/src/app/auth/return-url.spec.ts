import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  it('uses the fallback when there is no return url', () => {
    expect(safeReturnUrl(null, '/requests')).toBe('/requests');
    expect(safeReturnUrl('', '/requests')).toBe('/requests');
  });

  it('accepts same-site paths, including query strings', () => {
    expect(safeReturnUrl('/requests/team/new', '/requests')).toBe('/requests/team/new');
    expect(safeReturnUrl('/tournaments/abc?tab=rules', '/requests')).toBe('/tournaments/abc?tab=rules');
  });

  it('rejects other sites and protocol-relative links', () => {
    expect(safeReturnUrl('https://evil.example', '/requests')).toBe('/requests');
    expect(safeReturnUrl('//evil.example', '/requests')).toBe('/requests');
    expect(safeReturnUrl('/\\evil.example', '/requests')).toBe('/requests');
  });

  it('never loops back to the login or register pages', () => {
    expect(safeReturnUrl('/login', '/requests')).toBe('/requests');
    expect(safeReturnUrl('/register?x=1', '/requests')).toBe('/requests');
  });
});
