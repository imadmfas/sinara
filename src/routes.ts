// Route table shared by the router and the build-time validator (dead-route check).
export const routePatterns = [
  '/',
  '/path/:band',
  '/kids/:family',
  '/school/:band/:topic',
  '/field/:field/:branch',
  '/house',
  '/project/marshes',
  '/followup/:id',
  '/studio',
  '/guide',
  '/progress',
  '/settings'
] as const;

export const to = {
  home: () => '/',
  path: (band: string) => `/path/${band}`,
  kids: (family: string) => `/kids/${family}`,
  school: (band: string, topic: string) => `/school/${band}/${topic}`,
  branch: (field: string, branch: string) => `/field/${field}/${branch}`,
  house: () => '/house',
  marshes: () => '/project/marshes',
  followup: (id: string) => `/followup/${id}`,
  studio: (field?: string, branch?: string) => (field ? `/studio?field=${field}${branch ? `&branch=${branch}` : ''}` : '/studio'),
  guide: () => '/guide',
  progress: () => '/progress',
  settings: () => '/settings'
};

export function matchesPattern(path: string): boolean {
  const clean = path.split('?')[0];
  const segs = clean.split('/').filter(Boolean);
  return routePatterns.some((p) => {
    const ps = p.split('/').filter(Boolean);
    return ps.length === segs.length && ps.every((s, i) => s.startsWith(':') || s === segs[i]);
  });
}
