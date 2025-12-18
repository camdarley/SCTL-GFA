import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import {
  ActesService,
  MouvementsService,
  NumerosPartsService,
  PersonnesService,
  type ActeWithDetails,
  type MouvementCreate,
  type PersonnePublic,
} from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  Badge,
  Box,
  Button,
  DialogActionTrigger,
  DialogTitle,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Checkbox } from "../ui/checkbox"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface CessionPartsProps {
  cedant: PersonnePublic
  isOpen: boolean
  onClose: () => void
}

const CessionParts = ({ cedant, isOpen, onClose }: CessionPartsProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  // State for the form
  const [selectedParts, setSelectedParts] = useState<number[]>([])
  const [cessionnaire, setCessionnaire] = useState<PersonnePublic | null>(null)
  const [searchCessionnaire, setSearchCessionnaire] = useState("")
  const [selectedActe, setSelectedActe] = useState<ActeWithDetails | null>(null)
  const [searchActe, setSearchActe] = useState("")
  const [dateOperation, setDateOperation] = useState(
    new Date().toISOString().split("T")[0],
  )
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1: select parts, 2: select cessionnaire, 3: confirm

  // Fetch parts of the cedant
  const { data: partsData, isLoading: isLoadingParts } = useQuery({
    queryKey: ["numeros-parts", "personne", cedant.id, "actifs"],
    queryFn: () =>
      NumerosPartsService.readNumerosParts({
        idPersonne: cedant.id,
        termine: false,
        limit: 1000,
      }),
    enabled: isOpen,
  })

  // Fetch personnes for cessionnaire search
  const { data: personnesData } = useQuery({
    queryKey: ["personnes", "search", searchCessionnaire],
    queryFn: () =>
      PersonnesService.readPersonnes({
        nom: searchCessionnaire || undefined,
        limit: 20,
      }),
    enabled: searchCessionnaire.length >= 2,
  })

  // Fetch actes for selection
  const { data: actesData } = useQuery({
    queryKey: ["actes", "search", searchActe],
    queryFn: () => ActesService.readActes({ limit: 50 }),
    enabled: isOpen,
  })

  const parts = partsData?.data ?? []
  const personnes = personnesData?.data ?? []
  const actes = actesData?.data ?? []

  // Filter actes by search
  const filteredActes = searchActe
    ? actes.filter(
        (a) =>
          a.code_acte.toLowerCase().includes(searchActe.toLowerCase()) ||
          a.libelle_acte?.toLowerCase().includes(searchActe.toLowerCase()),
      )
    : actes

  // Mutation to create mouvements and transfer parts
  const cessionMutation = useMutation({
    mutationFn: async () => {
      if (!cessionnaire || selectedParts.length === 0) {
        throw new Error("Cessionnaire et parts requis")
      }

      // 1. Create mouvement for cedant (cession, sens = false)
      const mouvementCedant: MouvementCreate = {
        id_personne: cedant.id,
        id_acte: selectedActe?.id ?? null,
        date_operation: dateOperation,
        sens: false, // Cession
        nb_parts: selectedParts.length,
      }
      await MouvementsService.createMouvement({ requestBody: mouvementCedant })

      // 2. Create mouvement for cessionnaire (acquisition, sens = true)
      const mouvementCessionnaire: MouvementCreate = {
        id_personne: cessionnaire.id,
        id_acte: selectedActe?.id ?? null,
        date_operation: dateOperation,
        sens: true, // Acquisition
        nb_parts: selectedParts.length,
      }
      const newMouvement = await MouvementsService.createMouvement({
        requestBody: mouvementCessionnaire,
      })

      // 3. Transfer parts to new owner
      await NumerosPartsService.transferParts({
        requestBody: {
          part_ids: selectedParts,
          new_owner_id: cessionnaire.id,
          mouvement_id: newMouvement.id,
        },
      })

      return { nbParts: selectedParts.length }
    },
    onSuccess: (data) => {
      showSuccessToast(
        `Cession de ${data.nbParts} part(s) effectuée avec succès.`,
      )
      queryClient.invalidateQueries({ queryKey: ["numeros-parts"] })
      queryClient.invalidateQueries({ queryKey: ["mouvements"] })
      queryClient.invalidateQueries({ queryKey: ["personne"] })
      resetAndClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const resetAndClose = () => {
    setSelectedParts([])
    setCessionnaire(null)
    setSearchCessionnaire("")
    setSelectedActe(null)
    setSearchActe("")
    setStep(1)
    onClose()
  }

  const togglePartSelection = (partId: number) => {
    setSelectedParts((prev) =>
      prev.includes(partId)
        ? prev.filter((id) => id !== partId)
        : [...prev, partId],
    )
  }

  const selectAllParts = () => {
    if (selectedParts.length === parts.length) {
      setSelectedParts([])
    } else {
      setSelectedParts(parts.map((p) => p.id))
    }
  }

  const canProceedToStep2 = selectedParts.length > 0
  const canProceedToStep3 = cessionnaire !== null
  const canSubmit = selectedParts.length > 0 && cessionnaire !== null

  return (
    <DialogRoot
      size="xl"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && resetAndClose()}
    >
      <DialogContent maxW="900px">
        <DialogHeader>
          <DialogTitle>
            Cession de Parts - {cedant.nom} {cedant.prenom}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          {/* Progress steps */}
          <HStack mb={6} justify="center" gap={4}>
            <Box
              px={4}
              py={2}
              borderRadius="full"
              bg={step >= 1 ? "blue.500" : "gray.200"}
              color={step >= 1 ? "white" : "gray.600"}
            >
              1. Sélection Parts
            </Box>
            <Text color="gray.400">→</Text>
            <Box
              px={4}
              py={2}
              borderRadius="full"
              bg={step >= 2 ? "blue.500" : "gray.200"}
              color={step >= 2 ? "white" : "gray.600"}
            >
              2. Cessionnaire
            </Box>
            <Text color="gray.400">→</Text>
            <Box
              px={4}
              py={2}
              borderRadius="full"
              bg={step >= 3 ? "blue.500" : "gray.200"}
              color={step >= 3 ? "white" : "gray.600"}
            >
              3. Confirmation
            </Box>
          </HStack>

          {/* Step 1: Select parts */}
          {step === 1 && (
            <VStack gap={4} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="sm">
                  Parts du cédant ({parts.length} disponibles)
                </Heading>
                <Button variant="outline" size="sm" onClick={selectAllParts}>
                  {selectedParts.length === parts.length
                    ? "Désélectionner tout"
                    : "Sélectionner tout"}
                </Button>
              </Flex>

              {isLoadingParts ? (
                <Text>Chargement des parts...</Text>
              ) : parts.length === 0 ? (
                <Text color="orange.500">
                  Aucune part active disponible pour ce cédant.
                </Text>
              ) : (
                <Box maxH="300px" overflowY="auto" borderWidth={1} borderRadius="md">
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader w="50px">
                          <Checkbox
                            checked={
                              selectedParts.length === parts.length &&
                              parts.length > 0
                            }
                            onCheckedChange={() => selectAllParts()}
                          />
                        </Table.ColumnHeader>
                        <Table.ColumnHeader>N° Part</Table.ColumnHeader>
                        <Table.ColumnHeader>Structure</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {parts.map((part) => (
                        <Table.Row
                          key={part.id}
                          cursor="pointer"
                          onClick={() => togglePartSelection(part.id)}
                          bg={
                            selectedParts.includes(part.id)
                              ? "blue.50"
                              : undefined
                          }
                          _dark={{
                            bg: selectedParts.includes(part.id)
                              ? "blue.900"
                              : undefined,
                          }}
                        >
                          <Table.Cell>
                            <Checkbox
                              checked={selectedParts.includes(part.id)}
                              onCheckedChange={() => togglePartSelection(part.id)}
                            />
                          </Table.Cell>
                          <Table.Cell fontWeight="medium">
                            {part.num_part}
                          </Table.Cell>
                          <Table.Cell>{part.structure_nom || "-"}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}

              <Text fontWeight="medium">
                {selectedParts.length} part(s) sélectionnée(s)
              </Text>
            </VStack>
          )}

          {/* Step 2: Select cessionnaire */}
          {step === 2 && (
            <VStack gap={4} align="stretch">
              <Heading size="sm">Sélectionner le cessionnaire</Heading>

              <Field label="Rechercher par nom">
                <Input
                  placeholder="Tapez au moins 2 caractères..."
                  value={searchCessionnaire}
                  onChange={(e) => setSearchCessionnaire(e.target.value)}
                />
              </Field>

              {cessionnaire && (
                <Box p={3} borderWidth={1} borderRadius="md" bg="green.50" _dark={{ bg: "green.900" }}>
                  <Text fontWeight="medium">Cessionnaire sélectionné :</Text>
                  <Text>
                    {cessionnaire.civilite} {cessionnaire.nom} {cessionnaire.prenom}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {cessionnaire.ville}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    mt={2}
                    onClick={() => setCessionnaire(null)}
                  >
                    Changer
                  </Button>
                </Box>
              )}

              {!cessionnaire && searchCessionnaire.length >= 2 && (
                <Box maxH="250px" overflowY="auto" borderWidth={1} borderRadius="md">
                  {personnes.length === 0 ? (
                    <Text p={4} color="gray.500">
                      Aucun résultat trouvé
                    </Text>
                  ) : (
                    <Table.Root size="sm">
                      <Table.Body>
                        {personnes
                          .filter((p) => p.id !== cedant.id) // Exclude cedant
                          .map((p) => (
                            <Table.Row
                              key={p.id}
                              cursor="pointer"
                              onClick={() => setCessionnaire(p)}
                              _hover={{ bg: "gray.50" }}
                              _dark={{ _hover: { bg: "gray.700" } }}
                            >
                              <Table.Cell>
                                <Text fontWeight="medium">
                                  {p.civilite} {p.nom} {p.prenom}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  {p.ville}
                                </Text>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                      </Table.Body>
                    </Table.Root>
                  )}
                </Box>
              )}

              {/* Acte selection */}
              <Heading size="sm" mt={4}>Acte juridique (optionnel)</Heading>
              <Field label="Rechercher un acte">
                <Input
                  placeholder="Code ou libellé..."
                  value={searchActe}
                  onChange={(e) => setSearchActe(e.target.value)}
                />
              </Field>

              {selectedActe && (
                <Box p={3} borderWidth={1} borderRadius="md" bg="blue.50" _dark={{ bg: "blue.900" }}>
                  <Text fontWeight="medium">Acte sélectionné :</Text>
                  <Text>{selectedActe.code_acte} - {selectedActe.libelle_acte}</Text>
                  <Button
                    size="sm"
                    variant="outline"
                    mt={2}
                    onClick={() => setSelectedActe(null)}
                  >
                    Retirer
                  </Button>
                </Box>
              )}

              {!selectedActe && (
                <Box maxH="150px" overflowY="auto" borderWidth={1} borderRadius="md">
                  <Table.Root size="sm">
                    <Table.Body>
                      {filteredActes.slice(0, 10).map((acte) => (
                        <Table.Row
                          key={acte.id}
                          cursor="pointer"
                          onClick={() => setSelectedActe(acte)}
                          _hover={{ bg: "gray.50" }}
                          _dark={{ _hover: { bg: "gray.700" } }}
                        >
                          <Table.Cell>
                            <Text fontWeight="medium">{acte.code_acte}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {acte.libelle_acte}
                            </Text>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}

              <Field label="Date de l'opération">
                <Input
                  type="date"
                  value={dateOperation}
                  onChange={(e) => setDateOperation(e.target.value)}
                />
              </Field>
            </VStack>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <VStack gap={4} align="stretch">
              <Heading size="sm">Récapitulatif de la cession</Heading>

              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <Box p={4} borderWidth={1} borderRadius="md" bg="red.50" _dark={{ bg: "red.900" }}>
                    <Text fontWeight="medium" mb={2}>
                      Cédant (-)
                    </Text>
                    <Text>
                      {cedant.civilite} {cedant.nom} {cedant.prenom}
                    </Text>
                    <Badge colorPalette="red" mt={2}>
                      - {selectedParts.length} part(s)
                    </Badge>
                  </Box>
                </GridItem>
                <GridItem>
                  <Box p={4} borderWidth={1} borderRadius="md" bg="green.50" _dark={{ bg: "green.900" }}>
                    <Text fontWeight="medium" mb={2}>
                      Cessionnaire (+)
                    </Text>
                    <Text>
                      {cessionnaire?.civilite} {cessionnaire?.nom}{" "}
                      {cessionnaire?.prenom}
                    </Text>
                    <Badge colorPalette="green" mt={2}>
                      + {selectedParts.length} part(s)
                    </Badge>
                  </Box>
                </GridItem>
              </Grid>

              <Box p={4} borderWidth={1} borderRadius="md">
                <Text fontWeight="medium" mb={2}>
                  Détails de l'opération
                </Text>
                <Text>Date : {new Date(dateOperation).toLocaleDateString("fr-FR")}</Text>
                <Text>
                  Acte : {selectedActe ? selectedActe.code_acte : "Non spécifié"}
                </Text>
                <Text>Nombre de parts : {selectedParts.length}</Text>
              </Box>

              <Box p={4} borderWidth={1} borderRadius="md" bg="orange.50" _dark={{ bg: "orange.900" }}>
                <Text fontWeight="medium" color="orange.700" _dark={{ color: "orange.200" }}>
                  Cette opération va :
                </Text>
                <Text fontSize="sm">
                  • Créer un mouvement de cession pour le cédant
                </Text>
                <Text fontSize="sm">
                  • Créer un mouvement d'acquisition pour le cessionnaire
                </Text>
                <Text fontSize="sm">
                  • Transférer la propriété des {selectedParts.length} part(s)
                </Text>
              </Box>
            </VStack>
          )}
        </DialogBody>

        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button
              variant="subtle"
              colorPalette="gray"
              disabled={cessionMutation.isPending}
            >
              Annuler
            </Button>
          </DialogActionTrigger>

          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
              disabled={cessionMutation.isPending}
            >
              Précédent
            </Button>
          )}

          {step < 3 && (
            <Button
              colorPalette="blue"
              onClick={() => setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s))}
              disabled={
                (step === 1 && !canProceedToStep2) ||
                (step === 2 && !canProceedToStep3)
              }
            >
              Suivant
            </Button>
          )}

          {step === 3 && (
            <Button
              colorPalette="green"
              onClick={() => cessionMutation.mutate()}
              loading={cessionMutation.isPending}
              disabled={!canSubmit}
            >
              Confirmer la cession
            </Button>
          )}
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default CessionParts
