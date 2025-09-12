import { Box, Heading, Text, VStack, Icon } from "@hope-ui/solid"
import { useManageTitle, useT } from "~/hooks"
import { BiSolidFolder } from "solid-icons/bi"

const DataManagement = () => {
  const t = useT()
  useManageTitle("tenant.sidemenu.data")

  return (
    <Box>
      <Heading mb="$4">{t("tenant.data.title")}</Heading>
      <Box borderWidth="1px" borderRadius="$lg" p="$6">
        <VStack spacing="$4" alignItems="center" textAlign="center">
          <Icon as={BiSolidFolder} boxSize="$16" color="$primary9" />
          <Heading as="h3" size="lg">{t("tenant.data.file_management")}</Heading>
          <Text>{t("tenant.data.description")}</Text>
          <Text color="$neutral11">{t("tenant.data.coming_soon")}</Text>
        </VStack>
      </Box>
    </Box>
  )
}

export default DataManagement