const logoImg = '/logo.png'

interface AppLogoProps {
  variant?: 'light' | 'dark'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap: Record<NonNullable<AppLogoProps['size']>, string> = {
  xs: 'h-6',
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-10'
}

export function AppLogo({ variant = 'dark', size = 'md', className = '' }: AppLogoProps) {
  return (
    <img
      src={logoImg}
      alt="Barcelos & Takaki"
      className={[
        'w-auto object-contain select-none',
        sizeMap[size],
        variant === 'light' ? 'brightness-0 invert' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      draggable={false}
    />
  )
}
