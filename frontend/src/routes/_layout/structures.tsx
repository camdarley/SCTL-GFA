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

import { StructuresService, type StructurePublic } from "@/client"
import AddStructure from "@/components/Structures/AddStructure"
import EditStructure from "@/components/Structures/EditStructure"
import DeleteStructure from "@/components/Structures/DeleteStructure"

const structuresSearchSchema = z.object({
  page: z.number().catch(1),
})

export const Route = createFileRoute("/_layout/structures")({
  component: Structures,
  validateSearch: (search) => structuresSearchSchema.parse(search),
})

const PER_PAGE = 20

function getStructureTypeLabel(type: number): string {
  const types: Record<number, string> = {
    2: "GFA",
    5: "Association",
    6: "SCTL",
  }
  return types[type] || `Type ${type}`
}

function getStructureTypeBadgeColor(type: number): string {
  const colors: Record<number, string> = {
    2: "blue",
    5: "green",
    6: "purple",
  }
  return colors[type] || "gray"
}

function Structures() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingStructure, setEditingStructure] = useState<StructurePublic | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["structures", page, searchTerm],
    queryFn: () =>
      StructuresService.readStructures({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
  })

  const setPage = (newPage: number) => {
    navigate({ search: { page: newPage } })
  }

  const structures = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / PER_PAGE)

  // Filter structures by search term
  const filteredStructures = searchTerm
    ? structures.filter(
        (s) =>
          s.nom_structure.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.gfa?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : structures

  return (
    <Container maxW="full" py={4}>
      <Heading size="lg" mb={6}>
        Structures
      </Heading>

      {/* Search and Add */}
      <Flex mb={4} gap={4} flexWrap="wrap">
        <Flex flex={1} minW="200px">
          <Input
            placeholder="Rechercher une structure..."
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
        <Text color="red.500">Erreur lors du chargement des structures.</Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
                <Table.ColumnHeader>Nom</Table.ColumnHeader>
                <Table.ColumnHeader>Code GFA</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredStructures.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5}>
                    <Text textAlign="center" py={4}>
                      Aucune structure trouvée.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredStructures.map((structure) => (
                  <Table.Row key={structure.id}>
                    <Table.Cell>{structure.id}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={getStructureTypeBadgeColor(structure.type_structure || 2)}>
                        {getStructureTypeLabel(structure.type_structure || 2)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell fontWeight="medium">{structure.nom_structure}</Table.Cell>
                    <Table.Cell>{structure.gfa || "-"}</Table.Cell>
                    <Table.Cell>
                      <Flex gap={1}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingStructure(structure)}
                        >
                          Modifier
                        </Button>
                        <DeleteStructure id={structure.id} />
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
      <AddStructure isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      {editingStructure && (
        <EditStructure
          structure={editingStructure}
          isOpen={!!editingStructure}
          onClose={() => setEditingStructure(null)}
        />
      )}
    </Container>
  )
}
