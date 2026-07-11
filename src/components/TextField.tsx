import type { InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  maxLength: number
  errorMessage?: string
  helperText?: string
}

export function TextField({
  label,
  maxLength,
  errorMessage,
  helperText,
  value,
  className = '',
  ...rest
}: TextFieldProps) {
  const currentLength = typeof value === 'string' ? Array.from(value).length : 0

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-neutral-700">{label}</span>
      <input
        value={value}
        maxLength={maxLength * 2}
        className={`min-h-12 w-full rounded-xl border bg-white px-4 text-base text-neutral-900 outline-none placeholder:text-neutral-400 ${
          errorMessage
            ? 'border-rose-400 focus:border-rose-500'
            : 'border-neutral-300 focus:border-neutral-900'
        } ${className}`}
        {...rest}
      />
      <span className="mt-1 flex items-center justify-between text-xs">
        <span className={errorMessage ? 'text-rose-500' : 'text-neutral-400'}>
          {errorMessage ?? helperText}
        </span>
        <span className={currentLength > maxLength ? 'font-semibold text-rose-500' : 'text-neutral-400'}>
          {currentLength}/{maxLength}
        </span>
      </span>
    </label>
  )
}
