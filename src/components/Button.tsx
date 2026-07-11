import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'border-2 border-[#17191f] bg-[#f4d13f] text-[#17191f] shadow-[0_5px_0_#8e7511] hover:brightness-105 active:translate-y-[2px] active:shadow-none disabled:border-[#aaa69d] disabled:bg-[#d8d3c9] disabled:text-[#77736b] disabled:shadow-none',
  secondary:
    'border-2 border-[#17191f] bg-[#fffdf8] text-[#17191f] shadow-[0_5px_0_#aba69c] hover:bg-white active:translate-y-[2px] active:shadow-none disabled:border-[#d8d3c9] disabled:text-[#88837a] disabled:shadow-none',
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
      className={`min-h-[54px] rounded-[15px] px-5 text-[15px] font-black tracking-[0.03em] transition duration-150 disabled:cursor-not-allowed ${
        fullWidth ? 'w-full' : ''
      } ${VARIANT_CLASSES[variant]} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}
