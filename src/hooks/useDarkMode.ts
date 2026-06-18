import { useEffect, useState } from 'react'

const STORAGE_KEY = 'darkMode'

function applyDark(dark: boolean) {
  const root = document.documentElement
  root.classList.toggle('dark', dark)
}

/**
 * Tema claro/escuro compartilhado por todo o sistema.
 *
 * O estado é persistido em `localStorage` e refletido na classe `.dark` do
 * elemento <html>, que ativa a camada de overrides definida em `styles/dark.css`.
 * Por ser global, qualquer tela (desktop ou mobile) que use este hook fica
 * sincronizada — alternar em um lugar aplica em todo o app.
 */
export function useDarkMode(): [boolean, (v: boolean) => void] {
  const [dark, setDark] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')

  useEffect(() => {
    applyDark(dark)
    localStorage.setItem(STORAGE_KEY, String(dark))
  }, [dark])

  // Mantém múltiplas telas/abas em sincronia.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setDark(e.newValue === 'true')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return [dark, setDark]
}
