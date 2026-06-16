import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, it, expect } from 'vitest'
import { LoginPage } from '../LoginPage'
import { AuthProvider } from '@/context/AuthContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
)

describe('LoginPage', () => {
  it('renderiza o formulário de login', () => {
    render(<LoginPage />, { wrapper })
    expect(screen.getByPlaceholderText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('permite digitar e-mail e senha', async () => {
    const user = userEvent.setup()
    render(<LoginPage />, { wrapper })

    const email = screen.getByPlaceholderText(/e-mail/i)
    const senha = screen.getByPlaceholderText(/senha/i)

    await user.type(email, 'advogado@escritorio.com')
    await user.type(senha, 'senha123')

    expect(email).toHaveValue('advogado@escritorio.com')
    expect(senha).toHaveValue('senha123')
  })

  it('alterna a visibilidade da senha', async () => {
    const user = userEvent.setup()
    render(<LoginPage />, { wrapper })

    const senha = screen.getByPlaceholderText(/senha/i)
    expect(senha).toHaveAttribute('type', 'password')

    // O botão de olho é o único sem nome acessível dentro do form
    const toggle = senha.parentElement?.querySelector('button')
    if (toggle) await user.click(toggle)

    expect(senha).toHaveAttribute('type', 'text')
  })
})
