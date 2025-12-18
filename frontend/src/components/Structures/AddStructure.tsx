import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type StructureCreate, StructuresService } from "@/client"
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

interface AddStructureProps {
  isOpen: boolean
  onClose: () => void
}

const AddStructure = ({ isOpen, onClose }: AddStructureProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StructureCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      type_structure: 2,
      nom_structure: "",
      gfa: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: StructureCreate) =>
      StructuresService.createStructure({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Structure créée avec succès.")
      reset()
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["structures"] })
    },
  })

  const onSubmit: SubmitHandler<StructureCreate> = (data) => {
    mutation.mutate({
      ...data,
      type_structure: Number(data.type_structure),
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
            <DialogTitle>Ajouter une Structure</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Renseignez les informations de la nouvelle structure.</Text>

            <VStack gap={4}>
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field label="Type de Structure" required>
                    <select
                      {...register("type_structure", { required: true })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--chakra-colors-border)",
                        backgroundColor: "var(--chakra-colors-bg)",
                      }}
                    >
                      <option value="2">GFA</option>
                      <option value="5">Association</option>
                      <option value="6">SCTL</option>
                    </select>
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Nom" required invalid={!!errors.nom_structure} errorText={errors.nom_structure?.message}>
                    <Input {...register("nom_structure", { required: "Le nom est requis" })} placeholder="Nom de la structure" />
                  </Field>
                </GridItem>
              </Grid>

              <Field label="Code GFA">
                <Input {...register("gfa")} placeholder="Code GFA associé" maxLength={50} />
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

export default AddStructure
