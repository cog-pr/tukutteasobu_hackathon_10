import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-400',
  secondary:
    'border-2 border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 disabled:border-neutral-200 disabled:text-neutral-400',
}

/**
 * スマートフォンで押しやすい高さ(min-h-12)を確保した共通ボタン。
 */
export function Button({
  children,
  variant = 'primary',
  fullWidth = true,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`min-h-12 rounded-xl px-5 text-base font-bold tracking-wide transition disabled:cursor-not-allowed ${
        fullWidth ? 'w-full' : ''
      } ${VARIANT_CLASSES[variant]} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}
