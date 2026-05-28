import logoImg from "../../imports/logo.png";

interface AppLogoProps {
  /**
   * "light"  → aplica filtro branco (para fundos escuros como #1A2B3C e #121212)
   * "dark"   → mix-blend-multiply para remover fundo branco (para fundos claros como branco e #FAFAFA)
   */
  variant?: "light" | "dark";
  /**
   * Tamanhos predefinidos para cada contexto de uso:
   * "xs"  → h-6  (sidebar icon, bottom nav)
   * "sm"  → h-7  (mobile header)
   * "md"  → h-9  (topbar desktop, footer)
   * "lg"  → h-10 (navbar landing page) — máx. 40px conforme spec
   */
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap: Record<NonNullable<AppLogoProps["size"]>, string> = {
  xs: "h-6",
  sm: "h-7",
  md: "h-9",
  lg: "h-10",
};

export function AppLogo({
  variant = "dark",
  size = "md",
  className = "",
}: AppLogoProps) {
  const isLight = variant === "light";

  return (
    <img
      src={logoImg}
      alt="Barcelos & Takaki"
      className={[
        "w-auto object-contain select-none",
        sizeMap[size],
        /* Fundo claro → multiply remove a textura/branco, exibe navy e dourado naturais */
        !isLight ? "mix-blend-multiply" : "",
        /* Fundo escuro → inverte tudo para branco legível */
        isLight ? "brightness-0 invert" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={false}
    />
  );
}