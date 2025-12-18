import { Link } from "@chakra-ui/react"
import { useFicheActionnaire } from "../../contexts/FicheActionnaireContext"

interface ActionnaireNameProps {
  personneId: number
  nom: string
  prenom?: string | null
  /** Afficher le format "NOM Prénom" ou juste le nom si prenom n'est pas fourni */
  showPrenom?: boolean
  /** Couleur du lien (default: "blue.500") */
  color?: string
  /** Comportement au survol */
  hoverColor?: string
}

/**
 * Composant réutilisable pour afficher le nom d'un actionnaire
 * avec un lien cliquable qui ouvre la modale FicheActionnaire
 */
export default function ActionnaireName({
  personneId,
  nom,
  prenom,
  showPrenom = true,
  color = "blue.600",
  hoverColor = "blue.800",
}: ActionnaireNameProps) {
  const { openFiche } = useFicheActionnaire()

  const displayName = showPrenom && prenom
    ? `${nom} ${prenom}`
    : nom

  return (
    <Link
      color={color}
      cursor="pointer"
      _hover={{ color: hoverColor, textDecoration: "underline" }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        openFiche(personneId)
      }}
    >
      {displayName}
    </Link>
  )
}
