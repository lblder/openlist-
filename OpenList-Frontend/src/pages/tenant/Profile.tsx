import { Box, Heading, Text, VStack } from "@hope-ui/solid"
import { createResource } from "solid-js"
import { useManageTitle, useT } from "~/hooks"
import { me } from "~/store"

const Profile = () => {
  const t = useT()
  useManageTitle("tenant.sidemenu.profile")
  
  const [user] = createResource(async () => {
    // 这里应该调用API获取用户信息
    // 暂时使用当前登录用户信息
    return me()
  })

  return (
    <Box>
      <Heading mb="$4">{t("tenant.profile.title")}</Heading>
      <Box borderWidth="1px" borderRadius="$lg" p="$6">
        <VStack spacing="$4" alignItems="flex-start">
          <Box>
            <Text fontWeight="$medium" mb="$1">{t("tenant.profile.username")}</Text>
            <Text>{user()?.username || t("loading")}</Text>
          </Box>
          
          <Box>
            <Text fontWeight="$medium" mb="$1">{t("tenant.profile.role")}</Text>
            <Text>{t("tenant.profile.tenant")}</Text>
          </Box>
          
          <Box>
            <Text fontWeight="$medium" mb="$1">{t("tenant.profile.base_path")}</Text>
            <Text>{user()?.base_path || "/"}</Text>
          </Box>
        </VStack>
      </Box>
    </Box>
  )
}

export default Profile