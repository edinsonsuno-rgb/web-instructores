interface ProgresBarProps {
  pct: number
  className?: string
}

export default function ProgresBar({ pct, className = '' }: ProgresBarProps) {
  return (
    <div className={`w-full h-1.5 bg-df-border rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-df-violet to-df-pink rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  )
}