import { Button, DialogTitle, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { FiTrash2 } from "react-icons/fi"

import { ParcellesService } from "@/client"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog"
import useCustomToast from "@/hooks/useCustomToast"

const DeleteParcelle = ({ id }: { id: number }) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const mutation = useMutation({
    mutationFn: () => ParcellesService.deleteParcelle({ parcelleId: id }),
    onSuccess: () => {
      showSuccessToast("La parcelle a été supprimée avec succès.")
      setIsOpen(false)
    },
    onError: () => {
      showErrorToast("Une erreur est survenue lors de la suppression.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["parcelles"] })
    },
  })

  const onSubmit = async () => {
    mutation.mutate()
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      role="alertdialog"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" colorPalette="red">
          <FiTrash2 fontSize="16px" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Supprimer la Parcelle</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Cette parcelle sera{" "}
              <strong>supprimée définitivement.</strong> Êtes-vous sûr ?
            </Text>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              colorPalette="red"
              type="submit"
              loading={isSubmitting}
            >
              Supprimer
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </form>
      </DialogContent>
    </DialogRoot>
  )
}

export default DeleteParcelle
