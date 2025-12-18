import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface FicheActionnaireContextType {
  openFiche: (personneId: number) => void
  closeFiche: () => void
  isOpen: boolean
  currentPersonneId: number | null
}

const FicheActionnaireContext = createContext<FicheActionnaireContextType | null>(null)

export function FicheActionnaireProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPersonneId, setCurrentPersonneId] = useState<number | null>(null)

  const openFiche = useCallback((personneId: number) => {
    setCurrentPersonneId(personneId)
    setIsOpen(true)
  }, [])

  const closeFiche = useCallback(() => {
    setIsOpen(false)
    // On garde l'ID pendant la fermeture pour éviter le flash de contenu
    setTimeout(() => setCurrentPersonneId(null), 300)
  }, [])

  return (
    <FicheActionnaireContext.Provider value={{ openFiche, closeFiche, isOpen, currentPersonneId }}>
      {children}
    </FicheActionnaireContext.Provider>
  )
}

export function useFicheActionnaire() {
  const context = useContext(FicheActionnaireContext)
  if (!context) {
    throw new Error("useFicheActionnaire must be used within a FicheActionnaireProvider")
  }
  return context
}
