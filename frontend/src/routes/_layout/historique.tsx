import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { FiArrowDown, FiArrowUp, FiFilter } from "react-icons/fi"
import { z } from "zod"

import {
  ActesService,
  MouvementsService,
  PersonnesService,
} from "@/client"
import ActionnaireName from "@/components/Common/ActionnaireName"
import ActeName from "@/components/Common/ActeName"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@chakra-ui/react"

const historiqueSearchSchema = z.object({
  page: z.number().catch(1),
  idPersonne: z.number().optional(),
  idActe: z.number().optional(),
  sens: z.boolean().optional(),
})

type HistoriqueSearch = z.infer<typeof historiqueSearchSchema>

const PER_PAGE = 25

export const Route = createFileRoute("/_layout/historique")({
  component: HistoriquePage,
  validateSearch: (search) => historiqueSearchSchema.parse(search),
})

function HistoriquePage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page, idPersonne, idActe, sens } = Route.useSearch()

  const [showFilters, setShowFilters] = useState(false)
  const [searchPersonne, setSearchPersonne] = useState("")
  const [searchActe, setSearchActe] = useState("")

  // Fetch mouvements with filters
  const { data: mouvementsData, isLoading } = useQuery({
    queryKey: ["mouvements", { page, idPersonne, idActe, sens }],
    queryFn: () =>
      MouvementsService.readMouvements({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        idPersonne: idPersonne ?? undefined,
        idActe: idActe ?? undefined,
        sens: sens ?? undefined,
      }),
  })

  // Fetch personnes for enrichment
  const { data: personnesData } = useQuery({
    queryKey: ["personnes", "all"],
    queryFn: () => PersonnesService.readPersonnes({ limit: 10000 }),
  })

  // Fetch actes for enrichment
  const { data: actesData } = useQuery({
    queryKey: ["actes", "all"],
    queryFn: () => ActesService.readActes({ limit: 10000 }),
  })

  // Search results for filters
  const { data: searchPersonnesData } = useQuery({
    queryKey: ["personnes", "search", searchPersonne],
    queryFn: () =>
      PersonnesService.readPersonnes({
        nom: searchPersonne || undefined,
        limit: 10,
      }),
    enabled: searchPersonne.length >= 2,
  })

  const { data: searchActesData } = useQuery({
    queryKey: ["actes", "search", searchActe],
    queryFn: () => ActesService.readActes({ limit: 50 }),
    enabled: searchActe.length >= 1,
  })

  const mouvements = mouvementsData?.data ?? []
  const count = mouvementsData?.count ?? 0
  const personnes = personnesData?.data ?? []
  const actes = actesData?.data ?? []
  const searchPersonnes = searchPersonnesData?.data ?? []
  const searchActes = searchActesData?.data ?? []

  // Filter search actes
  const filteredSearchActes = searchActe
    ? searchActes.filter(
        (a) =>
          a.code_acte.toLowerCase().includes(searchActe.toLowerCase()) ||
          a.libelle_acte?.toLowerCase().includes(searchActe.toLowerCase()),
      )
    : searchActes

  const getPersonneName = (idPersonne: number) => {
    const p = personnes.find((p) => p.id === idPersonne)
    return p ? `${p.nom} ${p.prenom || ""}`.trim() : `#${idPersonne}`
  }

  const getPersonneData = (idPersonne: number) => {
    return personnes.find((p) => p.id === idPersonne)
  }

  const getActeCode = (idActe: number | null) => {
    if (!idActe) return null
    const a = actes.find((a) => a.id === idActe)
    return a?.code_acte ?? `#${idActe}`
  }

  const getActeDate = (idActe: number | null) => {
    if (!idActe) return null
    const a = actes.find((a) => a.id === idActe)
    return a?.date_acte ?? null
  }

  const setPage = (newPage: number) => {
    navigate({
      search: (prev: HistoriqueSearch) => ({ ...prev, page: newPage }),
    })
  }

  const applyFilter = (key: string, value: number | boolean | undefined) => {
    navigate({
      search: (prev: HistoriqueSearch) => ({
        ...prev,
        page: 1,
        [key]: value,
      }),
    })
  }

  const clearFilters = () => {
    navigate({
      search: { page: 1 },
    })
  }

  const hasFilters = idPersonne !== undefined || idActe !== undefined || sens !== undefined

  return (
    <Container maxW="full" py={4}>
      <Heading size="lg" mb={2}>
        Historique des Mouvements
      </Heading>
      <Text color="gray.500" mb={4}>
        Tous les mouvements de parts (acquisitions et cessions)
      </Text>

      {/* Filter toggle */}
      <Flex mb={4} gap={4} flexWrap="wrap" align="center">
        <Button
          variant={showFilters ? "solid" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter /> Filtres {hasFilters && `(${[idPersonne, idActe, sens].filter(x => x !== undefined).length})`}
        </Button>

        {hasFilters && (
          <Button variant="ghost" colorPalette="red" onClick={clearFilters}>
            Effacer les filtres
          </Button>
        )}

        {/* Active filter badges */}
        <HStack gap={2} flexWrap="wrap">
          {idPersonne && (
            <Badge colorPalette="blue" size="lg">
              Personne: {getPersonneName(idPersonne)}
              <Button
                size="xs"
                variant="ghost"
                ml={1}
                onClick={() => applyFilter("idPersonne", undefined)}
              >
                ×
              </Button>
            </Badge>
          )}
          {idActe && (
            <Badge colorPalette="purple" size="lg">
              Acte: {getActeCode(idActe)}
              <Button
                size="xs"
                variant="ghost"
                ml={1}
                onClick={() => applyFilter("idActe", undefined)}
              >
                ×
              </Button>
            </Badge>
          )}
          {sens !== undefined && (
            <Badge colorPalette={sens ? "green" : "red"} size="lg">
              {sens ? "Acquisitions" : "Cessions"}
              <Button
                size="xs"
                variant="ghost"
                ml={1}
                onClick={() => applyFilter("sens", undefined)}
              >
                ×
              </Button>
            </Badge>
          )}
        </HStack>
      </Flex>

      {/* Filter panel */}
      {showFilters && (
        <Box p={4} mb={4} borderWidth={1} borderRadius="md" bg="gray.50" _dark={{ bg: "gray.800" }}>
          <VStack gap={4} align="stretch">
            <HStack gap={4} flexWrap="wrap">
              {/* Sens filter */}
              <VStack align="start" gap={1}>
                <Text fontWeight="medium" fontSize="sm">
                  Type de mouvement
                </Text>
                <HStack>
                  <Button
                    size="sm"
                    variant={sens === true ? "solid" : "outline"}
                    colorPalette="green"
                    onClick={() => applyFilter("sens", sens === true ? undefined : true)}
                  >
                    <FiArrowUp /> Acquisitions
                  </Button>
                  <Button
                    size="sm"
                    variant={sens === false ? "solid" : "outline"}
                    colorPalette="red"
                    onClick={() => applyFilter("sens", sens === false ? undefined : false)}
                  >
                    <FiArrowDown /> Cessions
                  </Button>
                </HStack>
              </VStack>
            </HStack>

            <HStack gap={4} flexWrap="wrap" align="start">
              {/* Personne filter */}
              <VStack align="start" gap={1} minW="250px">
                <Text fontWeight="medium" fontSize="sm">
                  Filtrer par personne
                </Text>
                <Input
                  placeholder="Rechercher par nom..."
                  value={searchPersonne}
                  onChange={(e) => setSearchPersonne(e.target.value)}
                  size="sm"
                />
                {searchPersonne.length >= 2 && searchPersonnes.length > 0 && (
                  <Box
                    maxH="150px"
                    overflowY="auto"
                    borderWidth={1}
                    borderRadius="md"
                    w="full"
                    bg="white"
                    _dark={{ bg: "gray.700" }}
                  >
                    {searchPersonnes.map((p) => (
                      <Box
                        key={p.id}
                        p={2}
                        cursor="pointer"
                        _hover={{ bg: "gray.100" }}
                        _dark={{ _hover: { bg: "gray.600" } }}
                        onClick={() => {
                          applyFilter("idPersonne", p.id)
                          setSearchPersonne("")
                        }}
                      >
                        <Text fontSize="sm">
                          {p.nom} {p.prenom}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                )}
              </VStack>

              {/* Acte filter */}
              <VStack align="start" gap={1} minW="250px">
                <Text fontWeight="medium" fontSize="sm">
                  Filtrer par acte
                </Text>
                <Input
                  placeholder="Code ou libellé..."
                  value={searchActe}
                  onChange={(e) => setSearchActe(e.target.value)}
                  size="sm"
                />
                {searchActe.length >= 1 && filteredSearchActes.length > 0 && (
                  <Box
                    maxH="150px"
                    overflowY="auto"
                    borderWidth={1}
                    borderRadius="md"
                    w="full"
                    bg="white"
                    _dark={{ bg: "gray.700" }}
                  >
                    {filteredSearchActes.slice(0, 10).map((a) => (
                      <Box
                        key={a.id}
                        p={2}
                        cursor="pointer"
                        _hover={{ bg: "gray.100" }}
                        _dark={{ _hover: { bg: "gray.600" } }}
                        onClick={() => {
                          applyFilter("idActe", a.id)
                          setSearchActe("")
                        }}
                      >
                        <Text fontSize="sm" fontWeight="medium">
                          {a.code_acte}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {a.libelle_acte}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                )}
              </VStack>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Table */}
      {isLoading ? (
        <VStack gap={2}>
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} height="40px" w="full" />
          ))}
        </VStack>
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader w="120px">Date</Table.ColumnHeader>
                <Table.ColumnHeader w="100px">Sens</Table.ColumnHeader>
                <Table.ColumnHeader>Personne</Table.ColumnHeader>
                <Table.ColumnHeader w="100px">Nb Parts</Table.ColumnHeader>
                <Table.ColumnHeader>Acte</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {mouvements.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5}>
                    <Text textAlign="center" py={8} color="gray.500">
                      Aucun mouvement trouvé
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                mouvements.map((mvt) => (
                  <Table.Row key={mvt.id}>
                    <Table.Cell>
                      {(() => {
                        const date = mvt.date_operation || getActeDate(mvt.id_acte)
                        return date
                          ? new Date(date).toLocaleDateString("fr-FR")
                          : "-"
                      })()}
                    </Table.Cell>
                    <Table.Cell>
                      {mvt.sens ? (
                        <Badge colorPalette="green">
                          <FiArrowUp /> +
                        </Badge>
                      ) : (
                        <Badge colorPalette="red">
                          <FiArrowDown /> -
                        </Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {(() => {
                        const p = getPersonneData(mvt.id_personne)
                        return p ? (
                          <ActionnaireName
                            personneId={p.id}
                            nom={p.nom}
                            prenom={p.prenom}
                          />
                        ) : (
                          <Text>#{mvt.id_personne}</Text>
                        )
                      })()}
                    </Table.Cell>
                    <Table.Cell fontWeight="bold">{mvt.nb_parts}</Table.Cell>
                    <Table.Cell>
                      {mvt.id_acte ? (
                        <ActeName
                          acteId={mvt.id_acte}
                          codeActe={getActeCode(mvt.id_acte) || `#${mvt.id_acte}`}
                        />
                      ) : (
                        <Badge colorPalette="orange">Sans acte</Badge>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Pagination */}
      <Flex justifyContent="space-between" alignItems="center" mt={4}>
        <Text fontSize="sm" color="gray.500">
          {count} mouvement{count > 1 ? "s" : ""} trouvé{count > 1 ? "s" : ""}
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
    </Container>
  )
}
