import { Box, Heading, SimpleGrid, Text, Icon } from "@hope-ui/solid"
import { useManageTitle, useT } from "~/hooks"
import { BiSolidUser, BiSolidNetworkChart, BiSolidFolder } from "solid-icons/bi"

const Dashboard = () => {
  const t = useT()
  useManageTitle("tenant.sidemenu.dashboard")

  return (
    <Box>
      <Heading mb="$4">{t("tenant.dashboard.title")}</Heading>
      <SimpleGrid cols={{ "@initial": 1, "@md": 3 }} gap="$6">
        <Box borderWidth="1px" borderRadius="$lg" p="$6">
          <Box display="flex" alignItems="center" mb="$4">
            <Icon as={BiSolidUser} boxSize="$8" color="$info9" mr="$3" />
            <Heading as="h3" size="lg">{t("tenant.dashboard.profile")}</Heading>
          </Box>
          <Text>{t("tenant.dashboard.profile_desc")}</Text>
        </Box>
        
        <Box borderWidth="1px" borderRadius="$lg" p="$6">
          <Box display="flex" alignItems="center" mb="$4">
            <Icon as={BiSolidNetworkChart} boxSize="$8" color="$success9" mr="$3" />
            <Heading as="h3" size="lg">{t("tenant.dashboard.access")}</Heading>
          </Box>
          <Text>{t("tenant.dashboard.access_desc")}</Text>
        </Box>
        
        <Box borderWidth="1px" borderRadius="$lg" p="$6">
          <Box display="flex" alignItems="center" mb="$4">
            <Icon as={BiSolidFolder} boxSize="$8" color="$warning9" mr="$3" />
            <Heading as="h3" size="lg">{t("tenant.dashboard.data")}</Heading>
          </Box>
          <Text>{t("tenant.dashboard.data_desc")}</Text>
        </Box>
      </SimpleGrid>
    </Box>
  )
}

export default Dashboard