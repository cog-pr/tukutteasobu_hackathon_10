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
      <span className="mb-2 block text-sm font-black text-[#17191f]">{label}</span>
      <input
        value={value}
        maxLength={maxLength * 2}
        className={`min-h-[54px] w-full rounded-[13px] border-2 bg-white px-4 text-base text-[#17191f] outline-none transition placeholder:text-neutral-400 focus:shadow-[0_0_0_4px_rgba(244,209,63,0.18)] ${
          errorMessage
            ? 'border-rose-400 focus:border-rose-500'
            : 'border-[#c7c2b8] focus:border-[#17191f]'
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
