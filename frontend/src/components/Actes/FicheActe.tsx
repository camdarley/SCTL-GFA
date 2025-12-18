import {
  Badge,
  Box,
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
import { useState } from "react"
import { FiArrowDown, FiArrowUp, FiEdit, FiFileText } from "react-icons/fi"

import {
  ActesService,
  MouvementsService,
  PersonnesService,
  StructuresService,
  type ActePublic,
} from "@/client"
import ActionnaireName from "@/components/Common/ActionnaireName"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import EditActe from "./EditActe"

interface FicheActeProps {
  acteId: number
  isOpen: boolean
  onClose: () => void
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("fr-FR")
}

export default function FicheActe({
  acteId,
  isOpen,
  onClose,
}: FicheActeProps) {
  const [editActe, setEditActe] = useState<ActePublic | null>(null)

  // Fetch acte details
  const { data: acte, isLoading: isLoadingActe } = useQuery({
    queryKey: ["acte", acteId],
    queryFn: () => ActesService.readActe({ acteId }),
    enabled: isOpen && acteId > 0,
  })

  // Fetch structure for this acte
  const { data: structuresData } = useQuery({
    queryKey: ["structures"],
    queryFn: () => StructuresService.readStructures({ limit: 100 }),
    enabled: isOpen,
  })

  // Fetch mouvements for this acte
  const { data: mouvementsData, isLoading: isLoadingMouvements } = useQuery({
    queryKey: ["mouvements", "acte", acteId],
    queryFn: () => MouvementsService.readMouvements({ idActe: acteId, limit: 1000 }),
    enabled: isOpen && acteId > 0,
  })

  // Fetch personnes for enrichment
  const { data: personnesData } = useQuery({
    queryKey: ["personnes", "all"],
    queryFn: () => PersonnesService.readPersonnes({ limit: 10000 }),
    enabled: isOpen,
  })

  const structures = structuresData?.data ?? []
  const mouvements = mouvementsData?.data ?? []
  const personnes = personnesData?.data ?? []

  const getStructureName = (idStructure: number | null | undefined) => {
    if (!idStructure) return "-"
    const structure = structures.find((s) => s.id === idStructure)
    return structure?.nom_structure ?? "-"
  }

  const getPersonneData = (idPersonne: number) => {
    return personnes.find((p) => p.id === idPersonne)
  }

  // Calculate totals from mouvements
  const totals = mouvements.reduce(
    (acc, mvt) => {
      if (mvt.sens) {
        acc.acquisitions += mvt.nb_parts ?? 0
        acc.nbAcquisitions++
      } else {
        acc.cessions += mvt.nb_parts ?? 0
        acc.nbCessions++
      }
      return acc
    },
    { acquisitions: 0, cessions: 0, nbAcquisitions: 0, nbCessions: 0 }
  )

  return (
    <>
      <DialogRoot
        open={isOpen}
        onOpenChange={(e) => !e.open && onClose()}
        size="xl"
        scrollBehavior="inside"
      >
        <DialogContent maxW="900px" maxH="90vh">
          <DialogHeader>
            <DialogTitle>
              {isLoadingActe ? (
                <Skeleton height="24px" width="200px" />
              ) : acte ? (
                <HStack>
                  <FiFileText />
                  <Text>{acte.code_acte}</Text>
                  {acte.provisoire && (
                    <Badge colorPalette="orange" size="lg">
                      Provisoire
                    </Badge>
                  )}
                </HStack>
              ) : (
                "Acte non trouvé"
              )}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody pb={6}>
            {isLoadingActe ? (
              <VStack gap={4} align="stretch">
                <Skeleton height="100px" />
                <Skeleton height="200px" />
              </VStack>
            ) : !acte ? (
              <Text color="red.500">Acte non trouvé</Text>
            ) : (
              <>
                {/* Status badges and edit button */}
                <HStack mb={4} gap={2} flexWrap="wrap">
                  {acte.provisoire ? (
                    <Badge colorPalette="orange">Provisoire</Badge>
                  ) : (
                    <Badge colorPalette="green">Définitif</Badge>
                  )}
                  <IconButton
                    aria-label="Modifier"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditActe(acte)}
                    ml="auto"
                  >
                    <FiEdit />
                  </IconButton>
                </HStack>

                {/* Summary cards */}
                <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={3} mb={4}>
                  <GridItem>
                    <Box p={3} borderWidth={1} borderRadius="md" bg="green.50" _dark={{ bg: "green.900" }}>
                      <Text fontWeight="medium" fontSize="sm" color="green.700" _dark={{ color: "green.200" }}>
                        Acquisitions
                      </Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {totals.acquisitions} parts
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {totals.nbAcquisitions} mouvement{totals.nbAcquisitions > 1 ? "s" : ""}
                      </Text>
                    </Box>
                  </GridItem>
                  <GridItem>
                    <Box p={3} borderWidth={1} borderRadius="md" bg="red.50" _dark={{ bg: "red.900" }}>
                      <Text fontWeight="medium" fontSize="sm" color="red.700" _dark={{ color: "red.200" }}>
                        Cessions
                      </Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {totals.cessions} parts
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {totals.nbCessions} mouvement{totals.nbCessions > 1 ? "s" : ""}
                      </Text>
                    </Box>
                  </GridItem>
                  <GridItem>
                    <Box p={3} borderWidth={1} borderRadius="md" bg="purple.50" _dark={{ bg: "purple.900" }}>
                      <Text fontWeight="medium" fontSize="sm" color="purple.700" _dark={{ color: "purple.200" }}>
                        Solde Net
                      </Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {totals.acquisitions - totals.cessions > 0 ? "+" : ""}
                        {totals.acquisitions - totals.cessions} parts
                      </Text>
                    </Box>
                  </GridItem>
                  <GridItem>
                    <Box p={3} borderWidth={1} borderRadius="md" bg="blue.50" _dark={{ bg: "blue.900" }}>
                      <Text fontWeight="medium" fontSize="sm" color="blue.700" _dark={{ color: "blue.200" }}>
                        Total Mouvements
                      </Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {mouvements.length}
                      </Text>
                    </Box>
                  </GridItem>
                </Grid>

                {/* Tabs */}
                <Tabs.Root defaultValue="general" variant="enclosed" size="sm">
                  <Tabs.List>
                    <Tabs.Trigger value="general">
                      <FiFileText /> Général
                    </Tabs.Trigger>
                    <Tabs.Trigger value="mouvements">
                      Mouvements ({mouvements.length})
                    </Tabs.Trigger>
                  </Tabs.List>

                  {/* Général */}
                  <Tabs.Content value="general">
                    <Box py={3}>
                      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                        {/* Informations principales */}
                        <GridItem>
                          <VStack align="stretch" gap={2}>
                            <Heading size="xs" mb={1}>Informations</Heading>

                            <Box>
                              <Text fontWeight="medium" fontSize="xs" color="gray.500">Code Acte</Text>
                              <Text fontSize="sm" fontWeight="bold">{acte.code_acte}</Text>
                            </Box>

                            <Box>
                              <Text fontWeight="medium" fontSize="xs" color="gray.500">Date</Text>
                              <Text fontSize="sm">{formatDate(acte.date_acte)}</Text>
                            </Box>

                            <Box>
                              <Text fontWeight="medium" fontSize="xs" color="gray.500">Structure</Text>
                              <Text fontSize="sm">{getStructureName(acte.id_structure)}</Text>
                            </Box>
                          </VStack>
                        </GridItem>

                        {/* Description */}
                        <GridItem>
                          <VStack align="stretch" gap={2}>
                            <Heading size="xs" mb={1}>Description</Heading>

                            <Box>
                              <Text fontWeight="medium" fontSize="xs" color="gray.500">Libellé</Text>
                              <Text fontSize="sm" whiteSpace="pre-wrap">
                                {acte.libelle_acte || "-"}
                              </Text>
                            </Box>

                            <Box>
                              <Text fontWeight="medium" fontSize="xs" color="gray.500">Statut</Text>
                              {acte.provisoire ? (
                                <Badge colorPalette="orange" size="sm">Provisoire</Badge>
                              ) : (
                                <Badge colorPalette="green" size="sm">Définitif</Badge>
                              )}
                            </Box>
                          </VStack>
                        </GridItem>
                      </Grid>
                    </Box>
                  </Tabs.Content>

                  {/* Mouvements */}
                  <Tabs.Content value="mouvements">
                    <Box py={3} maxH="400px" overflowY="auto">
                      {isLoadingMouvements ? (
                        <Skeleton height="150px" />
                      ) : mouvements.length === 0 ? (
                        <Text color="gray.500" textAlign="center" py={4} fontSize="sm">
                          Aucun mouvement trouvé pour cet acte
                        </Text>
                      ) : (
                        <Table.Root size="sm">
                          <Table.Header>
                            <Table.Row>
                              <Table.ColumnHeader>Date</Table.ColumnHeader>
                              <Table.ColumnHeader>Sens</Table.ColumnHeader>
                              <Table.ColumnHeader>Personne</Table.ColumnHeader>
                              <Table.ColumnHeader>Nb Parts</Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {mouvements.map((mvt) => {
                              const personne = getPersonneData(mvt.id_personne)
                              return (
                                <Table.Row key={mvt.id}>
                                  <Table.Cell>
                                    {formatDate(mvt.date_operation) !== "-"
                                      ? formatDate(mvt.date_operation)
                                      : formatDate(acte.date_acte)}
                                  </Table.Cell>
                                  <Table.Cell>
                                    {mvt.sens ? (
                                      <Badge colorPalette="green" size="sm">
                                        <FiArrowUp /> +
                                      </Badge>
                                    ) : (
                                      <Badge colorPalette="red" size="sm">
                                        <FiArrowDown /> -
                                      </Badge>
                                    )}
                                  </Table.Cell>
                                  <Table.Cell>
                                    {personne ? (
                                      <ActionnaireName
                                        personneId={personne.id}
                                        nom={personne.nom}
                                        prenom={personne.prenom}
                                      />
                                    ) : (
                                      <Text>#{mvt.id_personne}</Text>
                                    )}
                                  </Table.Cell>
                                  <Table.Cell fontWeight="bold">{mvt.nb_parts}</Table.Cell>
                                </Table.Row>
                              )
                            })}
                          </Table.Body>
                        </Table.Root>
                      )}
                    </Box>
                  </Tabs.Content>
                </Tabs.Root>
              </>
            )}
          </DialogBody>
        </DialogContent>
      </DialogRoot>

      {/* Edit dialog */}
      {editActe && (
        <EditActe
          acte={{
            ...editActe,
            structure_nom: getStructureName(editActe.id_structure),
          }}
          isOpen={!!editActe}
          onClose={() => setEditActe(null)}
        />
      )}
    </>
  )
}
