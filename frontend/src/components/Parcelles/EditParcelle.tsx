import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import { type ParcelleWithSubdivisions, type ParcelleUpdate, ParcellesService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
  Textarea,
  Grid,
  GridItem,
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

interface EditParcelleProps {
  parcelle: ParcelleWithSubdivisions
  isOpen: boolean
  onClose: () => void
}

const EditParcelle = ({ parcelle, isOpen, onClose }: EditParcelleProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ParcelleUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      parcelle: parcelle.parcelle || "",
      sctl: parcelle.sctl || false,
      comment: parcelle.comment || "",
      id_commune: parcelle.id_commune || undefined,
      id_lieu_dit: parcelle.id_lieu_dit || undefined,
      id_type_cadastre: parcelle.id_type_cadastre || undefined,
      id_classe_cadastre: parcelle.id_classe_cadastre || undefined,
      id_gfa: parcelle.id_gfa || undefined,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ParcelleUpdate) =>
      ParcellesService.updateParcelle({ parcelleId: parcelle.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Parcelle modifiée avec succès.")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["parcelles"] })
    },
  })

  const onSubmit: SubmitHandler<ParcelleUpdate> = (data) => {
    mutation.mutate({
      ...data,
      id_commune: data.id_commune ? Number(data.id_commune) : undefined,
      id_lieu_dit: data.id_lieu_dit ? Number(data.id_lieu_dit) : undefined,
      id_type_cadastre: data.id_type_cadastre ? Number(data.id_type_cadastre) : undefined,
      id_classe_cadastre: data.id_classe_cadastre ? Number(data.id_classe_cadastre) : undefined,
      id_gfa: data.id_gfa ? Number(data.id_gfa) : undefined,
    })
  }

  return (
    <DialogRoot
      size="xl"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Modifier la Parcelle</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Modifiez les informations de la parcelle.
              {parcelle.nb_subdivisions && parcelle.nb_subdivisions > 0 && (
                <Text as="span" color="gray.500" fontSize="sm">
                  {" "}(Cette parcelle a {parcelle.nb_subdivisions} subdivision(s) - modifiez-les séparément)
                </Text>
              )}
            </Text>

            <VStack gap={4}>
              {/* Identification cadastrale */}
              <Field label="Référence Parcelle" invalid={!!errors.parcelle} errorText={errors.parcelle?.message}>
                <Input {...register("parcelle")} placeholder="Référence cadastrale" />
              </Field>

              {/* Location */}
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field label="Commune (ID)">
                    <Input {...register("id_commune")} placeholder="ID Commune" type="number" />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Lieu-dit (ID)">
                    <Input {...register("id_lieu_dit")} placeholder="ID Lieu-dit" type="number" />
                  </Field>
                </GridItem>
              </Grid>

              {/* Cadastre */}
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field label="Type Cadastre (ID)">
                    <Input {...register("id_type_cadastre")} placeholder="ID Type" type="number" />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Classe Cadastre (ID)">
                    <Input {...register("id_classe_cadastre")} placeholder="ID Classe" type="number" />
                  </Field>
                </GridItem>
              </Grid>

              {/* GFA */}
              <Field label="GFA (ID)">
                <Input {...register("id_gfa")} placeholder="ID Structure GFA" type="number" />
              </Field>

              <Controller
                control={control}
                name="sctl"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={({ checked }) => field.onChange(checked)}
                  >
                    Appartient à la SCTL
                  </Checkbox>
                )}
              />

              <Field label="Commentaire">
                <Textarea {...register("comment")} placeholder="Commentaires..." />
              </Field>
            </VStack>
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

export default EditParcelle
