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
  Table,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { FiArrowLeft, FiEdit, FiMail, FiPhone, FiUser, FiUsers } from "react-icons/fi"

import {
  MouvementsService,
  NumerosPartsService,
  PersonnesService,
  StructuresService,
  type PersonnePublic,
} from "@/client"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import EditPersonne from "@/components/Personnes/EditPersonne"

export const Route = createFileRoute("/_layout/personnes/$personneId")({
  component: FicheActionnairePage,
})

function FicheActionnairePage() {
  const { personneId } = Route.useParams()
  const navigate = useNavigate()
  const id = parseInt(personneId)

  const [editPersonne, setEditPersonne] = useState<PersonnePublic | null>(null)

  // Fetch personne with parts count
  const { data: personne, isLoading: isLoadingPersonne } = useQuery({
    queryKey: ["personne", id],
    queryFn: () => PersonnesService.readPersonneWithParts({ personneId: id }),
    enabled: !isNaN(id),
  })

  // Fetch parts for this personne
  const { data: partsData, isLoading: isLoadingParts } = useQuery({
    queryKey: ["numeros-parts", "personne", id],
    queryFn: () => NumerosPartsService.readNumerosParts({ idPersonne: id, limit: 1000 }),
    enabled: !isNaN(id),
  })

  // Fetch mouvements for this personne
  const { data: mouvementsData, isLoading: isLoadingMouvements } = useQuery({
    queryKey: ["mouvements", "personne", id],
    queryFn: () => MouvementsService.readMouvements({ idPersonne: id, limit: 1000 }),
    enabled: !isNaN(id),
  })

  // Fetch structures for reference
  const { data: structuresData } = useQuery({
    queryKey: ["structures"],
    queryFn: () => StructuresService.readStructures({ limit: 100 }),
  })

  // Fetch members if personne morale
  const { data: membresData, isLoading: isLoadingMembres } = useQuery({
    queryKey: ["membres-pm", id],
    queryFn: () => PersonnesService.readMembresPersonneMorale({ personneId: id }),
    enabled: !isNaN(id) && personne?.est_personne_morale === true,
  })

  const parts = partsData?.data ?? []
  const mouvements = mouvementsData?.data ?? []
  const structures = structuresData?.data ?? []
  const membres = membresData ?? []

  const getStructureName = (idStructure: number | null) => {
    if (!idStructure) return "-"
    const structure = structures.find((s) => s.id === idStructure)
    return structure?.nom_structure ?? "-"
  }

  // Group parts by structure for total display
  const partsByStructure = parts.reduce(
    (acc, part) => {
      const structureName = getStructureName(part.id_structure)
      if (!acc[structureName]) {
        acc[structureName] = { total: 0, termine: 0, actif: 0 }
      }
      acc[structureName].total++
      if (part.termine) {
        acc[structureName].termine++
      } else {
        acc[structureName].actif++
      }
      return acc
    },
    {} as Record<string, { total: number; termine: number; actif: number }>,
  )

  if (isNaN(id)) {
    return (
      <Container maxW="full" py={4}>
        <Text color="red.500">ID de personne invalide</Text>
      </Container>
    )
  }

  if (isLoadingPersonne) {
    return (
      <Container maxW="full" py={4}>
        <VStack gap={4} align="stretch">
          <Skeleton height="40px" />
          <Skeleton height="200px" />
        </VStack>
      </Container>
    )
  }

  if (!personne) {
    return (
      <Container maxW="full" py={4}>
        <Text color="red.500">Actionnaire non trouvé</Text>
      </Container>
    )
  }

  return (
    <Container maxW="full" py={4}>
      {/* Header */}
      <Flex mb={6} alignItems="center" gap={4}>
        <IconButton
          aria-label="Retour"
          variant="ghost"
          onClick={() => navigate({ to: "/personnes" })}
        >
          <FiArrowLeft />
        </IconButton>
        <Box flex={1}>
          <HStack>
            <Heading size="lg">
              {personne.civilite} {personne.nom} {personne.prenom}
            </Heading>
            {personne.est_personne_morale && (
              <Badge colorPalette="purple" size="lg">
                <FiUsers /> Personne Morale
              </Badge>
            )}
          </HStack>
          <Text color="gray.500">Fiche Actionnaire #{personne.id}</Text>
        </Box>
        <IconButton
          aria-label="Modifier"
          variant="outline"
          onClick={() => setEditPersonne(personne)}
        >
          <FiEdit />
        </IconButton>
      </Flex>

      {/* Status badges */}
      <HStack mb={4} gap={2} flexWrap="wrap">
        {personne.fondateur && <Badge colorPalette="blue">Fondateur</Badge>}
        {personne.de_droit && <Badge colorPalette="cyan">De droit</Badge>}
        {personne.adherent && <Badge colorPalette="green">Adhérent</Badge>}
        {personne.mis_doffice && <Badge colorPalette="orange">Mis d'office</Badge>}
        {personne.decede && <Badge colorPalette="red">Décédé</Badge>}
        {personne.npai && <Badge colorPalette="orange">NPAI</Badge>}
        {personne.cr && <Badge colorPalette="yellow">CR</Badge>}
        {personne.termine && <Badge colorPalette="gray">Terminé</Badge>}
        {personne.apport && <Badge colorPalette="teal">Apport</Badge>}
        {personne.cni && <Badge colorPalette="green">CNI</Badge>}
      </HStack>

      {/* Summary cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mb={6}>
        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50" _dark={{ bg: "blue.900" }}>
            <Text fontWeight="medium" color="blue.700" _dark={{ color: "blue.200" }}>
              Parts GFA
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {personne.nb_parts_gfa ?? 0}
            </Text>
          </Box>
        </GridItem>
        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md" bg="green.50" _dark={{ bg: "green.900" }}>
            <Text fontWeight="medium" color="green.700" _dark={{ color: "green.200" }}>
              Parts SCTL
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {personne.nb_parts_sctl ?? 0}
            </Text>
          </Box>
        </GridItem>
        <GridItem>
          <Box p={4} borderWidth={1} borderRadius="md" bg="purple.50" _dark={{ bg: "purple.900" }}>
            <Text fontWeight="medium" color="purple.700" _dark={{ color: "purple.200" }}>
              Total Parts
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {personne.nb_parts_total ?? 0}
            </Text>
          </Box>
        </GridItem>
      </Grid>

      {/* Tabs */}
      <Tabs.Root defaultValue="general" variant="enclosed">
        <Tabs.List>
          <Tabs.Trigger value="general">
            <FiUser /> Général
          </Tabs.Trigger>
          <Tabs.Trigger value="parts">
            Liste Parts ({parts.length})
          </Tabs.Trigger>
          {personne.est_personne_morale && (
            <Tabs.Trigger value="membres">
              <FiUsers /> Membres PM ({membres.length})
            </Tabs.Trigger>
          )}
          <Tabs.Trigger value="totaux">Total Parts</Tabs.Trigger>
          <Tabs.Trigger value="historique">Historique ({mouvements.length})</Tabs.Trigger>
        </Tabs.List>

        {/* Général */}
        <Tabs.Content value="general">
          <Box p={4}>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
              {/* Coordonnées */}
              <GridItem>
                <VStack align="stretch" gap={3}>
                  <Heading size="sm" mb={2}>Coordonnées</Heading>

                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color="gray.500">Adresse</Text>
                    <Text>{personne.adresse || "-"}</Text>
                    {personne.adresse2 && <Text>{personne.adresse2}</Text>}
                    <Text>{personne.code_postal} {personne.ville}</Text>
                  </Box>

                  {personne.tel && (
                    <HStack>
                      <FiPhone />
                      <Text>{personne.tel}</Text>
                    </HStack>
                  )}

                  {personne.port && (
                    <HStack>
                      <FiPhone />
                      <Text>{personne.port} (portable)</Text>
                    </HStack>
                  )}

                  {personne.mail && (
                    <HStack>
                      <FiMail />
                      <Text>{personne.mail}</Text>
                    </HStack>
                  )}

                  {personne.fax && (
                    <Text fontSize="sm" color="gray.500">Fax: {personne.fax}</Text>
                  )}
                </VStack>
              </GridItem>

              {/* Informations */}
              <GridItem>
                <VStack align="stretch" gap={3}>
                  <Heading size="sm" mb={2}>Informations</Heading>

                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color="gray.500">Structure principale</Text>
                    <Text>{getStructureName(personne.id_structure)}</Text>
                  </Box>

                  {personne.comment && (
                    <Box>
                      <Text fontWeight="medium" fontSize="sm" color="gray.500">Commentaire</Text>
                      <Text whiteSpace="pre-wrap">{personne.comment}</Text>
                    </Box>
                  )}

                  {personne.divers && (
                    <Box>
                      <Text fontWeight="medium" fontSize="sm" color="gray.500">Divers</Text>
                      <Text whiteSpace="pre-wrap">{personne.divers}</Text>
                    </Box>
                  )}

                  {/* Convocations */}
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color="gray.500">Convocations</Text>
                    <HStack gap={2} flexWrap="wrap">
                      {personne.pas_convoc_ag && <Badge colorPalette="orange">Pas convoc AG</Badge>}
                      {personne.pas_convoc_tsl && <Badge colorPalette="orange">Pas convoc TSL</Badge>}
                      {!personne.pas_convoc_ag && !personne.pas_convoc_tsl && (
                        <Text fontSize="sm" color="gray.500">Toutes convocations actives</Text>
                      )}
                    </HStack>
                  </Box>
                </VStack>
              </GridItem>
            </Grid>
          </Box>
        </Tabs.Content>

        {/* Liste Parts */}
        <Tabs.Content value="parts">
          <Box p={4} overflowX="auto">
            {isLoadingParts ? (
              <Skeleton height="200px" />
            ) : parts.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={8}>
                Aucune part trouvée pour cet actionnaire
              </Text>
            ) : (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>N° Part</Table.ColumnHeader>
                    <Table.ColumnHeader>Structure</Table.ColumnHeader>
                    <Table.ColumnHeader>État</Table.ColumnHeader>
                    <Table.ColumnHeader>Distribué</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {parts.map((part) => (
                    <Table.Row key={part.id}>
                      <Table.Cell fontWeight="medium">{part.num_part}</Table.Cell>
                      <Table.Cell>{part.structure_nom || "-"}</Table.Cell>
                      <Table.Cell>
                        {part.termine ? (
                          <Badge colorPalette="gray">Terminé</Badge>
                        ) : (
                          <Badge colorPalette="green">Actif</Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {part.distribue ? (
                          <Badge colorPalette="blue">Oui</Badge>
                        ) : (
                          <Badge colorPalette="gray">Non</Badge>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Box>
        </Tabs.Content>

        {/* Membres PM */}
        {personne.est_personne_morale && (
          <Tabs.Content value="membres">
            <Box p={4} overflowX="auto">
              {isLoadingMembres ? (
                <Skeleton height="200px" />
              ) : membres.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={8}>
                  Aucun membre trouvé pour cette personne morale
                </Text>
              ) : (
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
                    {membres.map((membre) => (
                      <Table.Row key={membre.id}>
                        <Table.Cell fontWeight="medium">{membre.nom}</Table.Cell>
                        <Table.Cell>{membre.prenom || "-"}</Table.Cell>
                        <Table.Cell>{membre.ville || "-"}</Table.Cell>
                        <Table.Cell>
                          <HStack gap={1}>
                            {membre.decede && <Badge colorPalette="red" size="sm">Décédé</Badge>}
                            {membre.npai && <Badge colorPalette="orange" size="sm">NPAI</Badge>}
                          </HStack>
                        </Table.Cell>
                        <Table.Cell>
                          <Link to={`/personnes/${membre.id}`}>
                            <IconButton aria-label="Voir" size="sm" variant="ghost">
                              <FiUser />
                            </IconButton>
                          </Link>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </Box>
          </Tabs.Content>
        )}

        {/* Total Parts */}
        <Tabs.Content value="totaux">
          <Box p={4}>
            <Heading size="sm" mb={4}>Répartition par structure</Heading>
            {Object.keys(partsByStructure).length === 0 ? (
              <Text color="gray.500" textAlign="center" py={8}>
                Aucune part à afficher
              </Text>
            ) : (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Structure</Table.ColumnHeader>
                    <Table.ColumnHeader>Parts Actives</Table.ColumnHeader>
                    <Table.ColumnHeader>Parts Terminées</Table.ColumnHeader>
                    <Table.ColumnHeader>Total</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {Object.entries(partsByStructure).map(([structureName, counts]) => (
                    <Table.Row key={structureName}>
                      <Table.Cell fontWeight="medium">{structureName}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette="green">{counts.actif}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette="gray">{counts.termine}</Badge>
                      </Table.Cell>
                      <Table.Cell fontWeight="bold">{counts.total}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
                <Table.Footer>
                  <Table.Row>
                    <Table.Cell fontWeight="bold">TOTAL</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette="green">
                        {Object.values(partsByStructure).reduce((sum, c) => sum + c.actif, 0)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette="gray">
                        {Object.values(partsByStructure).reduce((sum, c) => sum + c.termine, 0)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell fontWeight="bold">
                      {Object.values(partsByStructure).reduce((sum, c) => sum + c.total, 0)}
                    </Table.Cell>
                  </Table.Row>
                </Table.Footer>
              </Table.Root>
            )}
          </Box>
        </Tabs.Content>

        {/* Historique */}
        <Tabs.Content value="historique">
          <Box p={4} overflowX="auto">
            {isLoadingMouvements ? (
              <Skeleton height="200px" />
            ) : mouvements.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={8}>
                Aucun mouvement trouvé pour cet actionnaire
              </Text>
            ) : (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Date</Table.ColumnHeader>
                    <Table.ColumnHeader>Sens</Table.ColumnHeader>
                    <Table.ColumnHeader>Nb Parts</Table.ColumnHeader>
                    <Table.ColumnHeader>Acte</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {mouvements.map((mvt) => (
                    <Table.Row key={mvt.id}>
                      <Table.Cell>
                        {mvt.date_operation
                          ? new Date(mvt.date_operation).toLocaleDateString("fr-FR")
                          : "-"}
                      </Table.Cell>
                      <Table.Cell>
                        {mvt.sens ? (
                          <Badge colorPalette="green">+ Acquisition</Badge>
                        ) : (
                          <Badge colorPalette="red">- Cession</Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell fontWeight="medium">{mvt.nb_parts}</Table.Cell>
                      <Table.Cell>
                        {mvt.id_acte ? (
                          <Link to={`/actes`}>
                            <Text color="blue.500" textDecoration="underline">
                              Acte #{mvt.id_acte}
                            </Text>
                          </Link>
                        ) : (
                          <Badge colorPalette="orange">Sans acte</Badge>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Box>
        </Tabs.Content>
      </Tabs.Root>

      {/* Edit dialog */}
      {editPersonne && (
        <EditPersonne
          personne={editPersonne}
          isOpen={!!editPersonne}
          onClose={() => setEditPersonne(null)}
        />
      )}
    </Container>
  )
}
