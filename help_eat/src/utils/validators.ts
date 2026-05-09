export function isRequired(value: string): boolean {
  return value.trim().length > 0
}

export function isPositiveNumber(value: number): boolean {
  return !isNaN(value) && value > 0
}
