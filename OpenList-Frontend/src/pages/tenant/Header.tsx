import {
  Box,
  Button,
  createDisclosure,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Text,
  useColorModeValue,
} from "@hope-ui/solid"
import { TiThMenu } from "solid-icons/ti"
import { IoExit } from "solid-icons/io"
import { SwitchColorMode, SwitchLanguageWhite } from "~/components"
import { createSignal, Show } from "solid-js"
import { useFetch, useT, useRouter, useTitle } from "~/hooks"
import { me, setMe, defaultUser } from "~/store"
import { handleResp, notify, r, changeToken } from "~/utils"

export const Header = () => {
  const t = useT()
  useTitle(() => t("tenant.title"))
  const { to } = useRouter()
  const { isOpen, onOpen, onClose } = createDisclosure()
  const [logoutLoading, logoutReq] = useFetch(
    (): PResp<any> => r.get("/auth/logout"),
  )
  
  const handleLogout = async () => {
    handleResp(await logoutReq(), () => {
      // 清除所有本地存储的认证信息
      changeToken()
      localStorage.removeItem("token")
      sessionStorage.clear()
      
      // 清除用户信息，使用默认空用户对象
      setMe(defaultUser)
      
      notify.success(t("tenant.logout_success"))
      // 登出后重定向到登录页面
      to("/@login")
    })
  }
  
  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      left="0"
      right="0"
      zIndex="$sticky"
      height="64px"
      flexShrink={0}
      shadow="$md"
      p="$4"
      bgColor={useColorModeValue("$background", "$neutral2")()}
    >
      <Flex alignItems="center" justifyContent="space-between" h="$full">
        <HStack spacing="$2">
          <IconButton
            aria-label="menu"
            icon={<TiThMenu />}
            display={{ "@sm": "none" }}
            onClick={onOpen}
            size="sm"
          />
          <Heading
            fontSize="$xl"
            color="$info9"
            cursor="pointer"
            onClick={() => {
              to("/@tenant")
            }}
          >
            {t("tenant.title")}
          </Heading>
        </HStack>
        <HStack spacing="$1">
          <IconButton
            aria-label="logout"
            icon={<IoExit />}
            loading={logoutLoading()}
            onClick={handleLogout}
            size="sm"
          />
        </HStack>
      </Flex>
      <Drawer opened={isOpen()} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader color="$info9">{t("tenant.title")}</DrawerHeader>
          <DrawerBody>
            <SideMenu items={side_menu_items} />
            <Center>
              <HStack spacing="$4" p="$2" color="$neutral11">
                <SwitchLanguageWhite />
                <SwitchColorMode />
              </HStack>
            </Center>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}