import {
  Badge,
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Input,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import {
  FiEdit,
  FiFilter,
  FiRefreshCw,
  FiTrash2,
  FiUser,
  FiUsers,
} from "react-icons/fi"
import { z } from "zod"

import {
  PersonnesService,
  type PersonneWithParts,
} from "@/client"
import ActionnaireName from "@/components/Common/ActionnaireName"
import AddPersonne from "@/components/Personnes/AddPersonne"
import DeletePersonne from "@/components/Personnes/DeletePersonne"
import EditPersonne from "@/components/Personnes/EditPersonne"
import CessionParts from "@/components/Parts/CessionParts"
import { Button } from "@chakra-ui/react"
import { Checkbox } from "@/components/ui/checkbox"
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
  idStructure: z.number().optional(),
  // Filter flags
  fondateur: z.boolean().optional(),
  deDroit: z.boolean().optional(),
  adherent: z.boolean().optional(),
  npai: z.boolean().optional(),
  decede: z.boolean().optional(),
  termine: z.boolean().optional(),
  excludeNpai: z.boolean().optional(),
  excludeDecede: z.boolean().optional(),
  excludeTermine: z.boolean().optional(),
  // Type filter
  typeFilter: z.enum(["all", "gfa", "sctl"]).optional(),
})

type PersonnesSearch = z.infer<typeof personnesSearchSchema>

const PER_PAGE = 25

export const Route = createFileRoute("/_layout/personnes")({
  component: PersonnesPage,
  validateSearch: (search) => personnesSearchSchema.parse(search),
})

function PersonnesPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const searchParams = Route.useSearch()
  const {
    page,
    nom,
    idStructure,
    fondateur,
    deDroit,
    adherent,
    npai,
    decede,
    termine,
    excludeNpai,
    excludeDecede,
    excludeTermine,
    typeFilter,
  } = searchParams

  const [showFilters, setShowFilters] = useState(false)
  const [searchNom, setSearchNom] = useState(nom || "")
  const [editPersonne, setEditPersonne] = useState<PersonneWithParts | null>(null)
  const [deletePersonne, setDeletePersonne] = useState<PersonneWithParts | null>(null)
  const [cessionPersonne, setCessionPersonne] = useState<PersonneWithParts | null>(null)

  // Fetch all personnes with parts info (backend now returns counts directly)
  const { data: personnesData, isLoading, refetch } = useQuery({
    queryKey: [
      "personnes-with-parts",
      {
        page,
        nom,
        idStructure,
        fondateur,
        deDroit,
        adherent,
        npai,
        decede,
        termine,
      },
    ],
    queryFn: () =>
      PersonnesService.readPersonnes({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        nom: nom || undefined,
        idStructure: idStructure ?? undefined,
        fondateur: fondateur ?? undefined,
        deDroit: deDroit ?? undefined,
        adherent: adherent ?? undefined,
        npai: npai ?? undefined,
        decede: decede ?? undefined,
        termine: termine ?? undefined,
      }),
  })

  // Fetch global totals from API (not affected by pagination)
  const { data: totalsData } = useQuery({
    queryKey: ["personnes-totals"],
    queryFn: () => PersonnesService.readPartsTotals(),
  })

  const personnes = personnesData?.data ?? []
  const count = personnesData?.count ?? 0
  const globalTotals = totalsData ?? { gfa: 0, sctl: 0, total: 0, actionnaires: 0 }

  // Apply client-side filters
  const filteredPersonnes = useMemo(() => {
    let result = personnes

    // Exclude filters
    if (excludeNpai) {
      result = result.filter((p) => !p.npai)
    }
    if (excludeDecede) {
      result = result.filter((p) => !p.decede)
    }
    if (excludeTermine) {
      result = result.filter((p) => !p.termine)
    }

    // Type filter
    if (typeFilter === "gfa") {
      result = result.filter((p) => (p.nb_parts_gfa ?? 0) > 0)
    } else if (typeFilter === "sctl") {
      result = result.filter((p) => (p.nb_parts_sctl ?? 0) > 0)
    }

    return result
  }, [personnes, excludeNpai, excludeDecede, excludeTermine, typeFilter])

  const setPage = (newPage: number) => {
    navigate({
      search: (prev: PersonnesSearch) => ({ ...prev, page: newPage }),
    })
  }

  const handleSearch = () => {
    navigate({
      search: (prev: PersonnesSearch) => ({ ...prev, page: 1, nom: searchNom || undefined }),
    })
  }

  const applyFilter = (key: string, value: boolean | number | string | undefined) => {
    navigate({
      search: (prev: PersonnesSearch) => ({
        ...prev,
        page: 1,
        [key]: value,
      }),
    })
  }

  const clearFilters = () => {
    setSearchNom("")
    navigate({
      search: { page: 1 },
    })
  }

  const hasFilters =
    nom ||
    idStructure ||
    fondateur ||
    deDroit ||
    adherent ||
    npai ||
    decede ||
    termine ||
    excludeNpai ||
    excludeDecede ||
    excludeTermine ||
    typeFilter

  const getRowBgColor = (p: PersonneWithParts) => {
    if (p.decede) return { light: "red.50", dark: "red.900" }
    if (p.npai) return { light: "orange.50", dark: "orange.900" }
    if (p.termine) return { light: "gray.100", dark: "gray.700" }
    if (p.fondateur) return { light: "blue.50", dark: "blue.900" }
    return { light: undefined, dark: undefined }
  }

  return (
    <Container maxW="full" py={4}>
      <Flex mb={4} justify="space-between" align="center" flexWrap="wrap" gap={2}>
        <Box>
          <Heading size="lg">Gestion des Actionnaires</Heading>
          <Text color="gray.500">
            Liste des actionnaires et synthèse des parts
          </Text>
        </Box>
        <HStack>
          <AddPersonne />
          <IconButton aria-label="Rafraîchir" variant="outline" onClick={() => refetch()}>
            <FiRefreshCw />
          </IconButton>
        </HStack>
      </Flex>

      {/* Summary cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50" _dark={{ bg: "blue.900" }}>
            <Text fontWeight="medium" color="blue.700" _dark={{ color: "blue.200" }}>
              Total Parts GFA
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {globalTotals.gfa}
            </Text>
          </Box>
        </GridItem>
        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md" bg="green.50" _dark={{ bg: "green.900" }}>
            <Text fontWeight="medium" color="green.700" _dark={{ color: "green.200" }}>
              Total Parts SCTL
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {globalTotals.sctl}
            </Text>
          </Box>
        </GridItem>
        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md" bg="purple.50" _dark={{ bg: "purple.900" }}>
            <Text fontWeight="medium" color="purple.700" _dark={{ color: "purple.200" }}>
              Total Général
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {globalTotals.total}
            </Text>
          </Box>
        </GridItem>
        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50" _dark={{ bg: "gray.700" }}>
            <Text fontWeight="medium" color="gray.700" _dark={{ color: "gray.200" }}>
              Actionnaires
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {globalTotals.actionnaires}
            </Text>
          </Box>
        </GridItem>
      </Grid>

      {/* Search and filter toggle */}
      <Flex mb={4} gap={4} flexWrap="wrap" align="center">
        <HStack flex={1} minW="250px">
          <Input
            placeholder="Rechercher par nom..."
            value={searchNom}
            onChange={(e) => setSearchNom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch}>Rechercher</Button>
        </HStack>

        <Button
          variant={showFilters ? "solid" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter /> Filtres
        </Button>

        {hasFilters && (
          <Button variant="ghost" colorPalette="red" onClick={clearFilters}>
            Effacer
          </Button>
        )}
      </Flex>

      {/* Filter panel */}
      {showFilters && (
        <Box p={4} mb={4} borderWidth={1} borderRadius="md" bg="gray.50" _dark={{ bg: "gray.800" }}>
          <VStack gap={4} align="stretch">
            {/* Type filter */}
            <HStack gap={4}>
              <Text fontWeight="medium" minW="100px">Type :</Text>
              <HStack>
                <Button
                  size="sm"
                  variant={typeFilter === undefined || typeFilter === "all" ? "solid" : "outline"}
                  onClick={() => applyFilter("typeFilter", undefined)}
                >
                  Tous
                </Button>
                <Button
                  size="sm"
                  variant={typeFilter === "gfa" ? "solid" : "outline"}
                  colorPalette="blue"
                  onClick={() => applyFilter("typeFilter", "gfa")}
                >
                  GFA seul
                </Button>
                <Button
                  size="sm"
                  variant={typeFilter === "sctl" ? "solid" : "outline"}
                  colorPalette="green"
                  onClick={() => applyFilter("typeFilter", "sctl")}
                >
                  SCTL seul
                </Button>
              </HStack>
            </HStack>

            {/* Include filters */}
            <Box>
              <Text fontWeight="medium" mb={2}>Inclure uniquement :</Text>
              <HStack gap={4} flexWrap="wrap">
                <Checkbox
                  checked={fondateur ?? false}
                  onCheckedChange={({ checked }) =>
                    applyFilter("fondateur", checked ? true : undefined)
                  }
                >
                  Fondateurs
                </Checkbox>
                <Checkbox
                  checked={deDroit ?? false}
                  onCheckedChange={({ checked }) =>
                    applyFilter("deDroit", checked ? true : undefined)
                  }
                >
                  De droit
                </Checkbox>
                <Checkbox
                  checked={adherent ?? false}
                  onCheckedChange={({ checked }) =>
                    applyFilter("adherent", checked ? true : undefined)
                  }
                >
                  Adhérents
                </Checkbox>
              </HStack>
            </Box>

            {/* Exclude filters */}
            <Box>
              <Text fontWeight="medium" mb={2}>Exclure :</Text>
              <HStack gap={4} flexWrap="wrap">
                <Checkbox
                  checked={excludeNpai ?? false}
                  onCheckedChange={({ checked }) =>
                    applyFilter("excludeNpai", checked ? true : undefined)
                  }
                >
                  NPAI
                </Checkbox>
                <Checkbox
                  checked={excludeDecede ?? false}
                  onCheckedChange={({ checked }) =>
                    applyFilter("excludeDecede", checked ? true : undefined)
                  }
                >
                  Décédés
                </Checkbox>
                <Checkbox
                  checked={excludeTermine ?? false}
                  onCheckedChange={({ checked }) =>
                    applyFilter("excludeTermine", checked ? true : undefined)
                  }
                >
                  Terminés
                </Checkbox>
              </HStack>
            </Box>

            {/* Show specific state */}
            <Box>
              <Text fontWeight="medium" mb={2}>Afficher état :</Text>
              <HStack gap={4} flexWrap="wrap">
                <Checkbox
                  checked={npai ?? false}
                  onCheckedChange={({ checked }) =>
                    applyFilter("npai", checked ? true : undefined)
                  }
                >
                  NPAI uniquement
                </Checkbox>
                <Checkbox
                  checked={decede ?? false}
                  onCheckedChange={({ checked }) =>
                    applyFilter("decede", checked ? true : undefined)
                  }
                >
                  Décédés uniquement
                </Checkbox>
                <Checkbox
                  checked={termine ?? false}
                  onCheckedChange={({ checked }) =>
                    applyFilter("termine", checked ? true : undefined)
                  }
                >
                  Terminés uniquement
                </Checkbox>
              </HStack>
            </Box>
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
                <Table.ColumnHeader w="20%">Nom</Table.ColumnHeader>
                <Table.ColumnHeader w="12%">Prénom</Table.ColumnHeader>
                <Table.ColumnHeader w="12%">Ville</Table.ColumnHeader>
                <Table.ColumnHeader w="80px">GFA</Table.ColumnHeader>
                <Table.ColumnHeader w="80px">SCTL</Table.ColumnHeader>
                <Table.ColumnHeader w="80px">Total</Table.ColumnHeader>
                <Table.ColumnHeader w="18%">État</Table.ColumnHeader>
                <Table.ColumnHeader w="150px">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredPersonnes.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8}>
                    <Text textAlign="center" py={8} color="gray.500">
                      Aucun actionnaire trouvé
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredPersonnes.map((p) => {
                  const rowBg = getRowBgColor(p)
                  return (
                    <Table.Row
                      key={p.id}
                      bg={rowBg.light}
                      _dark={{ bg: rowBg.dark }}
                    >
                      <Table.Cell fontWeight="medium">
                        <HStack>
                          {p.est_personne_morale ? <FiUsers /> : <FiUser />}
                          <ActionnaireName
                            personneId={p.id}
                            nom={p.nom}
                            showPrenom={false}
                          />
                        </HStack>
                      </Table.Cell>
                      <Table.Cell>{p.prenom || "-"}</Table.Cell>
                      <Table.Cell>{p.ville || "-"}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette="blue" size="lg">
                          {p.nb_parts_gfa ?? 0}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette="green" size="lg">
                          {p.nb_parts_sctl ?? 0}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette="purple" size="lg">
                          {p.nb_parts_total ?? 0}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <HStack gap={1} flexWrap="wrap">
                          {p.fondateur && (
                            <Badge colorPalette="blue" size="sm">
                              Fondateur
                            </Badge>
                          )}
                          {p.de_droit && (
                            <Badge colorPalette="cyan" size="sm">
                              De droit
                            </Badge>
                          )}
                          {p.adherent && (
                            <Badge colorPalette="green" size="sm">
                              Adhérent
                            </Badge>
                          )}
                          {p.mis_doffice && (
                            <Badge colorPalette="orange" size="sm">
                              Mis d'office
                            </Badge>
                          )}
                          {p.npai && (
                            <Badge colorPalette="orange" size="sm">
                              NPAI
                            </Badge>
                          )}
                          {p.decede && (
                            <Badge colorPalette="red" size="sm">
                              Décédé
                            </Badge>
                          )}
                          {p.termine && (
                            <Badge colorPalette="gray" size="sm">
                              Terminé
                            </Badge>
                          )}
                          {p.est_personne_morale && (
                            <Badge colorPalette="purple" size="sm">
                              PM
                            </Badge>
                          )}
                        </HStack>
                      </Table.Cell>
                      <Table.Cell>
                        <HStack gap={1}>
                          <IconButton
                            aria-label="Modifier"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditPersonne(p)}
                          >
                            <FiEdit />
                          </IconButton>
                          <IconButton
                            aria-label="Supprimer"
                            size="sm"
                            variant="ghost"
                            colorPalette="red"
                            onClick={() => setDeletePersonne(p)}
                          >
                            <FiTrash2 />
                          </IconButton>
                          {(p.nb_parts_total ?? 0) > 0 && !p.termine && (
                            <Button
                              size="sm"
                              variant="outline"
                              colorPalette="orange"
                              onClick={() => setCessionPersonne(p)}
                            >
                              Céder
                            </Button>
                          )}
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  )
                })
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Pagination */}
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

      {/* Edit dialog */}
      {editPersonne && (
        <EditPersonne
          personne={editPersonne}
          isOpen={!!editPersonne}
          onClose={() => setEditPersonne(null)}
        />
      )}

      {/* Delete dialog */}
      {deletePersonne && (
        <DeletePersonne
          personne={deletePersonne}
          isOpen={!!deletePersonne}
          onClose={() => setDeletePersonne(null)}
        />
      )}

      {/* Cession dialog */}
      {cessionPersonne && (
        <CessionParts
          cedant={cessionPersonne}
          isOpen={!!cessionPersonne}
          onClose={() => setCessionPersonne(null)}
        />
      )}
    </Container>
  )
}
