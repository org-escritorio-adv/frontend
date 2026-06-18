import { useState, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  Upload,
  FileText,
  Calendar,
  MapPin,
  Users,
  Scale,
  Hash,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Pencil,
  X,
  Check,
  Trash2,
  Paperclip,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import {
  buscarProcessoPorId,
  exportarPdfProcesso,
  atualizarProcesso,
  buscarClientes,
  listarDocumentosProcesso,
  uploadDocumentoProcesso,
  baixarDocumentoProcesso,
  removerDocumentoProcesso,
  type DocumentoProcesso
} from '@/services/processos.service'
import { useAuth } from '@/context/AuthContext'
import { canEditProcessos, canExportDados } from '@/lib/rbac'

interface CaseDetailsProps {
  onBack?: () => void
  processoId?: string
}

type TipoMovimentacao =
  | 'Decisão'
  | 'Petição'
  | 'Audiência'
  | 'Documento'
  | 'Citação'
  | 'Distribuição'

function inferirTipo(descricao: string): TipoMovimentacao {
  const d = descricao.toLowerCase()
  if (d.includes('decisão') || d.includes('despacho') || d.includes('sentença') || d.includes('acórdão'))
    return 'Decisão'
  if (d.includes('petição') || d.includes('protocolo') || d.includes('manifestação') || d.includes('recurso'))
    return 'Petição'
  if (d.includes('audiência') || d.includes('sessão') || d.includes('julgamento'))
    return 'Audiência'
  if (d.includes('citação') || d.includes('intimação') || d.includes('notificação'))
    return 'Citação'
  if (d.includes('distribuição') || d.includes('distribuído') || d.includes('ajuizamento'))
    return 'Distribuição'
  return 'Documento'
}

function getIconeMovimentacao(tipo: TipoMovimentacao) {
  switch (tipo) {
    case 'Decisão':      return <Scale    className="w-5 h-5 text-purple-500" />
    case 'Petição':      return <FileText className="w-5 h-5 text-blue-500"   />
    case 'Audiência':    return <Calendar className="w-5 h-5 text-green-500"  />
    case 'Citação':      return <Users    className="w-5 h-5 text-yellow-600" />
    case 'Distribuição': return <FileText className="w-5 h-5 text-slate-500"  />
    default:             return <FileText className="w-5 h-5 text-orange-500" />
  }
}

function getBadgeMovimentacao(tipo: TipoMovimentacao): string {
  const map: Record<TipoMovimentacao, string> = {
    Decisão:      'bg-purple-100 text-purple-700',
    Petição:      'bg-blue-100   text-blue-700',
    Audiência:    'bg-green-100  text-green-700',
    Documento:    'bg-orange-100 text-orange-700',
    Citação:      'bg-yellow-100 text-yellow-700',
    Distribuição: 'bg-slate-100  text-slate-700'
  }
  return map[tipo] ?? 'bg-gray-100 text-gray-700'
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return iso }
}

function formatarDataCurta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}

function normalizarStatus(status: string): string {
  if (!status) return 'Em Andamento'
  const s = status.toLowerCase()
  if (s === 'ativo' || s === 'ativa') return 'Em Andamento'
  if (s === 'arquivado' || s === 'arquivada') return 'Arquivado'
  if (s === 'em recurso') return 'Em Recurso'
  return status
}

const STATUS_OPTIONS = ['ativo', 'arquivado', 'em recurso', 'suspenso']

export function CaseDetails({ onBack, processoId = '1' }: CaseDetailsProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const podeExportar = canExportDados(user)
  const podeEditar = canEditProcessos(user)

  const {
    data: processo = null,
    isLoading: loading,
    isError
  } = useQuery({
    queryKey: ['casos', processoId],
    queryFn: () => buscarProcessoPorId(processoId)
  })

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-list'],
    queryFn: () => buscarClientes()
  })

  const error = isError ? 'Não foi possível carregar os dados do processo.' : null

  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroEdicao, setErroEdicao] = useState('')
  const [formEdicao, setFormEdicao] = useState({
    status: '',
    tribunal: '',
    partes: '',
    cliente_id: '' as string | number,
  })

  // ── Upload de Documentos ──────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadErro, setUploadErro] = useState('')

  const { data: documentos = [], refetch: refetchDocs } = useQuery({
    queryKey: ['documentos-processo', processoId],
    queryFn: () => listarDocumentosProcesso(processoId),
    enabled: !!processoId
  })

  const processarArquivo = useCallback(async (file: File) => {
    setUploadErro('')
    setUploading(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      await uploadDocumentoProcesso(processoId, base64, file.name)
      await refetchDocs()
    } catch {
      setUploadErro('Erro ao enviar arquivo. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }, [processoId, refetchDocs])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processarArquivo(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processarArquivo(file)
  }

  const handleRemoverDoc = async (doc: DocumentoProcesso) => {
    try {
      await removerDocumentoProcesso(processoId, doc.id)
      await refetchDocs()
    } catch { /* ignora */ }
  }

  const abrirEdicao = () => {
    if (!processo) return
    setFormEdicao({
      status: processo.status ?? '',
      tribunal: processo.tribunal ?? '',
      partes: processo.partes ?? '',
      cliente_id: processo.cliente_id ?? '',
    })
    setErroEdicao('')
    setEditando(true)
  }

  const cancelarEdicao = () => {
    setEditando(false)
    setErroEdicao('')
  }

  const salvarEdicao = async () => {
    setSalvando(true)
    setErroEdicao('')
    try {
      await atualizarProcesso(processoId, {
        status: formEdicao.status || undefined,
        tribunal: formEdicao.tribunal || undefined,
        partes: formEdicao.partes || undefined,
        cliente_id: formEdicao.cliente_id !== '' ? Number(formEdicao.cliente_id) : null,
      })
      await queryClient.invalidateQueries({ queryKey: ['casos', processoId] })
      setEditando(false)
    } catch (err: any) {
      setErroEdicao(err?.response?.data?.detail ?? 'Erro ao salvar alterações.')
    } finally {
      setSalvando(false)
    }
  }

  const handleExportarPDF = async () => {
    try {
      await exportarPdfProcesso(processoId)
    } catch {
      alert('Erro ao tentar baixar o PDF do processo.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Carregando processo…</p>
        </div>
      </div>
    )
  }

  if (error || !processo) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm">{error ?? 'Processo não encontrado.'}</p>
          {onBack && (
            <button onClick={onBack} className="text-[#D4AF37] text-sm hover:underline mt-1">
              Voltar para lista
            </button>
          )}
        </div>
      </div>
    )
  }

  const statusLabel = normalizarStatus(processo.status)
  const isAtivo = processo.status.toLowerCase() === 'ativo' || processo.status.toLowerCase() === 'ativa'
  const movimentacoes = (processo.movimentacoes ?? []).map(m => ({ ...m, tipo: inferirTipo(m.descricao) }))

  const clienteNome = processo.cliente_id
    ? (clientes.find(c => c.id === processo.cliente_id)?.nome_razao_social ?? `Cliente #${processo.cliente_id}`)
    : 'Sem cliente'

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#1A2B3C] mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar para Processos Judiciais
        </button>
      )}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-[#1A2B3C] mb-2">Detalhes do Processo Judicial</h2>
          <p className="text-slate-600 font-mono text-sm mb-3">{processo.numero_cnj}</p>
        </div>

        <div className="flex items-center gap-2 self-start">
          {podeEditar && !editando && (
            <button
              onClick={abrirEdicao}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
          )}
          {podeEditar && editando && (
            <>
              <button
                onClick={cancelarEdicao}
                disabled={salvando}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvando}
                className="px-4 py-2.5 bg-[#1A2B3C] text-white rounded-lg hover:bg-[#243447] transition-colors flex items-center gap-2 text-sm disabled:opacity-60"
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Salvar
              </button>
            </>
          )}
          {podeExportar && (
            <button
              onClick={handleExportarPDF}
              className="px-4 py-2.5 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8941F] transition-colors flex items-center gap-2 shadow-md text-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          )}
        </div>
      </div>

      {erroEdicao && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {erroEdicao}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-[#1A2B3C] mb-4">Informações do Processo</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Número do Processo (CNJ)</span>
            </div>
            <div className="text-[#1A2B3C] font-mono text-sm">{processo.numero_cnj}</div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Tribunal</span>
            </div>
            {editando ? (
              <input
                type="text"
                value={formEdicao.tribunal}
                onChange={e => setFormEdicao(f => ({ ...f, tribunal: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
              />
            ) : (
              <div className="text-[#1A2B3C] text-sm uppercase">{processo.tribunal}</div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Scale className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Status</span>
            </div>
            {editando ? (
              <select
                value={formEdicao.status}
                onChange={e => setFormEdicao(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{normalizarStatus(s)}</option>
                ))}
              </select>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isAtivo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                {statusLabel}
              </span>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Partes</span>
            </div>
            {editando ? (
              <textarea
                value={formEdicao.partes}
                onChange={e => setFormEdicao(f => ({ ...f, partes: e.target.value }))}
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 resize-none"
              />
            ) : (
              <div className="text-[#1A2B3C] text-sm leading-relaxed">{processo.partes ?? 'Não informado'}</div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">Cliente</span>
            </div>
            {editando ? (
              <select
                value={formEdicao.cliente_id}
                onChange={e => setFormEdicao(f => ({ ...f, cliente_id: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
              >
                <option value="">Sem cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome_razao_social}</option>
                ))}
              </select>
            ) : (
              <div className="text-[#1A2B3C] text-sm">{clienteNome}</div>
            )}
          </div>

          {processo.data_abertura && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">Data de Distribuição</span>
              </div>
              <div className="text-[#1A2B3C] text-sm">{formatarData(processo.data_abertura)}</div>
            </div>
          )}
        </div>
      </div>

      {movimentacoes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-[#1A2B3C] mb-4">
            Movimentações
            <span className="ml-2 text-sm font-normal text-slate-400">({movimentacoes.length})</span>
          </h3>

          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-100" />
            <div className="space-y-6">
              {movimentacoes.map((mov, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="flex-shrink-0 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm z-10">
                    {getIconeMovimentacao(mov.tipo)}
                  </div>
                  <div className="flex-1 pt-1.5">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${getBadgeMovimentacao(mov.tipo)}`}>
                        {mov.tipo}
                      </span>
                      <span className="text-xs text-slate-400">{formatarDataCurta(mov.data)}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{mov.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Prazos ─────────────────────────────────────────────────────────── */}
      {processo.prazos && processo.prazos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-[#1A2B3C] font-semibold">Prazos</h3>
            <span className="ml-auto text-xs text-slate-400">{processo.prazos.length} prazo{processo.prazos.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-3">
            {[...processo.prazos]
              .sort((a, b) => new Date(a.data_limite).getTime() - new Date(b.data_limite).getTime())
              .map(prazo => {
                const dataLimite = new Date(prazo.data_limite)
                const hoje = new Date()
                const diasRestantes = Math.ceil((dataLimite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                const vencido = diasRestantes < 0
                const urgente = diasRestantes >= 0 && diasRestantes <= 3
                const concluido = prazo.status === 'concluido' || prazo.status === 'concluída'

                return (
                  <div
                    key={prazo.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                      concluido
                        ? 'border-emerald-100 bg-emerald-50/50'
                        : vencido
                          ? 'border-red-100 bg-red-50/50'
                          : urgente
                            ? 'border-amber-100 bg-amber-50/50'
                            : 'border-slate-100 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {concluido ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : vencido ? (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      ) : urgente ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A2B3C]">{prazo.titulo}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Vencimento: {dataLimite.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {concluido ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                          Concluído
                        </span>
                      ) : vencido ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">
                          Vencido
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${urgente ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {diasRestantes === 0 ? 'Hoje' : `${diasRestantes}d`}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ── Documentos e Anexos ────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Paperclip className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="text-[#1A2B3C] font-semibold">Documentos e Anexos</h3>
          <span className="ml-auto text-xs text-slate-400">{documentos.length} arquivo{documentos.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Upload area */}
        {podeEditar && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.xlsx,.xls"
              onChange={handleFileChange}
            />
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer group mb-4 ${dragOver ? 'border-[#D4AF37] bg-amber-50' : 'border-gray-300 hover:border-[#D4AF37]'} ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {uploading ? (
                <Loader2 className="w-10 h-10 text-[#D4AF37] mx-auto mb-2 animate-spin" />
              ) : (
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-[#D4AF37] mx-auto mb-2 transition-colors" />
              )}
              <p className="text-slate-600 mb-1 text-sm">{uploading ? 'Enviando arquivo...' : 'Arraste arquivos aqui ou clique para selecionar'}</p>
              <p className="text-xs text-slate-400">PDF, Word, Excel, Imagens • máx. 20 MB</p>
            </div>
            {uploadErro && (
              <p className="text-xs text-red-500 mb-3">{uploadErro}</p>
            )}
          </>
        )}

        {/* Lista de anexos */}
        {documentos.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Nenhum documento anexado.</p>
        ) : (
          <div className="space-y-2">
            {documentos.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A2B3C] truncate">{doc.nome_original}</p>
                  <p className="text-xs text-slate-400">
                    {doc.tamanho ? `${(doc.tamanho / 1024).toFixed(1)} KB` : ''}
                    {doc.criado_em ? ` · ${new Date(doc.criado_em).toLocaleDateString('pt-BR')}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => baixarDocumentoProcesso(processoId, doc.id, doc.nome_original)}
                  className="p-1.5 text-slate-400 hover:text-[#1A2B3C] transition-colors"
                  title="Baixar"
                >
                  <Download className="w-4 h-4" />
                </button>
                {podeEditar && (
                  <button
                    onClick={() => handleRemoverDoc(doc)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
