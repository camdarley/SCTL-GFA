/**
 * GlobalModals renders the FicheActionnaire and FicheActe modals.
 * This component must be placed inside both FicheActionnaireProvider and FicheActeProvider
 * to avoid circular dependency issues (FicheActionnaire uses ActeName which needs FicheActeContext,
 * and FicheActe uses ActionnaireName which needs FicheActionnaireContext).
 */
import FicheActe from "@/components/Actes/FicheActe"
import FicheActionnaire from "@/components/Personnes/FicheActionnaire"
import { useFicheActe } from "@/contexts/FicheActeContext"
import { useFicheActionnaire } from "@/contexts/FicheActionnaireContext"

export default function GlobalModals() {
  const {
    isOpen: isActeOpen,
    currentActeId,
    closeFiche: closeActe,
  } = useFicheActe()

  const {
    isOpen: isActionnaireOpen,
    currentPersonneId,
    closeFiche: closeActionnaire,
    openFiche: openActionnaire,
  } = useFicheActionnaire()

  return (
    <>
      {currentActeId !== null && (
        <FicheActe
          acteId={currentActeId}
          isOpen={isActeOpen}
          onClose={closeActe}
        />
      )}
      {currentPersonneId !== null && (
        <FicheActionnaire
          personneId={currentPersonneId}
          isOpen={isActionnaireOpen}
          onClose={closeActionnaire}
          onOpenPersonne={openActionnaire}
        />
      )}
    </>
  )
}
