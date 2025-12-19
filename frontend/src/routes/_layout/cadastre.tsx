import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Table,
  Text,
  Tabs,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2 } from "react-icons/fi"

import { CadastreService, type ExploitantPublic } from "@/client"
import FicheExploitant from "@/components/Exploitants/FicheExploitant"

export const Route = createFileRoute("/_layout/cadastre")({
  component: CadastrePage,
})

function CommunesTab() {
  const [searchTerm, setSearchTerm] = useState("")

  const { data, isLoading, isError } = useQuery({
    queryKey: ["communes"],
    queryFn: () => CadastreService.readCommunes({ skip: 0, limit: 100 }),
  })

  const communes = data?.data || []
  const filteredCommunes = searchTerm
    ? communes.filter((c) =>
        c.nom_com.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.num_com?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : communes

  return (
    <Box>
      <Flex mb={4} gap={4}>
        <Flex flex={1}>
          <Input
            placeholder="Rechercher une commune..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button ml={2}>
            <FiSearch />
          </Button>
        </Flex>
        <Button colorPalette="blue">
          <FiPlus />
          Ajouter
        </Button>
      </Flex>

      {isLoading ? (
        <Text>Chargement...</Text>
      ) : isError ? (
        <Text color="red.500">Erreur lors du chargement.</Text>
      ) : (
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>ID</Table.ColumnHeader>
              <Table.ColumnHeader>Nom</Table.ColumnHeader>
              <Table.ColumnHeader>Numéro Commune</Table.ColumnHeader>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredCommunes.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={4}>
                  <Text textAlign="center" py={4}>Aucune commune trouvée.</Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredCommunes.map((commune) => (
                <Table.Row key={commune.id}>
                  <Table.Cell>{commune.id}</Table.Cell>
                  <Table.Cell fontWeight="medium">{commune.nom_com}</Table.Cell>
                  <Table.Cell>{commune.num_com || "-"}</Table.Cell>
                  <Table.Cell>
                    <Button variant="ghost" size="sm">Modifier</Button>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  )
}

function LieuxDitsTab() {
  const [searchTerm, setSearchTerm] = useState("")

  const { data, isLoading, isError } = useQuery({
    queryKey: ["lieux-dits"],
    queryFn: () => CadastreService.readLieuxDits({ skip: 0, limit: 100 }),
  })

  const lieuxDits = data?.data || []
  const filteredLieuxDits = searchTerm
    ? lieuxDits.filter((l) => l.nom.toLowerCase().includes(searchTerm.toLowerCase()))
    : lieuxDits

  return (
    <Box>
      <Flex mb={4} gap={4}>
        <Flex flex={1}>
          <Input
            placeholder="Rechercher un lieu-dit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button ml={2}>
            <FiSearch />
          </Button>
        </Flex>
        <Button colorPalette="blue">
          <FiPlus />
          Ajouter
        </Button>
      </Flex>

      {isLoading ? (
        <Text>Chargement...</Text>
      ) : isError ? (
        <Text color="red.500">Erreur lors du chargement.</Text>
      ) : (
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>ID</Table.ColumnHeader>
              <Table.ColumnHeader>Nom</Table.ColumnHeader>
              <Table.ColumnHeader>Commune (ID)</Table.ColumnHeader>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredLieuxDits.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={4}>
                  <Text textAlign="center" py={4}>Aucun lieu-dit trouvé.</Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredLieuxDits.map((lieuDit) => (
                <Table.Row key={lieuDit.id}>
                  <Table.Cell>{lieuDit.id}</Table.Cell>
                  <Table.Cell fontWeight="medium">{lieuDit.nom}</Table.Cell>
                  <Table.Cell>{lieuDit.id_commune || "-"}</Table.Cell>
                  <Table.Cell>
                    <Button variant="ghost" size="sm">Modifier</Button>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  )
}

function ExploitantsTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedExploitant, setSelectedExploitant] = useState<ExploitantPublic | null>(null)
  const [isFicheOpen, setIsFicheOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["exploitants"],
    queryFn: () => CadastreService.readExploitants({ skip: 0, limit: 100 }),
  })

  const exploitants = data?.data || []
  const filteredExploitants = searchTerm
    ? exploitants.filter((e) =>
        e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.prenom?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : exploitants

  const handleViewExploitant = (exploitant: ExploitantPublic) => {
    setSelectedExploitant(exploitant)
    setIsFicheOpen(true)
  }

  const handleCloseFiche = () => {
    setIsFicheOpen(false)
    setSelectedExploitant(null)
  }

  return (
    <Box>
      <Flex mb={4} gap={4}>
        <Flex flex={1}>
          <Input
            placeholder="Rechercher un exploitant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button ml={2}>
            <FiSearch />
          </Button>
        </Flex>
        <Button colorPalette="blue">
          <FiPlus />
          Ajouter
        </Button>
      </Flex>

      {isLoading ? (
        <Text>Chargement...</Text>
      ) : isError ? (
        <Text color="red.500">Erreur lors du chargement.</Text>
      ) : (
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>ID</Table.ColumnHeader>
              <Table.ColumnHeader>Nom</Table.ColumnHeader>
              <Table.ColumnHeader>Prénom</Table.ColumnHeader>
              <Table.ColumnHeader>Ville</Table.ColumnHeader>
              <Table.ColumnHeader>Téléphone</Table.ColumnHeader>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredExploitants.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <Text textAlign="center" py={4}>Aucun exploitant trouvé.</Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredExploitants.map((exploitant) => (
                <Table.Row key={exploitant.id}>
                  <Table.Cell>{exploitant.id}</Table.Cell>
                  <Table.Cell fontWeight="medium">{exploitant.nom}</Table.Cell>
                  <Table.Cell>{exploitant.prenom || "-"}</Table.Cell>
                  <Table.Cell>{exploitant.ville || "-"}</Table.Cell>
                  <Table.Cell>{exploitant.tel || "-"}</Table.Cell>
                  <Table.Cell>
                    <Flex gap={1}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewExploitant(exploitant)}
                        title="Voir la fiche"
                      >
                        <FiEye />
                      </Button>
                      <Button variant="ghost" size="sm" title="Modifier">
                        <FiEdit2 />
                      </Button>
                      <Button variant="ghost" size="sm" colorPalette="red" title="Supprimer">
                        <FiTrash2 />
                      </Button>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      )}

      {selectedExploitant && (
        <FicheExploitant
          exploitant={selectedExploitant}
          isOpen={isFicheOpen}
          onClose={handleCloseFiche}
        />
      )}
    </Box>
  )
}

function CadastrePage() {
  return (
    <Container maxW="full" py={4}>
      <Heading size="lg" mb={6}>
        Référentiel Cadastre
      </Heading>
      <Text color="gray.500" mb={6}>
        Gestion des communes, lieux-dits et exploitants
      </Text>

      <Tabs.Root defaultValue="communes">
        <Tabs.List>
          <Tabs.Trigger value="communes">Communes</Tabs.Trigger>
          <Tabs.Trigger value="lieux-dits">Lieux-dits</Tabs.Trigger>
          <Tabs.Trigger value="exploitants">Exploitants</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="communes">
          <CommunesTab />
        </Tabs.Content>
        <Tabs.Content value="lieux-dits">
          <LieuxDitsTab />
        </Tabs.Content>
        <Tabs.Content value="exploitants">
          <ExploitantsTab />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  )
}
