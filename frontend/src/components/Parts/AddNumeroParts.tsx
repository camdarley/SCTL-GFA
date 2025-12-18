import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type NumeroPartCreate, NumerosPartsService } from "@/client"
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
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface AddNumeroPartsProps {
  isOpen: boolean
  onClose: () => void
}

const AddNumeroParts = ({ isOpen, onClose }: AddNumeroPartsProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NumeroPartCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      num_part: 0,
      termine: false,
      distribue: false,
      etat: 0,
      id_personne: undefined,
      id_structure: undefined,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: NumeroPartCreate) =>
      NumerosPartsService.createNumeroPart({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Numéro de part créé avec succès.")
      reset()
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["numeros-parts"] })
    },
  })

  const onSubmit: SubmitHandler<NumeroPartCreate> = (data) => {
    mutation.mutate({
      ...data,
      num_part: Number(data.num_part),
      id_personne: Number(data.id_personne),
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
            <DialogTitle>Ajouter des Numéros de Parts</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Renseignez la plage de numéros de parts.</Text>

            <VStack gap={4}>
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field
                    label="Numéro de Part"
                    required
                    invalid={!!errors.num_part}
                    errorText={errors.num_part?.message}
                  >
                    <Input
                      {...register("num_part", { required: "Le numéro de part est requis" })}
                      placeholder="Numéro de la part"
                      type="number"
                    />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field
                    label="Personne (ID)"
                    required
                    invalid={!!errors.id_personne}
                    errorText={errors.id_personne?.message}
                  >
                    <Input
                      {...register("id_personne", { required: "La personne est requise" })}
                      placeholder="ID de la personne"
                      type="number"
                    />
                  </Field>
                </GridItem>
              </Grid>

              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field label="Structure (ID)">
                    <Input
                      {...register("id_structure")}
                      placeholder="ID de la structure"
                      type="number"
                    />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="État">
                    <Input
                      {...register("etat")}
                      placeholder="Code d'état"
                      type="number"
                    />
                  </Field>
                </GridItem>
              </Grid>
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

export default AddNumeroParts
