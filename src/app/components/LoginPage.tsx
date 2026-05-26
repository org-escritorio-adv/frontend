import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import imgLogin from "figma:asset/c94d0251b0fd23670e2fa6c6fa526ecff71beb6f.png";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 900);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'Inter', 'Roboto', sans-serif", background: "#f6f5f5" }}
    >
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

        {/* Card form */}
        <div className="w-full max-w-[363px]">
          {/* Heading */}
          <div className="text-center mb-7">
            <h2
              className="text-[#1a2b3c] text-[20px] leading-[30px]"
              style={{ fontWeight: 500 }}
            >
              Bem vindo a Área do Advogado
            </h2>
            <p className="text-[#45556c] text-[16px] leading-[24px] mt-1">
              Insira suas credenciais de Login
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* E-mail */}
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[43px] px-5 bg-[#d9d9d9] rounded-[10px] text-[#45556c] text-[16px] placeholder-[#45556c] border-0 outline-none focus:ring-2 focus:ring-[#1a2b3c]/20 transition"
            />

            {/* Senha */}
            <div className="relative">
              <input
                type={showSenha ? "text" : "password"}
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full h-[43px] px-5 pr-11 bg-[#d9d9d9] rounded-[10px] text-[#45556c] text-[16px] placeholder-[#45556c] border-0 outline-none focus:ring-2 focus:ring-[#1a2b3c]/20 transition"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#45556c]/70 hover:text-[#1a2b3c] transition-colors"
              >
                {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Submit */}
            <div className="flex justify-center mt-2">
              <button
                type="submit"
                disabled={loading}
                className="h-[32px] w-[119px] bg-[#1a2b3c] text-white text-[16px] rounded-[10px] flex items-center justify-center hover:bg-[#243447] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontWeight: 500 }}
              >
                {loading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                ) : (
                  "ENTRAR"
                )}
              </button>
            </div>
          </form>

          {/* Recovery link */}
          <div className="text-center mt-5 flex flex-col items-center gap-0.5">
            <p className="text-[#45556c] text-[16px] leading-[24px]">ou</p>
            <Link
              to="/recuperar-senha"
              className="text-[#45556c] text-[16px] leading-[24px] underline hover:text-[#1a2b3c] transition-colors"
            >
              recupere sua senha
            </Link>
          </div>
        </div>
      </main>

      {/* ── Bottom bar ───────────────────────────────────── */}
      <footer className="bg-white border-t border-[#e5e7eb] h-16 flex items-center justify-between px-8 shadow-[0px_-1px_3px_0px_rgba(0,0,0,0.06)]">
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
      </footer>
    </div>
  );
}
