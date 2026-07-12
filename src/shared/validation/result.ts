export type ValidationResult<T> = { valid: true; value: T } | { valid: false; message: string }
