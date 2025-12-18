import {
  Badge,
  Container,
  Flex,
  Heading,
  Input,
  Table,
  HStack,
  IconButton,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { z } from "zod"
import { useState } from "react"
import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi"

import { PersonnesService, type PersonnePublic, type PersonnesPublic } from "@/client"
import AddPersonne from "@/components/Personnes/AddPersonne"
import DeletePersonne from "@/components/Personnes/DeletePersonne"
import EditPersonne from "@/components/Personnes/EditPersonne"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"

const personnesSearchSchema = z.object({
  page: z.number().catch(1),
  nom: z.string().optional(),
  ville: z.string().optional(),
})

const PER_PAGE = 20

function getPersonnesQueryOptions({
  page,
  nom,
  ville,
}: {
  page: number
  nom?: string
  ville?: string
}) {
  return {
    queryFn: () =>
      PersonnesService.readPersonnes({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        nom: nom || undefined,
        ville: ville || undefined,
      }),
    queryKey: ["personnes", { page, nom, ville }],
  }
}

export const Route = createFileRoute("/_layout/personnes")({
  component: PersonnesPage,
  validateSearch: (search) => personnesSearchSchema.parse(search),
})

function PersonnesTable() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page, nom, ville } = Route.useSearch()
  const [searchNom, setSearchNom] = useState(nom || "")
  const [editPersonne, setEditPersonne] = useState<PersonnePublic | null>(null)
  const [deletePersonne, setDeletePersonne] = useState<PersonnePublic | null>(null)

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getPersonnesQueryOptions({ page, nom, ville }),
    placeholderData: (prevData: PersonnesPublic | undefined) => prevData,
  })

  const setPage = (newPage: number) =>
    navigate({
      search: (prev: { page: number; nom?: string; ville?: string }) => ({ ...prev, page: newPage }),
    })

  const handleSearch = () => {
    navigate({
      search: (prev: { page: number; nom?: string; ville?: string }) => ({ ...prev, page: 1, nom: searchNom || undefined }),
    })
  }

  const personnes = data?.data ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return (
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Nom</Table.ColumnHeader>
            <Table.ColumnHeader>Prénom</Table.ColumnHeader>
            <Table.ColumnHeader>Ville</Table.ColumnHeader>
            <Table.ColumnHeader>État</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {[...Array(5)].map((_, i) => (
            <Table.Row key={i}>
              <Table.Cell><Skeleton height="20px" /></Table.Cell>
              <Table.Cell><Skeleton height="20px" /></Table.Cell>
              <Table.Cell><Skeleton height="20px" /></Table.Cell>
              <Table.Cell><Skeleton height="20px" /></Table.Cell>
              <Table.Cell><Skeleton height="20px" /></Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    )
  }

  return (
    <>
      <HStack mb={4} gap={2}>
        <Input
          placeholder="Rechercher par nom..."
          value={searchNom}
          onChange={(e) => setSearchNom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          maxW="300px"
        />
      </HStack>

      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader w="20%">Nom</Table.ColumnHeader>
            <Table.ColumnHeader w="15%">Prénom</Table.ColumnHeader>
            <Table.ColumnHeader w="20%">Ville</Table.ColumnHeader>
            <Table.ColumnHeader w="25%">État</Table.ColumnHeader>
            <Table.ColumnHeader w="20%">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {personnes.map((personne) => (
            <Table.Row key={personne.id} opacity={isPlaceholderData ? 0.5 : 1}>
              <Table.Cell fontWeight="medium">{personne.nom}</Table.Cell>
              <Table.Cell>{personne.prenom || "-"}</Table.Cell>
              <Table.Cell>{personne.ville || "-"}</Table.Cell>
              <Table.Cell>
                <HStack gap={1} flexWrap="wrap">
                  {personne.fondateur && <Badge colorPalette="blue" size="sm">Fondateur</Badge>}
                  {personne.adherent && <Badge colorPalette="green" size="sm">Adhérent</Badge>}
                  {personne.decede && <Badge colorPalette="red" size="sm">Décédé</Badge>}
                  {personne.npai && <Badge colorPalette="orange" size="sm">NPAI</Badge>}
                  {personne.termine && <Badge colorPalette="gray" size="sm">Terminé</Badge>}
                  {personne.est_personne_morale && <Badge colorPalette="purple" size="sm">PM</Badge>}
                </HStack>
              </Table.Cell>
              <Table.Cell>
                <HStack gap={1}>
                  <Link to={`/personnes/${personne.id}`}>
                    <IconButton
                      aria-label="Voir"
                      size="sm"
                      variant="ghost"
                    >
                      <FiEye />
                    </IconButton>
                  </Link>
                  <IconButton
                    aria-label="Modifier"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditPersonne(personne)}
                  >
                    <FiEdit />
                  </IconButton>
                  <IconButton
                    aria-label="Supprimer"
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => setDeletePersonne(personne)}
                  >
                    <FiTrash2 />
                  </IconButton>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Flex justifyContent="space-between" alignItems="center" mt={4}>
        <Text fontSize="sm" color="gray.500">
          {count} actionnaire{count > 1 ? "s" : ""} trouvé{count > 1 ? "s" : ""}
        </Text>
        <PaginationRoot
          count={count}
          pageSize={PER_PAGE}
          page={page}
          onPageChange={({ page }) => setPage(page)}
        >
          <Flex>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </Flex>
        </PaginationRoot>
      </Flex>

      {editPersonne && (
        <EditPersonne
          personne={editPersonne}
          isOpen={!!editPersonne}
          onClose={() => setEditPersonne(null)}
        />
      )}
      {deletePersonne && (
        <DeletePersonne
          personne={deletePersonne}
          isOpen={!!deletePersonne}
          onClose={() => setDeletePersonne(null)}
        />
      )}
    </>
  )
}

function PersonnesPage() {
  return (
    <Container maxW="full">
      <Heading size="lg" pt={12}>
        Gestion des Actionnaires
      </Heading>
      <Text color="gray.500" mb={4}>
        Liste des actionnaires (personnes physiques et morales)
      </Text>

      <AddPersonne />
      <PersonnesTable />
    </Container>
  )
}
