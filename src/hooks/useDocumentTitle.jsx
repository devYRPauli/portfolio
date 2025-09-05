import { useEffect } from 'react'

export function useDocumentTitle(suffix) {
  useEffect(() => {
    document.title = `Yash Raj Pandey | ${suffix}`
  }, [suffix])
}
