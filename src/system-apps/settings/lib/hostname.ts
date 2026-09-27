/**
 * Device names become the server's network name (`<name>.local`), so they
 * follow hostname rules: lowercase letters, digits and hyphens, 1–63 long,
 * no hyphen at either end.
 */
export const MAX_HOSTNAME = 63

/** Friendly typing: lowercases and turns spaces into hyphens as you go. */
export const softenHostname = (value: string) => value.toLowerCase().replace(/\s+/g, '-')

export function hostnameError(name: string): string | null {
  if (!name) return 'Enter a name.'
  if (name.length > MAX_HOSTNAME) return `Use ${MAX_HOSTNAME} characters or fewer.`
  const bad = name.match(/[^a-z0-9-]/)
  if (bad) return `“${bad[0]}” can’t be used. Stick to letters, numbers and hyphens.`
  if (name.startsWith('-') || name.endsWith('-')) return 'It can’t start or end with a hyphen.'
  return null
}

/** The name as it appears on the network, always safe to show. */
export const hostOf = (deviceName: string) =>
  `${(deviceName || 'plumos').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'plumos'}.local`
