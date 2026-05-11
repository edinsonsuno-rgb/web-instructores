interface LogoProps { size?: 'sm' | 'md' | 'lg'; showTagline?: boolean }

export default function Logo({ size = 'md', showTagline = false }: LogoProps) {
  const sizes = { sm: 'h-6', md: 'h-9', lg: 'h-14' }
  return (
    <div className="flex flex-col items-start">
      <img src="/logo.png" alt="Dorita Fit" className={sizes[size]}/>
      {showTagline && (
        <span className="text-df-muted tracking-widest uppercase mt-0.5"
          style={{ fontSize: '7px', letterSpacing: '.2em' }}>
          Train your best
        </span>
      )}
    </div>
  )
}