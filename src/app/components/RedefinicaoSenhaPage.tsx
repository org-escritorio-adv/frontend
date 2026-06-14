import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router";
import { CheckCircle } from "lucide-react";
import imgLogin from "../../imports/logo.png";
import { resetPassword } from "../../services/auth.service";
import { routePaths } from "../routeConfig";

interface LocationState {
  email?: string;
  token?: string;
}

export function RedefinicaoSenhaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, token } = (location.state as LocationState) ?? {};

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Redireciona se chegou sem estado válido
  if (!email || !token) {
    return <Navigate to={routePaths.recoverPassword} replace />;
  }

  const validarSenha = (): string | null => {
    if (novaSenha.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (!/[A-Z]/.test(novaSenha)) return "A senha deve conter pelo menos uma letra maiúscula.";
    if (!/[0-9]/.test(novaSenha)) return "A senha deve conter pelo menos um número.";
    if (novaSenha !== confirmaSenha) return "As senhas não coincidem.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validarSenha();
    if (validationError) { setError(validationError); return; }
    setError("");
    setLoading(true);
    try {
      await resetPassword(email, token, novaSenha);
      setDone(true);
      setTimeout(() => navigate(routePaths.login), 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'Inter', 'Roboto', sans-serif", background: "#f6f5f5" }}
    >
      {/* ── Top bar ──────────────────────────────────────── */}
      <header className="bg-white border-b border-[#e5e7eb] h-16 flex items-center justify-between px-8 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
        <div>
          <p className="text-[#1a2b3c] text-[20px] leading-[28px]" style={{ fontWeight: 500 }}>
            Barcelos &amp; Takaki
          </p>
          <p className="text-[#62748e] text-[13px] leading-[18px]">
            Sistema de Gerenciamento Legal
          </p>
        </div>
        <Link
          to="/"
          className="h-10 px-5 bg-[#c5a059] text-[#121212] text-[13px] rounded flex items-center justify-center hover:bg-[#b8903f] transition-colors"
          style={{ fontFamily: "'Montserrat', 'Inter', sans-serif", fontWeight: 500 }}
        >
          Área Pública
        </Link>
      </header>

      {/* ── Main content ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center">
          <img
            src={imgLogin}
            alt="Barcelos & Takaki"
            className="h-36 w-auto object-contain select-none"
            draggable={false}
          />
        </div>

        <div className="w-full max-w-[363px]">
          {done ? (
            /* Sucesso */
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-[#1a2b3c] text-base text-center" style={{ fontWeight: 500 }}>
                Senha redefinida com sucesso!
              </p>
              <p className="text-[#45556c] text-sm text-center leading-relaxed">
                Redirecionando para o login…
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <h2
                  className="text-[#1a2b3c] text-[20px] leading-[30px]"
                  style={{ fontWeight: 500 }}
                >
                  Crie uma nova senha
                </h2>
                <p className="text-[#45556c] text-[16px] leading-[24px] mt-1 max-w-[300px] mx-auto">
                  Mínimo de 8 caracteres, uma letra maiúscula e um número
                </p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-[10px] text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="password"
                  placeholder="Nova senha"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                  className="w-full h-[43px] px-5 bg-[#d9d9d9] rounded-[10px] text-[#45556c] text-[16px] placeholder-[#45556c] border-0 outline-none focus:ring-2 focus:ring-[#1a2b3c]/20 transition"
                />
                <input
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  required
                  className="w-full h-[43px] px-5 bg-[#d9d9d9] rounded-[10px] text-[#45556c] text-[16px] placeholder-[#45556c] border-0 outline-none focus:ring-2 focus:ring-[#1a2b3c]/20 transition"
                />
                <div className="flex justify-center mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-[32px] px-7 bg-[#1a2b3c] text-white text-[16px] rounded-[10px] flex items-center justify-center hover:bg-[#243447] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontWeight: 500 }}
                  >
                    {loading ? <Spinner /> : "Redefinir senha"}
                  </button>
                </div>
              </form>

              <div className="text-center mt-5 flex flex-col items-center gap-0.5">
                <p className="text-[#45556c] text-[16px] leading-[24px]">ou</p>
                <Link
                  to="/login"
                  className="text-[#45556c] text-[16px] leading-[24px] underline hover:text-[#1a2b3c] transition-colors"
                >
                  faça login
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}
