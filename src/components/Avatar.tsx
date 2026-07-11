type AvatarProps = {
  name: string
}

export function Avatar({ name }: AvatarProps) {
  const initial = Array.from(name)[0] ?? '?'

  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#17191f] bg-[#f4d13f] text-sm font-black text-[#17191f]">
      {initial}
    </span>
  )
}
