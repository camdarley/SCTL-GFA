import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Text,
  Card,
  Tabs,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FiRefreshCw, FiAlertTriangle, FiCheck } from "react-icons/fi"

import { AnomaliesService, type NumeroPartPublic, type MouvementPublic } from "@/client"

export const Route = createFileRoute("/_layout/anomalies")({
  component: AnomaliesPage,
})

function AnomaliesPage() {
  const { data: partsSansMouvements, isLoading: loadingParts, refetch: refetchParts } = useQuery({
    queryKey: ["anomalies", "parts-sans-mouvements"],
    queryFn: () => AnomaliesService.getPartsSansMouvements({}),
  })

  const { data: mouvementsSansActes, isLoading: loadingMouvements, refetch: refetchMouvements } = useQuery({
    queryKey: ["anomalies", "mouvements-sans-actes"],
    queryFn: () => AnomaliesService.getMouvementsSansActes({}),
  })

  const { isLoading: loadingSummary, refetch: refetchSummary } = useQuery({
    queryKey: ["anomalies", "summary"],
    queryFn: () => AnomaliesService.getAnomaliesSummary({}),
  })

  const isLoading = loadingParts || loadingMouvements || loadingSummary

  const refetchAll = () => {
    refetchParts()
    refetchMouvements()
    refetchSummary()
  }

  const partsCount = partsSansMouvements?.length || 0
  const mouvementsCount = mouvementsSansActes?.length || 0
  const totalCount = partsCount + mouvementsCount

  return (
    <Container maxW="full" py={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Anomalies</Heading>
          <Text color="gray.500">
            Détection et résolution des incohérences dans les données
          </Text>
        </Box>
        <Button
          colorPalette="blue"
          onClick={refetchAll}
          loading={isLoading}
        >
          <FiRefreshCw />
          Actualiser
        </Button>
      </Flex>

      {/* Summary Cards */}
      <Flex gap={4} mb={6} flexWrap="wrap">
        <Card.Root flex={1} minW="200px">
          <Card.Body>
            <Flex align="center" gap={3}>
              <Box
                p={2}
                borderRadius="md"
                bg={totalCount > 0 ? "orange.100" : "green.100"}
              >
                {totalCount > 0 ? (
                  <FiAlertTriangle color="orange" />
                ) : (
                  <FiCheck color="green" />
                )}
              </Box>
              <Box>
                <Text fontSize="2xl" fontWeight="bold">
                  {totalCount}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Total anomalies
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>

        <Card.Root flex={1} minW="200px">
          <Card.Body>
            <Flex align="center" gap={3}>
              <Box p={2} borderRadius="md" bg="red.100">
                <FiAlertTriangle color="red" />
              </Box>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color="red.500">
                  {partsCount}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Parts sans mouvements
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>

        <Card.Root flex={1} minW="200px">
          <Card.Body>
            <Flex align="center" gap={3}>
              <Box p={2} borderRadius="md" bg="orange.100">
                <FiAlertTriangle color="orange" />
              </Box>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {mouvementsCount}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Mouvements sans actes
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      </Flex>

      {/* Anomalies Tabs */}
      {isLoading ? (
        <Text>Chargement des anomalies...</Text>
      ) : totalCount === 0 ? (
        <Card.Root>
          <Card.Body>
            <Flex direction="column" align="center" py={8}>
              <FiCheck size={48} color="green" />
              <Text fontSize="lg" fontWeight="medium" mt={4}>
                Aucune anomalie détectée
              </Text>
              <Text color="gray.500">
                Toutes les données sont cohérentes.
              </Text>
            </Flex>
          </Card.Body>
        </Card.Root>
      ) : (
        <Tabs.Root defaultValue="parts">
          <Tabs.List>
            <Tabs.Trigger value="parts">
              Parts sans mouvements ({partsCount})
            </Tabs.Trigger>
            <Tabs.Trigger value="mouvements">
              Mouvements sans actes ({mouvementsCount})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="parts">
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Numéro de Part</Table.ColumnHeader>
                    <Table.ColumnHeader>Personne (ID)</Table.ColumnHeader>
                    <Table.ColumnHeader>Structure (ID)</Table.ColumnHeader>
                    <Table.ColumnHeader>État</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {partsSansMouvements?.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={6}>
                        <Text textAlign="center" py={4}>
                          Aucune part sans mouvement.
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    partsSansMouvements?.map((part: NumeroPartPublic) => (
                      <Table.Row key={part.id}>
                        <Table.Cell>{part.id}</Table.Cell>
                        <Table.Cell fontWeight="medium">{part.num_part}</Table.Cell>
                        <Table.Cell>{part.id_personne}</Table.Cell>
                        <Table.Cell>{part.id_structure || "-"}</Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette={part.termine ? "green" : "gray"}>
                            {part.termine ? "Terminée" : "Active"}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Button variant="ghost" size="sm">
                            Corriger
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </Box>
          </Tabs.Content>

          <Tabs.Content value="mouvements">
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Sens</Table.ColumnHeader>
                    <Table.ColumnHeader>Date</Table.ColumnHeader>
                    <Table.ColumnHeader>Personne (ID)</Table.ColumnHeader>
                    <Table.ColumnHeader>Nb Parts</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {mouvementsSansActes?.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={6}>
                        <Text textAlign="center" py={4}>
                          Aucun mouvement sans acte.
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    mouvementsSansActes?.map((mvt: MouvementPublic) => (
                      <Table.Row key={mvt.id}>
                        <Table.Cell>{mvt.id}</Table.Cell>
                        <Table.Cell fontWeight="medium">
                          <Badge colorPalette={mvt.sens ? "green" : "red"}>
                            {mvt.sens ? "Acquisition" : "Cession"}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          {mvt.date_operation ? new Date(mvt.date_operation).toLocaleDateString("fr-FR") : "-"}
                        </Table.Cell>
                        <Table.Cell>{mvt.id_personne}</Table.Cell>
                        <Table.Cell>{mvt.nb_parts ?? "-"}</Table.Cell>
                        <Table.Cell>
                          <Button variant="ghost" size="sm">
                            Corriger
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </Box>
          </Tabs.Content>
        </Tabs.Root>
      )}
    </Container>
  )
}
