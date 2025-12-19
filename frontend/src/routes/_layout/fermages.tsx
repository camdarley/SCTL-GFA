import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Input,
  Table,
  Text,
  Tabs,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { FiPercent, FiFilter, FiSearch } from "react-icons/fi"
import { z } from "zod"

import { CadastreService, ParcellesService, type ExploitantPublic } from "@/client"

const fermagesSearchSchema = z.object({
  page: z.number().catch(1),
  exploitantId: z.number().optional(),
  communeId: z.number().optional(),
  sctl: z.boolean().optional(),
})

export const Route = createFileRoute("/_layout/fermages")({
  component: FermagesPage,
  validateSearch: (search) => fermagesSearchSchema.parse(search),
})

const PER_PAGE = 20

function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return "-"
  const num = Number(value)
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(num)
}

function formatSurface(surface: string | number | null | undefined): string {
  if (!surface) return "-"
  const num = Number(surface)
  return `${num.toFixed(4)} ha`
}

// Composant Totaux Fermages
function FermagesTotauxCard() {
  const currentYear = new Date().getFullYear()

  const { data: totaux, isLoading } = useQuery({
    queryKey: ["fermages-totaux", currentYear],
    queryFn: () => ParcellesService.getFermagesTotaux({ annee: currentYear }),
  })

  const { data: valeurPoint } = useQuery({
    queryKey: ["valeur-point", currentYear],
    queryFn: () => CadastreService.readValeurPointByAnnee({ annee: currentYear }),
  })

  if (isLoading) {
    return <Text>Chargement des totaux...</Text>
  }

  return (
    <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4} mb={6}>
      <Card.Root>
        <Card.Body>
          <Text fontSize="sm" color="gray.500">
            Nombre de parcelles
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {totaux?.nb_parcelles || 0}
          </Text>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Body>
          <Text fontSize="sm" color="gray.500">
            Surface totale
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {formatSurface(totaux?.total_surface)}
          </Text>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Body>
          <Text fontSize="sm" color="gray.500">
            Montant total fermages
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="green.600">
            {formatCurrency(totaux?.total_montant)}
          </Text>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Body>
          <Text fontSize="sm" color="gray.500">
            Valeur du point {currentYear}
          </Text>
          <Flex direction="column" gap={1}>
            <Text fontSize="sm">
              GFA: <strong>{valeurPoint?.valeur_point_gfa || "-"} €</strong>
            </Text>
            <Text fontSize="sm">
              SCTL: <strong>{valeurPoint?.valeur_point_sctl || "-"} €</strong>
            </Text>
          </Flex>
        </Card.Body>
      </Card.Root>
    </Grid>
  )
}

// Onglet Liste par exploitant
function FermagesParExploitantTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedExploitant, setSelectedExploitant] = useState<ExploitantPublic | null>(null)
  const currentYear = new Date().getFullYear()

  const { data: exploitantsData, isLoading: isLoadingExploitants } = useQuery({
    queryKey: ["exploitants"],
    queryFn: () => CadastreService.readExploitants({ skip: 0, limit: 200 }),
  })

  const { data: parcellesData, isLoading: isLoadingParcelles } = useQuery({
    queryKey: ["parcelles-exploitant", selectedExploitant?.id],
    queryFn: () =>
      ParcellesService.readParcellesByExploitant({
        exploitantId: selectedExploitant!.id,
        skip: 0,
        limit: 100,
      }),
    enabled: !!selectedExploitant,
  })

  const { data: totauxExploitant } = useQuery({
    queryKey: ["fermages-totaux-exploitant", selectedExploitant?.id, currentYear],
    queryFn: () =>
      ParcellesService.getFermagesTotaux({
        idExploitant: selectedExploitant!.id,
        annee: currentYear,
      }),
    enabled: !!selectedExploitant,
  })

  const exploitants = exploitantsData?.data || []
  const filteredExploitants = searchTerm
    ? exploitants.filter(
        (e) =>
          e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.prenom?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : exploitants

  const parcelles = parcellesData?.data || []

  return (
    <Grid templateColumns={{ base: "1fr", lg: "300px 1fr" }} gap={4}>
      {/* Liste des exploitants */}
      <Box>
        <Flex mb={3}>
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="sm"
          />
        </Flex>

        <Box maxH="500px" overflowY="auto" borderWidth={1} borderRadius="md">
          {isLoadingExploitants ? (
            <Text p={4}>Chargement...</Text>
          ) : (
            filteredExploitants.map((exploitant) => (
              <Box
                key={exploitant.id}
                p={3}
                cursor="pointer"
                bg={selectedExploitant?.id === exploitant.id ? "blue.50" : "transparent"}
                _hover={{ bg: "gray.50" }}
                onClick={() => setSelectedExploitant(exploitant)}
                borderBottomWidth={1}
              >
                <Text fontWeight="medium">
                  {exploitant.nom} {exploitant.prenom}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {exploitant.ville || "Ville non renseignée"}
                </Text>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Détail exploitant */}
      <Box>
        {selectedExploitant ? (
          <>
            <Flex justify="space-between" align="center" mb={4}>
              <Box>
                <Heading size="md">
                  {selectedExploitant.nom} {selectedExploitant.prenom}
                </Heading>
                <Text color="gray.500">
                  {selectedExploitant.adresse}, {selectedExploitant.code_postal}{" "}
                  {selectedExploitant.ville}
                </Text>
              </Box>
              <Box textAlign="right">
                <Text fontSize="sm" color="gray.500">
                  Total fermages {currentYear}
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="green.600">
                  {formatCurrency(totauxExploitant?.total_montant)}
                </Text>
              </Box>
            </Flex>

            <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={4}>
              <Card.Root size="sm">
                <Card.Body>
                  <Text fontSize="xs" color="gray.500">
                    Parcelles
                  </Text>
                  <Text fontWeight="bold">{totauxExploitant?.nb_parcelles || 0}</Text>
                </Card.Body>
              </Card.Root>
              <Card.Root size="sm">
                <Card.Body>
                  <Text fontSize="xs" color="gray.500">
                    Surface totale
                  </Text>
                  <Text fontWeight="bold">{formatSurface(totauxExploitant?.total_surface)}</Text>
                </Card.Body>
              </Card.Root>
              <Card.Root size="sm">
                <Card.Body>
                  <Text fontSize="xs" color="gray.500">
                    Revenu cadastral
                  </Text>
                  <Text fontWeight="bold">{formatCurrency(totauxExploitant?.total_revenu)}</Text>
                </Card.Body>
              </Card.Root>
            </Grid>

            {isLoadingParcelles ? (
              <Text>Chargement des parcelles...</Text>
            ) : (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Parcelle</Table.ColumnHeader>
                    <Table.ColumnHeader>Commune</Table.ColumnHeader>
                    <Table.ColumnHeader>Surface</Table.ColumnHeader>
                    <Table.ColumnHeader>SCTL</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {parcelles.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={4}>
                        <Text textAlign="center" py={4}>
                          Aucune parcelle pour cet exploitant.
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    parcelles.map((parcelle) => (
                      <Table.Row key={parcelle.id}>
                        <Table.Cell fontWeight="medium">{parcelle.parcelle || "-"}</Table.Cell>
                        <Table.Cell>{parcelle.nom_commune || "-"}</Table.Cell>
                        <Table.Cell>{formatSurface(parcelle.total_surface)}</Table.Cell>
                        <Table.Cell>
                          {parcelle.sctl ? (
                            <Badge colorPalette="green">SCTL</Badge>
                          ) : (
                            <Badge colorPalette="blue">GFA</Badge>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            )}
          </>
        ) : (
          <Box textAlign="center" py={10}>
            <Text color="gray.500">
              Sélectionnez un exploitant pour voir ses parcelles et fermages.
            </Text>
          </Box>
        )}
      </Box>
    </Grid>
  )
}

// Onglet Calculatrice Fermage
function CalculatriceFermageTab() {
  const currentYear = new Date().getFullYear()
  const [surface, setSurface] = useState("")
  const [pointFermage, setPointFermage] = useState("")
  const [isSctl, setIsSctl] = useState(false)
  const [result, setResult] = useState<{ montant?: number; details?: string } | null>(null)

  const { data: valeurPoint } = useQuery({
    queryKey: ["valeur-point", currentYear],
    queryFn: () => CadastreService.readValeurPointByAnnee({ annee: currentYear }),
  })

  const calculateFermage = async () => {
    if (!surface || !pointFermage) return

    try {
      const response = await ParcellesService.calculateFermage({
        surface: Number(surface),
        pointFermage: Number(pointFermage),
        sctl: isSctl,
        annee: currentYear,
      })
      setResult(response as { montant?: number; details?: string })
    } catch (error) {
      console.error("Erreur calcul fermage:", error)
    }
  }

  return (
    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
      <Card.Root>
        <Card.Header>
          <Heading size="md">Calculatrice de Fermage</Heading>
        </Card.Header>
        <Card.Body>
          <Flex direction="column" gap={4}>
            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium">
                Surface (hectares)
              </Text>
              <Input
                type="number"
                step="0.0001"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                placeholder="Ex: 2.5000"
              />
            </Box>

            <Box>
              <Text mb={1} fontSize="sm" fontWeight="medium">
                Points de fermage
              </Text>
              <Input
                type="number"
                value={pointFermage}
                onChange={(e) => setPointFermage(e.target.value)}
                placeholder="Ex: 150"
              />
            </Box>

            <Flex gap={4}>
              <Button
                variant={!isSctl ? "solid" : "outline"}
                colorPalette="blue"
                onClick={() => setIsSctl(false)}
                flex={1}
              >
                GFA
              </Button>
              <Button
                variant={isSctl ? "solid" : "outline"}
                colorPalette="green"
                onClick={() => setIsSctl(true)}
                flex={1}
              >
                SCTL
              </Button>
            </Flex>

            <Button colorPalette="teal" onClick={calculateFermage}>
              <FiPercent />
              Calculer
            </Button>
          </Flex>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Heading size="md">Résultat</Heading>
        </Card.Header>
        <Card.Body>
          {result ? (
            <Box>
              <Text fontSize="3xl" fontWeight="bold" color="green.600" mb={4}>
                {formatCurrency(result.montant)}
              </Text>
              <Text fontSize="sm" color="gray.500" whiteSpace="pre-wrap">
                {result.details}
              </Text>
            </Box>
          ) : (
            <Text color="gray.500">
              Renseignez les valeurs et cliquez sur Calculer pour obtenir le montant du fermage.
            </Text>
          )}

          <Box mt={6} p={4} bg="gray.50" borderRadius="md">
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Valeurs de points {currentYear}
            </Text>
            <Flex gap={4}>
              <Box>
                <Text fontSize="xs" color="gray.500">
                  GFA
                </Text>
                <Text fontWeight="bold">{valeurPoint?.valeur_point_gfa || "-"} €</Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">
                  SCTL
                </Text>
                <Text fontWeight="bold">{valeurPoint?.valeur_point_sctl || "-"} €</Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">
                  Suppl. GFA
                </Text>
                <Text fontWeight="bold">{valeurPoint?.valeur_supp_gfa || "-"} %</Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">
                  Suppl. SCTL
                </Text>
                <Text fontWeight="bold">{valeurPoint?.valeur_supp_sctl || "-"} %</Text>
              </Box>
            </Flex>
          </Box>
        </Card.Body>
      </Card.Root>
    </Grid>
  )
}

// Onglet Liste globale
function FermagesListeGlobaleTab() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { page } = Route.useSearch()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSctl, setFilterSctl] = useState<boolean | undefined>(undefined)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["parcelles", page, filterSctl],
    queryFn: () =>
      ParcellesService.readParcelles({
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        sctl: filterSctl,
      }),
  })

  const setPage = (newPage: number) => {
    navigate({ search: { page: newPage } })
  }

  const parcelles = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / PER_PAGE)

  const filteredParcelles = searchTerm
    ? parcelles.filter(
        (p) =>
          p.parcelle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.nom_commune?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.first_exploitant?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : parcelles

  return (
    <Box>
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
        <Flex gap={2}>
          <Button
            variant={filterSctl === undefined ? "solid" : "outline"}
            size="sm"
            onClick={() => setFilterSctl(undefined)}
          >
            Tous
          </Button>
          <Button
            variant={filterSctl === false ? "solid" : "outline"}
            size="sm"
            colorPalette="blue"
            onClick={() => setFilterSctl(false)}
          >
            GFA
          </Button>
          <Button
            variant={filterSctl === true ? "solid" : "outline"}
            size="sm"
            colorPalette="green"
            onClick={() => setFilterSctl(true)}
          >
            SCTL
          </Button>
        </Flex>
      </Flex>

      {isLoading ? (
        <Text>Chargement...</Text>
      ) : isError ? (
        <Text color="red.500">Erreur lors du chargement.</Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Parcelle</Table.ColumnHeader>
                <Table.ColumnHeader>Commune</Table.ColumnHeader>
                <Table.ColumnHeader>Lieu-dit</Table.ColumnHeader>
                <Table.ColumnHeader>Surface</Table.ColumnHeader>
                <Table.ColumnHeader>Exploitant</Table.ColumnHeader>
                <Table.ColumnHeader>Structure</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredParcelles.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6}>
                    <Text textAlign="center" py={4}>
                      Aucune parcelle trouvée.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredParcelles.map((parcelle) => (
                  <Table.Row key={parcelle.id}>
                    <Table.Cell fontWeight="medium">{parcelle.parcelle || "-"}</Table.Cell>
                    <Table.Cell>{parcelle.nom_commune || "-"}</Table.Cell>
                    <Table.Cell>{parcelle.nom_lieu_dit || "-"}</Table.Cell>
                    <Table.Cell>{formatSurface(parcelle.total_surface)}</Table.Cell>
                    <Table.Cell>{parcelle.first_exploitant || "-"}</Table.Cell>
                    <Table.Cell>
                      {parcelle.sctl ? (
                        <Badge colorPalette="green">SCTL</Badge>
                      ) : (
                        <Badge colorPalette="blue">GFA</Badge>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {totalPages > 1 && (
        <Flex mt={4} justify="center" gap={2}>
          <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Précédent
          </Button>
          <Text alignSelf="center">
            Page {page} sur {totalPages}
          </Text>
          <Button size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Suivant
          </Button>
        </Flex>
      )}
    </Box>
  )
}

function FermagesPage() {
  return (
    <Container maxW="full" py={4}>
      <Heading size="lg" mb={2}>
        Fermages
      </Heading>
      <Text color="gray.500" mb={6}>
        Gestion et calcul des fermages par exploitant
      </Text>

      <FermagesTotauxCard />

      <Tabs.Root defaultValue="exploitants">
        <Tabs.List>
          <Tabs.Trigger value="exploitants">Par exploitant</Tabs.Trigger>
          <Tabs.Trigger value="liste">Liste globale</Tabs.Trigger>
          <Tabs.Trigger value="calculatrice">Calculatrice</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="exploitants">
          <FermagesParExploitantTab />
        </Tabs.Content>
        <Tabs.Content value="liste">
          <FermagesListeGlobaleTab />
        </Tabs.Content>
        <Tabs.Content value="calculatrice">
          <CalculatriceFermageTab />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  )
}
