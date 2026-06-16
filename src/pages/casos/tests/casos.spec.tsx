import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CaseDetails } from '../CaseDetails'
import type { ProcessoAPI } from '@/pages/processos/dtos/ProcessoListar.dto'

// Mocka o módulo de serviço inteiro
vi.mock('@/services/processos.service', () => ({
  buscarProcessoPorId: vi.fn(),
  exportarPdfProcesso: vi.fn()
}))

import { buscarProcessoPorId } from '@/services/processos.service'

const mockBuscar = vi.mocked(buscarProcessoPorId)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const processoFake: ProcessoAPI = {
  id: 1,
  numero_cnj: '0001234-56.2024.8.07.0001',
  tribunal: 'TJDFT',
  partes: 'Autor x Réu',
  status: 'ativo',
  cliente_id: 1,
  data_abertura: '2024-01-10',
  movimentacoes: []
}

describe('CaseDetails', () => {
  beforeEach(() => {
    mockBuscar.mockReset()
  })

  it('exibe estado de carregamento enquanto busca o processo', () => {
    mockBuscar.mockImplementation(() => new Promise(() => {}))
    render(<CaseDetails processoId="1" />, { wrapper: createWrapper() })
    expect(screen.getByText(/carregando processo/i)).toBeInTheDocument()
  })

  it('exibe os dados do processo após carregar', async () => {
    mockBuscar.mockResolvedValue(processoFake)
    render(<CaseDetails processoId="1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getAllByText(processoFake.numero_cnj).length).toBeGreaterThan(0)
    })
    expect(mockBuscar).toHaveBeenCalledWith('1')
  })

  it('exibe mensagem de erro quando a busca falha', async () => {
    mockBuscar.mockRejectedValue(new Error('falha'))
    render(<CaseDetails processoId="1" />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument()
    })
  })
})
