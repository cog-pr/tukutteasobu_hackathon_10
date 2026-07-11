type SegmentOption<T extends string> = {
  value: T
  label: string
}

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="flex rounded-[13px] border border-[#d8d3c9] bg-[#fffdf8] p-1 shadow-[0_3px_0_rgba(37,36,32,0.07)]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`min-h-9 flex-1 rounded-lg text-sm font-bold transition ${
            value === option.value ? 'bg-[#17191f] text-white shadow-sm' : 'text-[#686d78] hover:text-[#17191f]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
