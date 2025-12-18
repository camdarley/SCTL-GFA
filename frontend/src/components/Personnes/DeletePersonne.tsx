import { Button, DialogTitle, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"

import { PersonnesService, type PersonnePublic } from "@/client"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from "@/components/ui/dialog"
import useCustomToast from "@/hooks/useCustomToast"

interface DeletePersonneProps {
  personne: PersonnePublic
  isOpen: boolean
  onClose: () => void
}

const DeletePersonne = ({ personne, isOpen, onClose }: DeletePersonneProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const mutation = useMutation({
    mutationFn: () => PersonnesService.deletePersonne({ personneId: personne.id }),
    onSuccess: () => {
      showSuccessToast("L'actionnaire a été supprimé avec succès.")
      onClose()
    },
    onError: () => {
      showErrorToast("Une erreur est survenue lors de la suppression.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["personnes"] })
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
      onOpenChange={({ open }) => !open && onClose()}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Supprimer l'Actionnaire</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Êtes-vous sûr de vouloir supprimer <strong>{personne.prenom} {personne.nom}</strong> ?
            </Text>
            <Text mb={4}>
              Tous les mouvements et parts associés à cet actionnaire seront également{" "}
              <strong>supprimés définitivement.</strong> Cette action est irréversible.
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

export default DeletePersonne
