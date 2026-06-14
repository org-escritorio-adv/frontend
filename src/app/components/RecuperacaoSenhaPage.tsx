import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { CheckCircle } from "lucide-react";
import imgLogin from "../../imports/logo.png";
import { forgotPassword, verifyResetToken } from "../../services/auth.service";
import { routePaths } from "../routeConfig";

type Step = "email" | "token";

export function RecuperacaoSenhaPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugToken, setDebugToken] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.debug_token) setDebugToken(res.debug_token);
      setStep("token");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar e-mail.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyResetToken(email, token.trim().toLowerCase());
      navigate(routePaths.resetPassword, { state: { email, token: token.trim().toLowerCase() } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Token inválido ou expirado.");
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

        {/* Card */}
        <div className="w-full max-w-[363px]">
          {/* Heading */}
          <div className="text-center mb-7">
            <h2
              className="text-[#1a2b3c] text-[20px] leading-[30px]"
              style={{ fontWeight: 500 }}
            >
              Recupere sua senha
            </h2>
            <p className="text-[#45556c] text-[16px] leading-[24px] mt-1 max-w-[300px] mx-auto">
              {step === "email"
                ? "Digite seu e-mail e receba um código para redefinição de senha"
                : "Digite o código de 6 dígitos enviado para seu e-mail"}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-[10px] text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Step 1 — E-mail */}
          {step === "email" && (
            <form onSubmit={handleSend} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? <Spinner /> : "Enviar código"}
                </button>
              </div>
            </form>
          )}

          {/* Step 2 — Token */}
          {step === "token" && (
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              {/* Success indicator */}
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-[10px]">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-[#1a2b3c] text-sm">
                  Código enviado para <strong>{email}</strong>
                </p>
              </div>

              {/* Debug token (só aparece em desenvolvimento) */}
              {debugToken && (
                <div className="px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-[10px] text-center">
                  <p className="text-yellow-700 text-xs font-semibold mb-1">DEV — código gerado:</p>
                  <span className="font-mono text-xl tracking-widest text-yellow-900 font-bold">
                    {debugToken}
                  </span>
                </div>
              )}

              <input
                type="text"
                placeholder="Código (ex: a1b2c3)"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                maxLength={6}
                className="w-full h-[43px] px-5 bg-[#d9d9d9] rounded-[10px] text-[#45556c] text-[16px] placeholder-[#45556c] border-0 outline-none focus:ring-2 focus:ring-[#1a2b3c]/20 transition tracking-widest font-mono"
              />

              <div className="flex justify-center mt-2">
                <button
                  type="submit"
                  disabled={loading || token.length < 6}
                  className="h-[32px] px-7 bg-[#1a2b3c] text-white text-[16px] rounded-[10px] flex items-center justify-center hover:bg-[#243447] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ fontWeight: 500 }}
                >
                  {loading ? <Spinner /> : "Verificar código"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setToken(""); }}
                className="text-[#45556c] text-sm underline hover:text-[#1a2b3c] transition-colors"
              >
                Reenviar para outro e-mail
              </button>
            </form>
          )}

          {/* Login link */}
          <div className="text-center mt-5 flex flex-col items-center gap-0.5">
            <p className="text-[#45556c] text-[16px] leading-[24px]">ou</p>
            <Link
              to="/login"
              className="text-[#45556c] text-[16px] leading-[24px] underline hover:text-[#1a2b3c] transition-colors"
            >
              faça login
            </Link>
          </div>
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
