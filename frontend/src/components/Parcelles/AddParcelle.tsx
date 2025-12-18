import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import { type ParcelleCreate, ParcellesService } from "@/client"
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

interface AddParcelleProps {
  isOpen: boolean
  onClose: () => void
}

const AddParcelle = ({ isOpen, onClose }: AddParcelleProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ParcelleCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      parcelle: "",
      sctl: false,
      comment: "",
      id_commune: undefined,
      id_lieu_dit: undefined,
      id_type_cadastre: undefined,
      id_classe_cadastre: undefined,
      id_gfa: undefined,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ParcelleCreate) =>
      ParcellesService.createParcelle({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Parcelle créée avec succès.")
      reset()
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["parcelles"] })
    },
  })

  const onSubmit: SubmitHandler<ParcelleCreate> = (data) => {
    mutation.mutate({
      ...data,
      id_commune: Number(data.id_commune),
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
            <DialogTitle>Ajouter une Parcelle</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Renseignez les informations de la nouvelle parcelle.
              <Text as="span" color="gray.500" fontSize="sm">
                {" "}(Les subdivisions, surfaces et exploitants seront ajoutés après création)
              </Text>
            </Text>

            <VStack gap={4}>
              {/* Identification cadastrale */}
              <Field label="Référence Parcelle" required invalid={!!errors.parcelle} errorText={errors.parcelle?.message}>
                <Input {...register("parcelle", { required: "La référence est requise" })} placeholder="Référence cadastrale" />
              </Field>

              {/* Location */}
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field label="Commune (ID)" required>
                    <Input {...register("id_commune", { required: "La commune est requise" })} placeholder="ID Commune" type="number" />
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
              Créer
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddParcelle
