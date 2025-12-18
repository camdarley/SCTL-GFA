import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import { type PersonnePublic, type PersonneUpdate, PersonnesService } from "@/client"
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
  Textarea,
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

interface EditPersonneProps {
  personne: PersonnePublic
  isOpen: boolean
  onClose: () => void
}

const EditPersonne = ({ personne, isOpen, onClose }: EditPersonneProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PersonneUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      nom: personne.nom,
      prenom: personne.prenom || "",
      civilite: personne.civilite || "",
      adresse: personne.adresse || "",
      adresse2: personne.adresse2 || "",
      code_postal: personne.code_postal || "",
      ville: personne.ville || "",
      tel: personne.tel || "",
      port: personne.port || "",
      mail: personne.mail || "",
      fondateur: personne.fondateur || false,
      de_droit: personne.de_droit || false,
      adherent: personne.adherent || false,
      decede: personne.decede || false,
      termine: personne.termine || false,
      npai: personne.npai || false,
      est_personne_morale: personne.est_personne_morale || false,
      comment: personne.comment || "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: PersonneUpdate) =>
      PersonnesService.updatePersonne({ personneId: personne.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Actionnaire modifié avec succès.")
      onClose()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["personnes"] })
    },
  })

  const onSubmit: SubmitHandler<PersonneUpdate> = (data) => {
    mutation.mutate(data)
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
            <DialogTitle>Modifier l'Actionnaire</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Modifiez les informations de l'actionnaire.</Text>

            <VStack gap={4}>
              {/* Identity */}
              <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field label="Civilité">
                    <Input {...register("civilite")} placeholder="M., Mme..." />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Nom" required invalid={!!errors.nom} errorText={errors.nom?.message}>
                    <Input {...register("nom")} placeholder="Nom" />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Prénom">
                    <Input {...register("prenom")} placeholder="Prénom" />
                  </Field>
                </GridItem>
              </Grid>

              {/* Address */}
              <Field label="Adresse">
                <Input {...register("adresse")} placeholder="Adresse ligne 1" />
              </Field>
              <Field label="Adresse (suite)">
                <Input {...register("adresse2")} placeholder="Adresse ligne 2" />
              </Field>

              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field label="Code Postal">
                    <Input {...register("code_postal")} placeholder="Code postal" />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Ville">
                    <Input {...register("ville")} placeholder="Ville" />
                  </Field>
                </GridItem>
              </Grid>

              {/* Contact */}
              <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field label="Téléphone">
                    <Input {...register("tel")} placeholder="Téléphone fixe" />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Portable">
                    <Input {...register("port")} placeholder="Portable" />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Email">
                    <Input {...register("mail")} placeholder="Email" type="email" />
                  </Field>
                </GridItem>
              </Grid>

              {/* Status flags */}
              <Text fontWeight="medium" alignSelf="start">Statut</Text>
              <Grid templateColumns="repeat(3, 1fr)" gap={2} w="full">
                <Controller
                  control={control}
                  name="fondateur"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={({ checked }) => field.onChange(checked)}
                    >
                      Fondateur
                    </Checkbox>
                  )}
                />
                <Controller
                  control={control}
                  name="de_droit"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={({ checked }) => field.onChange(checked)}
                    >
                      De droit
                    </Checkbox>
                  )}
                />
                <Controller
                  control={control}
                  name="adherent"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={({ checked }) => field.onChange(checked)}
                    >
                      Adhérent
                    </Checkbox>
                  )}
                />
                <Controller
                  control={control}
                  name="npai"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={({ checked }) => field.onChange(checked)}
                    >
                      NPAI
                    </Checkbox>
                  )}
                />
                <Controller
                  control={control}
                  name="decede"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={({ checked }) => field.onChange(checked)}
                    >
                      Décédé
                    </Checkbox>
                  )}
                />
                <Controller
                  control={control}
                  name="termine"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={({ checked }) => field.onChange(checked)}
                    >
                      Terminé
                    </Checkbox>
                  )}
                />
                <Controller
                  control={control}
                  name="est_personne_morale"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={({ checked }) => field.onChange(checked)}
                    >
                      Personne Morale
                    </Checkbox>
                  )}
                />
              </Grid>

              {/* Comments */}
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

export default EditPersonne
