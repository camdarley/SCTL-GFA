import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type NumeroPartWithDetails, type NumeroPartUpdate, NumerosPartsService } from "@/client"
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

interface EditNumeroPartsProps {
  numeroPart: NumeroPartWithDetails
  isOpen: boolean
  onClose: () => void
}

const EditNumeroParts = ({ numeroPart, isOpen, onClose }: EditNumeroPartsProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NumeroPartUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      num_part: numeroPart.num_part,
      termine: numeroPart.termine || false,
      distribue: numeroPart.distribue || false,
      etat: numeroPart.etat || 0,
      id_personne: numeroPart.id_personne || undefined,
      id_structure: numeroPart.id_structure || undefined,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: NumeroPartUpdate) =>
      NumerosPartsService.updateNumeroPart({ partId: numeroPart.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Numéro de part modifié avec succès.")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["numeros-parts"] })
    },
  })

  const onSubmit: SubmitHandler<NumeroPartUpdate> = (data) => {
    mutation.mutate({
      ...data,
      num_part: data.num_part ? Number(data.num_part) : undefined,
      id_personne: data.id_personne ? Number(data.id_personne) : undefined,
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
            <DialogTitle>Modifier les Numéros de Parts</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Modifiez la plage de numéros de parts.</Text>

            <VStack gap={4}>
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field
                    label="Numéro de Part"
                    invalid={!!errors.num_part}
                    errorText={errors.num_part?.message}
                  >
                    <Input
                      {...register("num_part")}
                      placeholder="Numéro de la part"
                      type="number"
                    />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field
                    label="Personne (ID)"
                    invalid={!!errors.id_personne}
                    errorText={errors.id_personne?.message}
                  >
                    <Input
                      {...register("id_personne")}
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
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditNumeroParts
