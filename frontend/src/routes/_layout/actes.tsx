import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Table,
  Text,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { FiPlus, FiSearch } from "react-icons/fi"
import { z } from "zod"

import { ActesService, type ActeWithDetails } from "@/client"
import AddActe from "@/components/Actes/AddActe"
import EditActe from "@/components/Actes/EditActe"
import DeleteActe from "@/components/Actes/DeleteActe"

const actesSearchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute("/_layout/actes")({
  component: Actes,
  validateSearch: (search) => actesSearchSchema.parse(search),
})

const PER_PAGE = 20

function formatDate(date: string | null | undefined): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("fr-FR")
}

function Actes() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingActe, setEditingActe] = useState<ActeWithDetails | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["actes", page, searchTerm],
    queryFn: () =>
      ActesService.readActes({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
  })

  const setPage = (newPage: number) => {
    navigate({ search: { page: newPage } })
  }

  const actes = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / PER_PAGE)

  // Filter actes by search term
  const filteredActes = searchTerm
    ? actes.filter(
        (a) =>
          a.code_acte?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.libelle_acte?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : actes

  return (
    <Container maxW="full" py={4}>
      <Heading size="lg" mb={6}>
        Actes
      </Heading>

      {/* Search and Add */}
      <Flex mb={4} gap={4} flexWrap="wrap">
        <Flex flex={1} minW="200px">
          <Input
            placeholder="Rechercher un acte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button ml={2}>
            <FiSearch />
          </Button>
        </Flex>
        <Button colorPalette="blue" onClick={() => setIsAddOpen(true)}>
          <FiPlus />
          Ajouter
        </Button>
      </Flex>

      {/* Table */}
      {isLoading ? (
        <Text>Chargement...</Text>
      ) : isError ? (
        <Text color="red.500">Erreur lors du chargement des actes.</Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>Code Acte</Table.ColumnHeader>
                <Table.ColumnHeader>Date</Table.ColumnHeader>
                <Table.ColumnHeader>Libellé</Table.ColumnHeader>
                <Table.ColumnHeader>Structure</Table.ColumnHeader>
                <Table.ColumnHeader>Statut</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredActes.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7}>
                    <Text textAlign="center" py={4}>
                      Aucun acte trouvé.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredActes.map((acte) => (
                  <Table.Row key={acte.id}>
                    <Table.Cell>{acte.id}</Table.Cell>
                    <Table.Cell fontWeight="medium">
                      {acte.code_acte || "-"}
                    </Table.Cell>
                    <Table.Cell>{formatDate(acte.date_acte)}</Table.Cell>
                    <Table.Cell>{acte.libelle_acte || "-"}</Table.Cell>
                    <Table.Cell>{acte.structure_nom || "-"}</Table.Cell>
                    <Table.Cell>
                      {acte.provisoire ? (
                        <Badge colorPalette="orange">Provisoire</Badge>
                      ) : (
                        <Badge colorPalette="green">Définitif</Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap={1}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingActe(acte)}
                        >
                          Modifier
                        </Button>
                        <DeleteActe id={acte.id} />
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Flex mt={4} justify="center" gap={2}>
          <Button
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Précédent
          </Button>
          <Text alignSelf="center">
            Page {page} sur {totalPages}
          </Text>
          <Button
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Suivant
          </Button>
        </Flex>
      )}

      {/* Dialogs */}
      <AddActe isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      {editingActe && (
        <EditActe
          acte={editingActe}
          isOpen={!!editingActe}
          onClose={() => setEditingActe(null)}
        />
      )}
    </Container>
  )
}
