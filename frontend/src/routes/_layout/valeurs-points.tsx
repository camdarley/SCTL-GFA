import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Input,
  Table,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi"
import { useForm, type SubmitHandler } from "react-hook-form"

import {
  CadastreService,
  type ValeurPointCreate,
  type ValeurPointPublic,
  type ValeurPointUpdate,
} from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogActionTrigger,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"

export const Route = createFileRoute("/_layout/valeurs-points")({
  component: ValeursPointsPage,
})

interface AddValeurPointDialogProps {
  isOpen: boolean
  onClose: () => void
}

function AddValeurPointDialog({ isOpen, onClose }: AddValeurPointDialogProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ValeurPointCreate>({
    mode: "onBlur",
    defaultValues: {
      annee: new Date().getFullYear(),
      valeur_point_gfa: "",
      valeur_point_sctl: "",
      valeur_supp_gfa: "",
      valeur_supp_sctl: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ValeurPointCreate) =>
      CadastreService.createValeurPoint({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Valeur de points créée avec succès.")
      reset()
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["valeurs-points"] })
    },
  })

  const onSubmit: SubmitHandler<ValeurPointCreate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size="lg"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Ajouter une année de valeurs</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Renseignez les valeurs de points fermage pour une nouvelle année.
            </Text>

            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem colSpan={2}>
                <Field
                  label="Année"
                  required
                  invalid={!!errors.annee}
                  errorText={errors.annee?.message}
                >
                  <Input
                    {...register("annee", {
                      required: "L'année est requise",
                      valueAsNumber: true,
                    })}
                    type="number"
                    placeholder="2024"
                  />
                </Field>
              </GridItem>

              <GridItem>
                <Field label="Valeur point GFA (€)">
                  <Input
                    {...register("valeur_point_gfa")}
                    type="number"
                    step="0.01"
                    placeholder="Ex: 2.50"
                  />
                </Field>
              </GridItem>

              <GridItem>
                <Field label="Valeur point SCTL (€)">
                  <Input
                    {...register("valeur_point_sctl")}
                    type="number"
                    step="0.01"
                    placeholder="Ex: 2.50"
                  />
                </Field>
              </GridItem>

              <GridItem>
                <Field label="Supplément durée GFA (%)">
                  <Input
                    {...register("valeur_supp_gfa")}
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5.00"
                  />
                </Field>
              </GridItem>

              <GridItem>
                <Field label="Supplément durée SCTL (%)">
                  <Input
                    {...register("valeur_supp_sctl")}
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5.00"
                  />
                </Field>
              </GridItem>
            </Grid>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button variant="subtle" colorPalette="gray" disabled={isSubmitting}>
                Annuler
              </Button>
            </DialogActionTrigger>
            <Button variant="solid" type="submit" loading={isSubmitting}>
              Créer
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

interface EditValeurPointDialogProps {
  valeur: ValeurPointPublic
  isOpen: boolean
  onClose: () => void
}

function EditValeurPointDialog({ valeur, isOpen, onClose }: EditValeurPointDialogProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ValeurPointUpdate>({
    mode: "onBlur",
    defaultValues: {
      annee: valeur.annee,
      valeur_point_gfa: valeur.valeur_point_gfa || "",
      valeur_point_sctl: valeur.valeur_point_sctl || "",
      valeur_supp_gfa: valeur.valeur_supp_gfa || "",
      valeur_supp_sctl: valeur.valeur_supp_sctl || "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ValeurPointUpdate) =>
      CadastreService.updateValeurPoint({ valeurId: valeur.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Valeur de points mise à jour.")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["valeurs-points"] })
    },
  })

  const onSubmit: SubmitHandler<ValeurPointUpdate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size="lg"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Modifier les valeurs {valeur.annee}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem colSpan={2}>
                <Field label="Année" required>
                  <Input {...register("annee", { valueAsNumber: true })} type="number" />
                </Field>
              </GridItem>

              <GridItem>
                <Field label="Valeur point GFA (€)">
                  <Input
                    {...register("valeur_point_gfa")}
                    type="number"
                    step="0.01"
                  />
                </Field>
              </GridItem>

              <GridItem>
                <Field label="Valeur point SCTL (€)">
                  <Input
                    {...register("valeur_point_sctl")}
                    type="number"
                    step="0.01"
                  />
                </Field>
              </GridItem>

              <GridItem>
                <Field label="Supplément durée GFA (%)">
                  <Input
                    {...register("valeur_supp_gfa")}
                    type="number"
                    step="0.01"
                  />
                </Field>
              </GridItem>

              <GridItem>
                <Field label="Supplément durée SCTL (%)">
                  <Input
                    {...register("valeur_supp_sctl")}
                    type="number"
                    step="0.01"
                  />
                </Field>
              </GridItem>
            </Grid>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button variant="subtle" colorPalette="gray" disabled={isSubmitting}>
                Annuler
              </Button>
            </DialogActionTrigger>
            <Button variant="solid" type="submit" loading={isSubmitting}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

interface DeleteValeurPointDialogProps {
  valeur: ValeurPointPublic
  isOpen: boolean
  onClose: () => void
}

function DeleteValeurPointDialog({ valeur, isOpen, onClose }: DeleteValeurPointDialogProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => CadastreService.deleteValeurPoint({ valeurId: valeur.id }),
    onSuccess: () => {
      showSuccessToast("Valeur supprimée.")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["valeurs-points"] })
    },
  })

  return (
    <DialogRoot
      size="sm"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer les valeurs {valeur.annee} ?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Text>
            Cette action est irréversible. Les valeurs de points pour l'année {valeur.annee}{" "}
            seront définitivement supprimées.
          </Text>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="subtle" colorPalette="gray">
              Annuler
            </Button>
          </DialogActionTrigger>
          <Button
            variant="solid"
            colorPalette="red"
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
          >
            Supprimer
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

function ValeursPointsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingValeur, setEditingValeur] = useState<ValeurPointPublic | null>(null)
  const [deletingValeur, setDeletingValeur] = useState<ValeurPointPublic | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["valeurs-points"],
    queryFn: () => CadastreService.readValeursPoints({ skip: 0, limit: 50 }),
  })

  const valeurs = data?.data || []

  // Trier par année décroissante
  const sortedValeurs = [...valeurs].sort((a, b) => b.annee - a.annee)

  return (
    <Container maxW="full" py={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Valeurs des Points Fermage</Heading>
          <Text color="gray.500">
            Gestion des valeurs annuelles pour le calcul des fermages
          </Text>
        </Box>
        <Button colorPalette="blue" onClick={() => setIsAddOpen(true)}>
          <FiPlus />
          Ajouter une année
        </Button>
      </Flex>

      <Box p={4} bg="blue.50" borderRadius="md" mb={6}>
        <Heading size="sm" mb={2}>
          Formule de calcul du fermage
        </Heading>
        <Text fontSize="sm">
          <strong>Montant = (Points × Surface_m²) / 10000 × Valeur_Point</strong>
        </Text>
        <Text fontSize="sm" color="gray.600" mt={1}>
          Si le supplément durée est actif :{" "}
          <strong>Montant = Montant + (Montant × Supplément / 100)</strong>
        </Text>
      </Box>

      {isLoading ? (
        <Text>Chargement...</Text>
      ) : isError ? (
        <Text color="red.500">Erreur lors du chargement.</Text>
      ) : (
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Année</Table.ColumnHeader>
              <Table.ColumnHeader>Valeur Point GFA (€)</Table.ColumnHeader>
              <Table.ColumnHeader>Valeur Point SCTL (€)</Table.ColumnHeader>
              <Table.ColumnHeader>Supplément GFA (%)</Table.ColumnHeader>
              <Table.ColumnHeader>Supplément SCTL (%)</Table.ColumnHeader>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sortedValeurs.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <Text textAlign="center" py={4}>
                    Aucune valeur de points enregistrée.
                  </Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              sortedValeurs.map((valeur) => (
                <Table.Row key={valeur.id}>
                  <Table.Cell fontWeight="bold">{valeur.annee}</Table.Cell>
                  <Table.Cell>{valeur.valeur_point_gfa || "-"}</Table.Cell>
                  <Table.Cell>{valeur.valeur_point_sctl || "-"}</Table.Cell>
                  <Table.Cell>{valeur.valeur_supp_gfa || "-"}</Table.Cell>
                  <Table.Cell>{valeur.valeur_supp_sctl || "-"}</Table.Cell>
                  <Table.Cell>
                    <Flex gap={1}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingValeur(valeur)}
                      >
                        <FiEdit2 />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        colorPalette="red"
                        onClick={() => setDeletingValeur(valeur)}
                      >
                        <FiTrash2 />
                      </Button>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      )}

      {/* Dialogs */}
      <AddValeurPointDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {editingValeur && (
        <EditValeurPointDialog
          valeur={editingValeur}
          isOpen={!!editingValeur}
          onClose={() => setEditingValeur(null)}
        />
      )}

      {deletingValeur && (
        <DeleteValeurPointDialog
          valeur={deletingValeur}
          isOpen={!!deletingValeur}
          onClose={() => setDeletingValeur(null)}
        />
      )}
    </Container>
  )
}
