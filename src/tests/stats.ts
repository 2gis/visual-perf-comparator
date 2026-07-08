const asc = (arr: number[]) => arr.sort((a, b) => a - b)

const quantile = (sorted: number[], q: number) => {
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  } else {
    return sorted[base]
  }
}

const fmt = (n: number) => Number(n).toFixed(2)

export function stats(
  input: number[],
  percentiles = [0.25, 0.5, 0.75, 0.9, 0.95, 0.99]
): Record<string, string> {
  if (input.length === 0) return {}
  asc(input)
  const output: Record<string, string> = {}
  for (const p of percentiles) {
    output[`q${Math.trunc(p * 100)}`] = fmt(quantile(input, p))
  }
  return output
}
