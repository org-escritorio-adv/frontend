import { useState, useEffect } from 'react'

/**
 * Retorna `true` quando a largura da janela é menor que `breakpoint` (padrão: 768px).
 * Usa `window.matchMedia` para consistência exata com os breakpoints do CSS/Tailwind.
 * Reage dinamicamente ao redimensionamento da janela (ex: DevTools ↔ desktop).
 */
export function useIsMobile(breakpoint = 768): boolean {
  const query = `(max-width: ${breakpoint - 1}px)`

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)

    // Sincroniza caso o estado inicial tenha diferido (hidratação SSR-like)
    setIsMobile(mql.matches)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return isMobile
}
