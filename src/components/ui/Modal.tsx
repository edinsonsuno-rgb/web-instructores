interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative df-card w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button onClick={onClose} className="text-df-muted hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-lg"/>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}