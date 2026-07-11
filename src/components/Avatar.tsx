type AvatarProps = {
  name: string
}

export function Avatar({ name }: AvatarProps) {
  const initial = Array.from(name)[0] ?? '?'

  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-200 text-sm font-bold text-neutral-600">
      {initial}
    </span>
  )
}
