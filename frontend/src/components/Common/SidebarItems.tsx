import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import {
  FiHome,
  FiUsers,
  FiSettings,
  FiFileText,
  FiGrid,
  FiMap,
  FiLayers,
  FiAlertTriangle,
  FiClock,
  FiDollarSign,
  FiSliders,
} from "react-icons/fi"
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

interface SidebarItemsProps {
  onClose?: () => void
}

interface Item {
  icon: IconType
  title: string
  path: string
}

interface ItemGroup {
  label: string
  items: Item[]
}

const mainItems: Item[] = [
  { icon: FiHome, title: "Tableau de bord", path: "/" },
]

const gersaItems: Item[] = [
  { icon: FiUsers, title: "Actionnaires", path: "/personnes" },
  { icon: FiLayers, title: "Parts", path: "/parts" },
  { icon: FiClock, title: "Historique", path: "/historique" },
  { icon: FiFileText, title: "Actes", path: "/actes" },
  { icon: FiGrid, title: "Structures", path: "/structures" },
]

const cadastreItems: Item[] = [
  { icon: FiMap, title: "Parcelles", path: "/parcelles" },
  { icon: FiMap, title: "Cadastre", path: "/cadastre" },
  { icon: FiDollarSign, title: "Fermages", path: "/fermages" },
  { icon: FiSliders, title: "Valeurs Points", path: "/valeurs-points" },
]

const adminItems: Item[] = [
  { icon: FiAlertTriangle, title: "Anomalies", path: "/anomalies" },
  { icon: FiUsers, title: "Utilisateurs", path: "/admin" },
  { icon: FiSettings, title: "Paramètres", path: "/settings" },
]

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  const groups: ItemGroup[] = [
    { label: "Menu", items: mainItems },
    { label: "GERSA - Parts", items: gersaItems },
    { label: "Cadastre & Fermages", items: cadastreItems },
    {
      label: "Administration",
      items: currentUser?.is_superuser ? adminItems : adminItems.filter(i => i.path === "/settings"),
    },
  ]

  return (
    <>
      {groups.map((group) => (
        <Box key={group.label}>
          <Text fontSize="xs" px={4} py={2} fontWeight="bold" color="gray.500">
            {group.label}
          </Text>
          <Box>
            {group.items.map(({ icon, title, path }) => (
              <RouterLink key={title} to={path} onClick={onClose}>
                <Flex
                  gap={4}
                  px={4}
                  py={2}
                  _hover={{
                    background: "gray.subtle",
                  }}
                  alignItems="center"
                  fontSize="sm"
                >
                  <Icon as={icon} alignSelf="center" />
                  <Text ml={2}>{title}</Text>
                </Flex>
              </RouterLink>
            ))}
          </Box>
        </Box>
      ))}
    </>
  )
}

export default SidebarItems
