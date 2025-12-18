import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"
import { useState } from "react"
import { FaPlus } from "react-icons/fa"

import { type PersonneCreate, PersonnesService } from "@/client"
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
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

const AddPersonne = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PersonneCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      nom: "",
      prenom: "",
      civilite: "",
      adresse: "",
      adresse2: "",
      code_postal: "",
      ville: "",
      tel: "",
      port: "",
      mail: "",
      fondateur: false,
      de_droit: false,
      adherent: false,
      decede: false,
      termine: false,
      npai: false,
      est_personne_morale: false,
      comment: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: PersonneCreate) =>
      PersonnesService.createPersonne({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Actionnaire créé avec succès.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["personnes"] })
    },
  })

  const onSubmit: SubmitHandler<PersonneCreate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size="xl"
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-personne" my={4}>
          <FaPlus fontSize="16px" />
          Nouvel Actionnaire
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Nouvel Actionnaire</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Remplissez le formulaire pour créer un nouvel actionnaire.</Text>

            <VStack gap={4}>
              {/* Identity */}
              <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field label="Civilité" invalid={!!errors.civilite}>
                    <Input {...register("civilite")} placeholder="M., Mme..." />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Nom" required invalid={!!errors.nom} errorText={errors.nom?.message}>
                    <Input
                      {...register("nom", { required: "Le nom est requis" })}
                      placeholder="Nom"
                    />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Prénom" invalid={!!errors.prenom}>
                    <Input {...register("prenom")} placeholder="Prénom" />
                  </Field>
                </GridItem>
              </Grid>

              {/* Address */}
              <Field label="Adresse" invalid={!!errors.adresse}>
                <Input {...register("adresse")} placeholder="Adresse ligne 1" />
              </Field>
              <Field label="Adresse (suite)" invalid={!!errors.adresse2}>
                <Input {...register("adresse2")} placeholder="Adresse ligne 2" />
              </Field>

              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field label="Code Postal" invalid={!!errors.code_postal}>
                    <Input {...register("code_postal")} placeholder="Code postal" />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Ville" invalid={!!errors.ville}>
                    <Input {...register("ville")} placeholder="Ville" />
                  </Field>
                </GridItem>
              </Grid>

              {/* Contact */}
              <Grid templateColumns="repeat(3, 1fr)" gap={4} w="full">
                <GridItem>
                  <Field label="Téléphone" invalid={!!errors.tel}>
                    <Input {...register("tel")} placeholder="Téléphone fixe" />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Portable" invalid={!!errors.port}>
                    <Input {...register("port")} placeholder="Portable" />
                  </Field>
                </GridItem>
                <GridItem>
                  <Field label="Email" invalid={!!errors.mail}>
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
                      checked={field.value}
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
                      checked={field.value}
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
                      checked={field.value}
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
                      checked={field.value}
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
                      checked={field.value}
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
                      checked={field.value}
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
                      checked={field.value}
                      onCheckedChange={({ checked }) => field.onChange(checked)}
                    >
                      Personne Morale
                    </Checkbox>
                  )}
                />
              </Grid>

              {/* Comments */}
              <Field label="Commentaire" invalid={!!errors.comment}>
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
            <Button variant="solid" type="submit" disabled={!isValid} loading={isSubmitting}>
              Créer
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddPersonne
