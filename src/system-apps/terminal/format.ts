/** Base-1000 sizes like `df -H`, so numbers match the rest of Plumos: 256G, 2.0T. */
export function si(bytes: number) {
  if (bytes < 1000) return `${Math.round(bytes)}B`
  const units = ['K', 'M', 'G', 'T', 'P']
  let v = bytes
  let i = -1
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000
    i++
  }
  return (v < 10 ? v.toFixed(1) : String(Math.round(v))) + units[i]
}

/** Base-1024 sizes like `ls -lh`: 2114880512 → 2.0G. */
export function human(n: number) {
  if (n < 1024) return String(n)
  const units = ['K', 'M', 'G', 'T']
  let v = n
  let i = -1
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return (v < 10 ? v.toFixed(1) : String(Math.round(v))) + units[i]
}
