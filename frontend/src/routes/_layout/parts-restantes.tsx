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
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import {
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiUser,
  FiUsers,
} from "react-icons/fi"
import { z } from "zod"

import {
  PersonnesService,
  type PersonneWithParts,
} from "@/client"
import { Button } from "@chakra-ui/react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import CessionParts from "@/components/Parts/CessionParts"

const partsRestantesSearchSchema = z.object({
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

type PartsRestantesSearch = z.infer<typeof partsRestantesSearchSchema>

const PER_PAGE = 25

export const Route = createFileRoute("/_layout/parts-restantes")({
  component: PartsRestantesPage,
  validateSearch: (search) => partsRestantesSearchSchema.parse(search),
})

function PartsRestantesPage() {
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
  const [cessionPersonne, setCessionPersonne] = useState<PersonneWithParts | null>(null)

  // Fetch all personnes with parts info
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
    queryFn: async () => {
      // First get personnes with filters
      const response = await PersonnesService.readPersonnes({
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
      })

      // Then fetch parts count for each personne
      const personnesWithParts = await Promise.all(
        response.data.map(async (p) => {
          try {
            const withParts = await PersonnesService.readPersonneWithParts({
              personneId: p.id,
            })
            return withParts
          } catch {
            return {
              ...p,
              nb_parts_gfa: 0,
              nb_parts_sctl: 0,
              nb_parts_total: 0,
            } as PersonneWithParts
          }
        }),
      )

      return {
        data: personnesWithParts,
        count: response.count,
      }
    },
  })

  const personnes = personnesData?.data ?? []
  const count = personnesData?.count ?? 0

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

  // Calculate totals
  const totals = useMemo(() => {
    return filteredPersonnes.reduce(
      (acc, p) => ({
        gfa: acc.gfa + (p.nb_parts_gfa ?? 0),
        sctl: acc.sctl + (p.nb_parts_sctl ?? 0),
        total: acc.total + (p.nb_parts_total ?? 0),
      }),
      { gfa: 0, sctl: 0, total: 0 },
    )
  }, [filteredPersonnes])

  const setPage = (newPage: number) => {
    navigate({
      search: (prev: PartsRestantesSearch) => ({ ...prev, page: newPage }),
    })
  }

  const handleSearch = () => {
    navigate({
      search: (prev: PartsRestantesSearch) => ({ ...prev, page: 1, nom: searchNom || undefined }),
    })
  }

  const applyFilter = (key: string, value: boolean | number | string | undefined) => {
    navigate({
      search: (prev: PartsRestantesSearch) => ({
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
          <Heading size="lg">Parts Restantes</Heading>
          <Text color="gray.500">
            Synthèse des parts par actionnaire
          </Text>
        </Box>
        <HStack>
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
              {totals.gfa}
            </Text>
          </Box>
        </GridItem>
        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md" bg="green.50" _dark={{ bg: "green.900" }}>
            <Text fontWeight="medium" color="green.700" _dark={{ color: "green.200" }}>
              Total Parts SCTL
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {totals.sctl}
            </Text>
          </Box>
        </GridItem>
        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md" bg="purple.50" _dark={{ bg: "purple.900" }}>
            <Text fontWeight="medium" color="purple.700" _dark={{ color: "purple.200" }}>
              Total Général
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {totals.total}
            </Text>
          </Box>
        </GridItem>
        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50" _dark={{ bg: "gray.700" }}>
            <Text fontWeight="medium" color="gray.700" _dark={{ color: "gray.200" }}>
              Actionnaires
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {filteredPersonnes.length}
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
                <Table.ColumnHeader w="25%">Nom</Table.ColumnHeader>
                <Table.ColumnHeader w="15%">Prénom</Table.ColumnHeader>
                <Table.ColumnHeader w="100px">GFA</Table.ColumnHeader>
                <Table.ColumnHeader w="100px">SCTL</Table.ColumnHeader>
                <Table.ColumnHeader w="100px">Total</Table.ColumnHeader>
                <Table.ColumnHeader w="20%">État</Table.ColumnHeader>
                <Table.ColumnHeader w="120px">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredPersonnes.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7}>
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
                          <Text>{p.nom}</Text>
                        </HStack>
                      </Table.Cell>
                      <Table.Cell>{p.prenom || "-"}</Table.Cell>
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
                        </HStack>
                      </Table.Cell>
                      <Table.Cell>
                        <HStack gap={1}>
                          <Link to={`/personnes/${p.id}`}>
                            <IconButton
                              aria-label="Voir fiche"
                              size="sm"
                              variant="ghost"
                            >
                              <FiEye />
                            </IconButton>
                          </Link>
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
