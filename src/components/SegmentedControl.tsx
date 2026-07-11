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
    <div className="flex rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`min-h-9 flex-1 rounded-lg text-sm font-bold transition ${
            value === option.value ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
