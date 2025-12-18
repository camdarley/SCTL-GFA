import { Flex } from "@chakra-ui/react"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import GlobalModals from "@/components/Common/GlobalModals"
import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"
import { FicheActionnaireProvider } from "@/contexts/FicheActionnaireContext"
import { FicheActeProvider } from "@/contexts/FicheActeContext"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  // Both providers wrap the content, and GlobalModals is rendered inside both
  // to avoid circular dependency (FicheActionnaire uses ActeName, FicheActe uses ActionnaireName)
  return (
    <FicheActeProvider>
      <FicheActionnaireProvider>
        <Flex direction="column" h="100vh">
          <Navbar />
          <Flex flex="1" overflow="hidden">
            <Sidebar />
            <Flex flex="1" direction="column" p={4} overflowY="auto">
              <Outlet />
            </Flex>
          </Flex>
        </Flex>
        <GlobalModals />
      </FicheActionnaireProvider>
    </FicheActeProvider>
  )
}

export default Layout
