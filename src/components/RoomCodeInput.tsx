import { useRef } from 'react'

type RoomCodeInputProps = {
  value: string
  onChange: (value: string) => void
  length?: number
}

/**
 * 6桁のルームコードを1文字ずつのボックスで入力する。
 * 入力すると自動的に次のボックスへフォーカスが移動する。
 */
export function RoomCodeInput({ value, onChange, length = 6 }: RoomCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const chars = Array.from({ length }, (_, index) => value[index] ?? '')

  const updateChar = (index: number, char: string) => {
    const nextChars = [...chars]
    nextChars[index] = char
    onChange(nextChars.join('').slice(0, length))
  }

  const handleChange = (index: number, rawInput: string) => {
    const char = rawInput.trim().slice(-1).toUpperCase()
    updateChar(index, char)
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !chars[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="flex justify-center gap-1.5">
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element
          }}
          value={char}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          inputMode="text"
          maxLength={1}
          className="h-12 w-10 rounded-[10px] border-2 border-[#c7c2b8] bg-white text-center text-xl font-black uppercase text-[#17191f] outline-none transition focus:border-[#17191f] focus:shadow-[0_0_0_4px_rgba(244,209,63,0.18)]"
        />
      ))}
    </div>
  )
}
