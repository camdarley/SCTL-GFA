import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import { type ActeCreate, ActesService } from "@/client"
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

interface AddActeProps {
  isOpen: boolean
  onClose: () => void
}

const AddActe = ({ isOpen, onClose }: AddActeProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActeCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      code_acte: "",
      date_acte: "",
      libelle_acte: "",
      provisoire: false,
      id_structure: undefined,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ActeCreate) =>
      ActesService.createActe({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Acte créé avec succès.")
      reset()
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["actes"] })
    },
  })

  const onSubmit: SubmitHandler<ActeCreate> = (data) => {
    mutation.mutate({
      ...data,
      id_structure: data.id_structure ? Number(data.id_structure) : undefined,
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
            <DialogTitle>Ajouter un Acte</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Renseignez les informations du nouvel acte.</Text>

            <VStack gap={4}>
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field label="Code Acte" invalid={!!errors.code_acte} errorText={errors.code_acte?.message}>
                    <Input {...register("code_acte")} placeholder="Code de l'acte" />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Date de l'Acte">
                    <Input {...register("date_acte")} type="date" />
                  </Field>
                </GridItem>
              </Grid>

              <Field label="Libellé de l'Acte">
                <Input {...register("libelle_acte")} placeholder="Description de l'acte" />
              </Field>

              <Field label="Structure (ID)">
                <Input {...register("id_structure")} placeholder="ID de la structure" type="number" />
              </Field>

              <Controller
                control={control}
                name="provisoire"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={({ checked }) => field.onChange(checked)}
                  >
                    Acte provisoire
                  </Checkbox>
                )}
              />
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

export default AddActe
