import { Link } from "@chakra-ui/react"
import { useFicheActe } from "../../contexts/FicheActeContext"

interface ActeNameProps {
  acteId: number
  codeActe: string
  /** Couleur du lien (default: "purple.600") */
  color?: string
  /** Comportement au survol */
  hoverColor?: string
}

/**
 * Composant réutilisable pour afficher le code d'un acte
 * avec un lien cliquable qui ouvre la modale FicheActe
 */
export default function ActeName({
  acteId,
  codeActe,
  color = "purple.600",
  hoverColor = "purple.800",
}: ActeNameProps) {
  const { openFiche } = useFicheActe()

  return (
    <Link
      color={color}
      cursor="pointer"
      _hover={{ color: hoverColor, textDecoration: "underline" }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        openFiche(acteId)
      }}
    >
      {codeActe}
    </Link>
  )
}
