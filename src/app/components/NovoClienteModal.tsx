import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { criarCliente, ClienteCreate, ClienteAPI } from '../../services/processos.service';

interface NovoClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClienteCriado: (cliente: ClienteAPI) => void;
}

export function NovoClienteModal({ isOpen, onClose, onClienteCriado }: NovoClienteModalProps) {
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [autorizacaoBusca, setAutorizacaoBusca] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cpfCnpj.trim()) {
      setError('Por favor, preencha o nome e o CPF/CNPJ.');
      return;
    }
    if (!autorizacaoBusca) {
      setError('O consentimento de monitoramento LGPD é obrigatório.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const payload: ClienteCreate = {
        nome_razao_social: nome,
        cpf_cnpj: cpfCnpj,
        autorizacao_busca: autorizacaoBusca
      };
      const novoCliente = await criarCliente(payload);
      onClienteCriado(novoCliente);
      // Limpa form e fecha
      setNome('');
      setCpfCnpj('');
      setAutorizacaoBusca(false);
      onClose();
    } catch (err: any) {
      console.error('Erro ao criar cliente:', err);
      setError(err.response?.data?.detail || 'Ocorreu um erro ao criar o cliente. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  // Garante que o portal só renderize no lado cliente (se o framework for SSR)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1A2B3C]/40 backdrop-blur-[2px] pointer-events-auto" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#1A2B3C] to-[#243447]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Building className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h4 className="text-white font-semibold leading-tight">Novo Cliente</h4>
              <p className="text-white/50 text-xs mt-0.5">Cadastrar cliente para vinculação de processos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form id="form-cliente" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Nome ou Razão Social <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva / Empresa X Ltda."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#1A2B3C] bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                CPF / CNPJ <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="Apenas números"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-[#1A2B3C] bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition"
              />
            </div>

            {/* Compliance Box */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 cursor-pointer hover:bg-[#D4AF37]/10 transition-colors group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={autorizacaoBusca}
                    onChange={(e) => setAutorizacaoBusca(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      autorizacaoBusca
                        ? 'bg-[#1A2B3C] border-[#1A2B3C]'
                        : 'bg-white border-gray-300 group-hover:border-[#1A2B3C]/40'
                    }`}
                  >
                    {autorizacaoBusca && (
                      <svg viewBox="0 0 10 8" className="w-3 h-3 fill-none stroke-white stroke-[2]">
                        <path d="M1 4l2.5 3L9 1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1A2B3C] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    Termo de Consentimento (LGPD) <span className="text-red-400">*</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Declaro que o cliente forneceu autorização expressa para o monitoramento ativo e contínuo de seus dados sensíveis via DataJud.
                  </p>
                </div>
              </label>
            </div>
          </form>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-slate-50 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            form="form-cliente"
            type="submit"
            disabled={loading || !nome.trim() || !cpfCnpj.trim() || !autorizacaoBusca}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#1A2B3C] hover:bg-[#243447] rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Criar Cliente</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
