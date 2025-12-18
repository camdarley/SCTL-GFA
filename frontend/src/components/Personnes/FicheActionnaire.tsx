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
import { FiEdit, FiMail, FiPhone, FiUser, FiUsers } from "react-icons/fi"

import {
  ActesService,
  MouvementsService,
  NumerosPartsService,
  PersonnesService,
  StructuresService,
  type PersonnePublic,
} from "@/client"
import ActeName from "@/components/Common/ActeName"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import EditPersonne from "./EditPersonne"

interface FicheActionnaireProps {
  personneId: number
  isOpen: boolean
  onClose: () => void
  onOpenPersonne?: (id: number) => void // Pour navigation vers un autre actionnaire
}

export default function FicheActionnaire({
  personneId,
  isOpen,
  onClose,
  onOpenPersonne,
}: FicheActionnaireProps) {
  const [editPersonne, setEditPersonne] = useState<PersonnePublic | null>(null)

  // Fetch personne with parts count
  const { data: personne, isLoading: isLoadingPersonne } = useQuery({
    queryKey: ["personne", personneId],
    queryFn: () => PersonnesService.readPersonneWithParts({ personneId }),
    enabled: isOpen && personneId > 0,
  })

  // Fetch parts for this personne
  const { data: partsData, isLoading: isLoadingParts } = useQuery({
    queryKey: ["numeros-parts", "personne", personneId],
    queryFn: () => NumerosPartsService.readNumerosParts({ idPersonne: personneId, limit: 1000 }),
    enabled: isOpen && personneId > 0,
  })

  // Fetch mouvements for this personne
  const { data: mouvementsData, isLoading: isLoadingMouvements } = useQuery({
    queryKey: ["mouvements", "personne", personneId],
    queryFn: () => MouvementsService.readMouvements({ idPersonne: personneId, limit: 1000 }),
    enabled: isOpen && personneId > 0,
  })

  // Fetch structures for reference
  const { data: structuresData } = useQuery({
    queryKey: ["structures"],
    queryFn: () => StructuresService.readStructures({ limit: 100 }),
    enabled: isOpen,
  })

  // Fetch actes for date fallback
  const { data: actesData } = useQuery({
    queryKey: ["actes", "all"],
    queryFn: () => ActesService.readActes({ limit: 10000 }),
    enabled: isOpen,
  })

  // Fetch members if personne morale
  const { data: membresData, isLoading: isLoadingMembres } = useQuery({
    queryKey: ["membres-pm", personneId],
    queryFn: () => PersonnesService.readMembresPersonneMorale({ personneId }),
    enabled: isOpen && personneId > 0 && personne?.est_personne_morale === true,
  })

  const parts = partsData?.data ?? []
  const mouvements = mouvementsData?.data ?? []
  const structures = structuresData?.data ?? []
  const actes = actesData?.data ?? []
  const membres = membresData ?? []

  const getStructureName = (idStructure: number | null) => {
    if (!idStructure) return "-"
    const structure = structures.find((s) => s.id === idStructure)
    return structure?.nom_structure ?? "-"
  }

  const getActeDate = (idActe: number | null) => {
    if (!idActe) return null
    const acte = actes.find((a) => a.id === idActe)
    return acte?.date_acte ?? null
  }

  const getActeCode = (idActe: number | null) => {
    if (!idActe) return null
    const acte = actes.find((a) => a.id === idActe)
    return acte?.code_acte ?? `#${idActe}`
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

  const handleOpenMembre = (id: number) => {
    if (onOpenPersonne) {
      onOpenPersonne(id)
    }
  }

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
              {isLoadingPersonne ? (
                <Skeleton height="24px" width="200px" />
              ) : personne ? (
                <HStack>
                  <Text>
                    {personne.civilite} {personne.nom} {personne.prenom}
                  </Text>
                  {personne.est_personne_morale && (
                    <Badge colorPalette="purple" size="lg">
                      <FiUsers /> PM
                    </Badge>
                  )}
                </HStack>
              ) : (
                "Actionnaire non trouvé"
              )}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody pb={6}>
            {isLoadingPersonne ? (
              <VStack gap={4} align="stretch">
                <Skeleton height="100px" />
                <Skeleton height="200px" />
              </VStack>
            ) : !personne ? (
              <Text color="red.500">Actionnaire non trouvé</Text>
            ) : (
              <>
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
                  <IconButton
                    aria-label="Modifier"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditPersonne(personne)}
                    ml="auto"
                  >
                    <FiEdit />
                  </IconButton>
                </HStack>

                {/* Summary cards */}
                <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={3} mb={4}>
                  <GridItem>
                    <Box p={3} borderWidth={1} borderRadius="md" bg="blue.50" _dark={{ bg: "blue.900" }}>
                      <Text fontWeight="medium" fontSize="sm" color="blue.700" _dark={{ color: "blue.200" }}>
                        Parts GFA
                      </Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {personne.nb_parts_gfa ?? 0}
                      </Text>
                    </Box>
                  </GridItem>
                  <GridItem>
                    <Box p={3} borderWidth={1} borderRadius="md" bg="green.50" _dark={{ bg: "green.900" }}>
                      <Text fontWeight="medium" fontSize="sm" color="green.700" _dark={{ color: "green.200" }}>
                        Parts SCTL
                      </Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {personne.nb_parts_sctl ?? 0}
                      </Text>
                    </Box>
                  </GridItem>
                  <GridItem>
                    <Box p={3} borderWidth={1} borderRadius="md" bg="purple.50" _dark={{ bg: "purple.900" }}>
                      <Text fontWeight="medium" fontSize="sm" color="purple.700" _dark={{ color: "purple.200" }}>
                        Total Parts
                      </Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {personne.nb_parts_total ?? 0}
                      </Text>
                    </Box>
                  </GridItem>
                </Grid>

                {/* Tabs */}
                <Tabs.Root defaultValue="general" variant="enclosed" size="sm">
                  <Tabs.List>
                    <Tabs.Trigger value="general">
                      <FiUser /> Général
                    </Tabs.Trigger>
                    <Tabs.Trigger value="parts">
                      Parts ({parts.length})
                    </Tabs.Trigger>
                    {personne.est_personne_morale && (
                      <Tabs.Trigger value="membres">
                        <FiUsers /> Membres ({membres.length})
                      </Tabs.Trigger>
                    )}
                    <Tabs.Trigger value="totaux">Totaux</Tabs.Trigger>
                    <Tabs.Trigger value="historique">Historique ({mouvements.length})</Tabs.Trigger>
                  </Tabs.List>

                  {/* Général */}
                  <Tabs.Content value="general">
                    <Box py={3}>
                      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                        {/* Coordonnées */}
                        <GridItem>
                          <VStack align="stretch" gap={2}>
                            <Heading size="xs" mb={1}>Coordonnées</Heading>

                            <Box>
                              <Text fontWeight="medium" fontSize="xs" color="gray.500">Adresse</Text>
                              <Text fontSize="sm">{personne.adresse || "-"}</Text>
                              {personne.adresse2 && <Text fontSize="sm">{personne.adresse2}</Text>}
                              <Text fontSize="sm">{personne.code_postal} {personne.ville}</Text>
                            </Box>

                            {personne.tel && (
                              <HStack fontSize="sm">
                                <FiPhone size={12} />
                                <Text>{personne.tel}</Text>
                              </HStack>
                            )}

                            {personne.port && (
                              <HStack fontSize="sm">
                                <FiPhone size={12} />
                                <Text>{personne.port} (portable)</Text>
                              </HStack>
                            )}

                            {personne.mail && (
                              <HStack fontSize="sm">
                                <FiMail size={12} />
                                <Text>{personne.mail}</Text>
                              </HStack>
                            )}
                          </VStack>
                        </GridItem>

                        {/* Informations */}
                        <GridItem>
                          <VStack align="stretch" gap={2}>
                            <Heading size="xs" mb={1}>Informations</Heading>

                            <Box>
                              <Text fontWeight="medium" fontSize="xs" color="gray.500">Structure principale</Text>
                              <Text fontSize="sm">{getStructureName(personne.id_structure)}</Text>
                            </Box>

                            {personne.comment && (
                              <Box>
                                <Text fontWeight="medium" fontSize="xs" color="gray.500">Commentaire</Text>
                                <Text fontSize="sm" whiteSpace="pre-wrap">{personne.comment}</Text>
                              </Box>
                            )}

                            {/* Convocations */}
                            <Box>
                              <Text fontWeight="medium" fontSize="xs" color="gray.500">Convocations</Text>
                              <HStack gap={1} flexWrap="wrap">
                                {personne.pas_convoc_ag && <Badge colorPalette="orange" size="sm">Pas convoc AG</Badge>}
                                {personne.pas_convoc_tsl && <Badge colorPalette="orange" size="sm">Pas convoc TSL</Badge>}
                                {!personne.pas_convoc_ag && !personne.pas_convoc_tsl && (
                                  <Text fontSize="xs" color="gray.500">Toutes actives</Text>
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
                    <Box py={3} maxH="300px" overflowY="auto">
                      {isLoadingParts ? (
                        <Skeleton height="150px" />
                      ) : parts.length === 0 ? (
                        <Text color="gray.500" textAlign="center" py={4} fontSize="sm">
                          Aucune part trouvée
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
                                    <Badge colorPalette="gray" size="sm">Terminé</Badge>
                                  ) : (
                                    <Badge colorPalette="green" size="sm">Actif</Badge>
                                  )}
                                </Table.Cell>
                                <Table.Cell>
                                  {part.distribue ? (
                                    <Badge colorPalette="blue" size="sm">Oui</Badge>
                                  ) : (
                                    <Badge colorPalette="gray" size="sm">Non</Badge>
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
                      <Box py={3} maxH="300px" overflowY="auto">
                        {isLoadingMembres ? (
                          <Skeleton height="150px" />
                        ) : membres.length === 0 ? (
                          <Text color="gray.500" textAlign="center" py={4} fontSize="sm">
                            Aucun membre trouvé
                          </Text>
                        ) : (
                          <Table.Root size="sm">
                            <Table.Header>
                              <Table.Row>
                                <Table.ColumnHeader>Nom</Table.ColumnHeader>
                                <Table.ColumnHeader>Prénom</Table.ColumnHeader>
                                <Table.ColumnHeader>Ville</Table.ColumnHeader>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {membres.map((membre) => (
                                <Table.Row key={membre.id}>
                                  <Table.Cell fontWeight="medium">
                                    <Text
                                      as="span"
                                      color="blue.600"
                                      cursor="pointer"
                                      _hover={{ color: "blue.800", textDecoration: "underline" }}
                                      onClick={() => handleOpenMembre(membre.id)}
                                    >
                                      {membre.nom}
                                    </Text>
                                  </Table.Cell>
                                  <Table.Cell>{membre.prenom || "-"}</Table.Cell>
                                  <Table.Cell>{membre.ville || "-"}</Table.Cell>
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
                    <Box py={3}>
                      {Object.keys(partsByStructure).length === 0 ? (
                        <Text color="gray.500" textAlign="center" py={4} fontSize="sm">
                          Aucune part à afficher
                        </Text>
                      ) : (
                        <Table.Root size="sm">
                          <Table.Header>
                            <Table.Row>
                              <Table.ColumnHeader>Structure</Table.ColumnHeader>
                              <Table.ColumnHeader>Actives</Table.ColumnHeader>
                              <Table.ColumnHeader>Terminées</Table.ColumnHeader>
                              <Table.ColumnHeader>Total</Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {Object.entries(partsByStructure).map(([structureName, counts]) => (
                              <Table.Row key={structureName}>
                                <Table.Cell fontWeight="medium">{structureName}</Table.Cell>
                                <Table.Cell>
                                  <Badge colorPalette="green" size="sm">{counts.actif}</Badge>
                                </Table.Cell>
                                <Table.Cell>
                                  <Badge colorPalette="gray" size="sm">{counts.termine}</Badge>
                                </Table.Cell>
                                <Table.Cell fontWeight="bold">{counts.total}</Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                          <Table.Footer>
                            <Table.Row>
                              <Table.Cell fontWeight="bold">TOTAL</Table.Cell>
                              <Table.Cell>
                                <Badge colorPalette="green" size="sm">
                                  {Object.values(partsByStructure).reduce((sum, c) => sum + c.actif, 0)}
                                </Badge>
                              </Table.Cell>
                              <Table.Cell>
                                <Badge colorPalette="gray" size="sm">
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
                    <Box py={3} maxH="300px" overflowY="auto">
                      {isLoadingMouvements ? (
                        <Skeleton height="150px" />
                      ) : mouvements.length === 0 ? (
                        <Text color="gray.500" textAlign="center" py={4} fontSize="sm">
                          Aucun mouvement trouvé
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
                            {mouvements.map((mvt) => {
                              const date = mvt.date_operation || getActeDate(mvt.id_acte)
                              return (
                                <Table.Row key={mvt.id}>
                                  <Table.Cell>
                                    {date ? new Date(date).toLocaleDateString("fr-FR") : "-"}
                                  </Table.Cell>
                                  <Table.Cell>
                                    {mvt.sens ? (
                                      <Badge colorPalette="green" size="sm">+</Badge>
                                    ) : (
                                      <Badge colorPalette="red" size="sm">-</Badge>
                                    )}
                                  </Table.Cell>
                                  <Table.Cell fontWeight="medium">{mvt.nb_parts}</Table.Cell>
                                  <Table.Cell>
                                    {mvt.id_acte ? (
                                      <ActeName
                                        acteId={mvt.id_acte}
                                        codeActe={getActeCode(mvt.id_acte) || `#${mvt.id_acte}`}
                                      />
                                    ) : (
                                      <Badge colorPalette="orange" size="sm">Sans acte</Badge>
                                    )}
                                  </Table.Cell>
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
      {editPersonne && (
        <EditPersonne
          personne={editPersonne}
          isOpen={!!editPersonne}
          onClose={() => setEditPersonne(null)}
        />
      )}
    </>
  )
}
