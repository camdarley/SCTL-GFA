import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface FicheActeContextType {
  openFiche: (acteId: number) => void
  closeFiche: () => void
  isOpen: boolean
  currentActeId: number | null
}

const FicheActeContext = createContext<FicheActeContextType | null>(null)

export function FicheActeProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentActeId, setCurrentActeId] = useState<number | null>(null)

  const openFiche = useCallback((acteId: number) => {
    setCurrentActeId(acteId)
    setIsOpen(true)
  }, [])

  const closeFiche = useCallback(() => {
    setIsOpen(false)
    // On garde l'ID pendant la fermeture pour éviter le flash de contenu
    setTimeout(() => setCurrentActeId(null), 300)
  }, [])

  return (
    <FicheActeContext.Provider value={{ openFiche, closeFiche, isOpen, currentActeId }}>
      {children}
    </FicheActeContext.Provider>
  )
}

export function useFicheActe() {
  const context = useContext(FicheActeContext)
  if (!context) {
    throw new Error("useFicheActe must be used within a FicheActeProvider")
  }
  return context
}
