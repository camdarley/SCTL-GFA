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

import { ParcellesService, type ParcelleWithSubdivisions } from "@/client"
import AddParcelle from "@/components/Parcelles/AddParcelle"
import EditParcelle from "@/components/Parcelles/EditParcelle"
import DeleteParcelle from "@/components/Parcelles/DeleteParcelle"

const parcellesSearchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute("/_layout/parcelles")({
  component: Parcelles,
  validateSearch: (search) => parcellesSearchSchema.parse(search),
})

const PER_PAGE = 20

function formatSurface(surface: string | number | null | undefined): string {
  if (!surface) return "-"
  const num = Number(surface)
  return `${num.toFixed(4)} ha`
}

function formatDivision(parcelle: ParcelleWithSubdivisions): string {
  if (!parcelle.nb_subdivisions || parcelle.nb_subdivisions === 0) return "-"
  if (parcelle.nb_subdivisions === 1) {
    return parcelle.first_division?.toString() || "-"
  }
  // Multiple subdivisions - show count
  return `${parcelle.nb_subdivisions} subdivisions`
}

function formatExploitant(parcelle: ParcelleWithSubdivisions): string {
  if (!parcelle.nb_subdivisions || parcelle.nb_subdivisions === 0) return "-"
  if (parcelle.nb_subdivisions === 1) {
    return parcelle.first_exploitant || "-"
  }
  // Multiple subdivisions - show first + count
  const firstExpl = parcelle.first_exploitant || "?"
  return `${firstExpl} (+${parcelle.nb_subdivisions - 1})`
}

function Parcelles() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingParcelle, setEditingParcelle] = useState<ParcelleWithSubdivisions | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["parcelles", page],
    queryFn: () =>
      ParcellesService.readParcelles({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
  })

  const setPage = (newPage: number) => {
    navigate({ search: { page: newPage } })
  }

  const parcelles = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / PER_PAGE)

  // Filter parcelles by search term (by parcelle reference, commune or exploitant)
  const filteredParcelles = searchTerm
    ? parcelles.filter(
        (p) =>
          p.parcelle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.nom_commune?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.first_exploitant?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : parcelles

  return (
    <Container maxW="full" py={4}>
      <Heading size="lg" mb={6}>
        Parcelles
      </Heading>

      {/* Search and Add */}
      <Flex mb={4} gap={4} flexWrap="wrap">
        <Flex flex={1} minW="200px">
          <Input
            placeholder="Rechercher par référence, commune ou exploitant..."
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
        <Text color="red.500">Erreur lors du chargement des parcelles.</Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>Parcelle</Table.ColumnHeader>
                <Table.ColumnHeader>Division</Table.ColumnHeader>
                <Table.ColumnHeader>Hectares</Table.ColumnHeader>
                <Table.ColumnHeader>Commune</Table.ColumnHeader>
                <Table.ColumnHeader>Lieu-dit</Table.ColumnHeader>
                <Table.ColumnHeader>Exploitant</Table.ColumnHeader>
                <Table.ColumnHeader>SCTL</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredParcelles.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={9}>
                    <Text textAlign="center" py={4}>
                      Aucune parcelle trouvée.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredParcelles.map((parcelle) => (
                  <Table.Row key={parcelle.id}>
                    <Table.Cell>{parcelle.id}</Table.Cell>
                    <Table.Cell fontWeight="medium">{parcelle.parcelle || "-"}</Table.Cell>
                    <Table.Cell>{formatDivision(parcelle)}</Table.Cell>
                    <Table.Cell>{formatSurface(parcelle.total_surface)}</Table.Cell>
                    <Table.Cell>{parcelle.nom_commune || "-"}</Table.Cell>
                    <Table.Cell>{parcelle.nom_lieu_dit || "-"}</Table.Cell>
                    <Table.Cell>{formatExploitant(parcelle)}</Table.Cell>
                    <Table.Cell>
                      {parcelle.sctl ? (
                        <Badge colorPalette="green">Oui</Badge>
                      ) : (
                        <Badge colorPalette="gray">Non</Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap={1}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingParcelle(parcelle)}
                        >
                          Modifier
                        </Button>
                        <DeleteParcelle id={parcelle.id} />
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
      <AddParcelle isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      {editingParcelle && (
        <EditParcelle
          parcelle={editingParcelle}
          isOpen={!!editingParcelle}
          onClose={() => setEditingParcelle(null)}
        />
      )}
    </Container>
  )
}
