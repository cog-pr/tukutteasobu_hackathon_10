import { useCallback, useRef, useState } from 'react'

export function useSubmitLock() {
  const lockedRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const run = useCallback(async <T,>(submit: () => Promise<T>): Promise<T | undefined> => {
    if (lockedRef.current) return undefined

    lockedRef.current = true
    setIsSubmitting(true)
    try {
      return await submit()
    } finally {
      lockedRef.current = false
      setIsSubmitting(false)
    }
  }, [])

  return { isSubmitting, run }
}
