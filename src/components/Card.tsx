import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-[18px] border border-[#d8d3c9] bg-[#fffdf8] p-4 shadow-[0_5px_0_rgba(37,36,32,0.07)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
