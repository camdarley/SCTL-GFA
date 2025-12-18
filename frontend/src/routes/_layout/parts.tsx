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
import { FiArrowDown, FiArrowUp, FiPlus, FiSearch } from "react-icons/fi"
import { z } from "zod"

import { NumerosPartsService, type NumeroPartWithDetails } from "@/client"
import ActionnaireName from "@/components/Common/ActionnaireName"
import AddNumeroParts from "@/components/Parts/AddNumeroParts"
import EditNumeroParts from "@/components/Parts/EditNumeroParts"
import DeleteNumeroParts from "@/components/Parts/DeleteNumeroParts"

const partsSearchSchema = z.object({
  page: z.number().catch(1),
  numPart: z.number().optional(),
})

export const Route = createFileRoute("/_layout/parts")({
  component: Parts,
  validateSearch: (search) => partsSearchSchema.parse(search),
})

const PER_PAGE = 20

type PartsSearch = { page: number; numPart?: number }

function Parts() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page, numPart } = Route.useSearch()
  const [searchTerm, setSearchTerm] = useState(numPart?.toString() || "")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<NumeroPartWithDetails | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["numeros-parts", page, numPart],
    queryFn: () =>
      NumerosPartsService.readNumerosParts({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        numPart: numPart ?? undefined,
      }),
  })

  const setPage = (newPage: number) => {
    navigate({ search: (prev: PartsSearch) => ({ ...prev, page: newPage }) })
  }

  const handleSearch = () => {
    const numPartValue = searchTerm ? parseInt(searchTerm, 10) : undefined
    navigate({
      search: { page: 1, numPart: numPartValue && !isNaN(numPartValue) ? numPartValue : undefined },
    })
  }

  const clearSearch = () => {
    setSearchTerm("")
    navigate({ search: { page: 1 } })
  }

  const parts = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / PER_PAGE)

  return (
    <Container maxW="full" py={4}>
      <Heading size="lg" mb={6}>
        Numéros de Parts
      </Heading>

      {/* Search and Add */}
      <Flex mb={4} gap={4} flexWrap="wrap">
        <Flex flex={1} minW="200px">
          <Input
            placeholder="Rechercher par numéro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            type="number"
          />
          <Button ml={2} onClick={handleSearch}>
            <FiSearch />
          </Button>
          {numPart && (
            <Button ml={2} variant="ghost" colorPalette="red" onClick={clearSearch}>
              Effacer
            </Button>
          )}
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
        <Text color="red.500">Erreur lors du chargement des numéros de parts.</Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>Numéro Part</Table.ColumnHeader>
                <Table.ColumnHeader>Personne</Table.ColumnHeader>
                <Table.ColumnHeader>Structure</Table.ColumnHeader>
                <Table.ColumnHeader>Mouvement</Table.ColumnHeader>
                <Table.ColumnHeader>État</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {parts.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7}>
                    <Text textAlign="center" py={4}>
                      Aucun numéro de parts trouvé.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                parts.map((part) => (
                  <Table.Row key={part.id}>
                    <Table.Cell>{part.id}</Table.Cell>
                    <Table.Cell fontWeight="medium">{part.num_part}</Table.Cell>
                    <Table.Cell>
                      {part.id_personne && part.personne_nom ? (
                        <ActionnaireName
                          personneId={part.id_personne}
                          nom={part.personne_nom}
                          prenom={part.personne_prenom}
                        />
                      ) : (
                        "-"
                      )}
                    </Table.Cell>
                    <Table.Cell>{part.structure_nom || "-"}</Table.Cell>
                    <Table.Cell>
                      {part.mouvement_sens !== null && part.mouvement_sens !== undefined ? (
                        <Flex gap={1} align="center">
                          <Badge colorPalette={part.mouvement_sens ? "green" : "red"} fontWeight="bold">
                            {part.mouvement_sens ? <FiArrowUp /> : <FiArrowDown />}
                          </Badge>
                          <Text fontSize="xs" color="gray.600" _dark={{ color: "gray.400" }}>
                            {part.mouvement_date
                              ? new Date(part.mouvement_date).toLocaleDateString("fr-FR")
                              : ""}
                            {part.mouvement_code_acte && ` (${part.mouvement_code_acte})`}
                          </Text>
                        </Flex>
                      ) : (
                        <Text fontSize="sm" color="gray.400">-</Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {part.termine ? (
                        <Badge colorPalette="green">Terminée</Badge>
                      ) : (
                        <Badge colorPalette="gray">Active</Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap={1}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingPart(part)}
                        >
                          Modifier
                        </Button>
                        <DeleteNumeroParts id={part.id} />
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
      <AddNumeroParts isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      {editingPart && (
        <EditNumeroParts
          numeroPart={editingPart}
          isOpen={!!editingPart}
          onClose={() => setEditingPart(null)}
        />
      )}
    </Container>
  )
}
