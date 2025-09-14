import { For, Show, createSignal } from "solid-js"
import { useFetch, useListFetch, useManageTitle, useT, useRouter } from "~/hooks"
import { PEmptyResp, PPageResp, User, UserMethods, UserRole } from "~/types"
import { handleResp, r } from "~/utils"
import { Wether } from "~/components"
import { DeletePopover } from "../common/DeletePopover"
import {
  Box,
  Button,
  HStack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
  Text
} from "@hope-ui/solid"
import { UserPermissions } from "~/types"

const Role = (props: { role: number }) => {
  const t = useT()
  const color = () => {
    switch (props.role) {
      case UserRole.ADMIN:
        return "$danger9"
      case UserRole.GENERAL:
        return "$info9"
      case UserRole.GUEST:
        return "$warning9"
      case UserRole.TENANT:
        return "$primary9"
      default:
        return "$neutral9"
    }
  }
  const text = () => {
    switch (props.role) {
      case UserRole.ADMIN:
        return t("users.role_admin")
      case UserRole.GENERAL:
        return t("users.role_general")
      case UserRole.GUEST:
        return t("users.role_guest")
      case UserRole.TENANT:
        return t("users.role_tenant")
      default:
        return "Unknown"
    }
  }
  return (
    <Text fontWeight="$medium" color={color()}>
      {text()}
    </Text>
  )
}

const Permissions = (props: { user: User }) => {
  const t = useT()
  const color = (can: boolean) => `$${can ? "success" : "danger"}9`
  return (
    <HStack spacing="$0_5">
      <For each={UserPermissions}>
        {(item, i) => (
          <Box
            boxSize="$2"
            rounded="$full"
            bg={color(UserMethods.can(props.user, i()))}
          ></Box>
        )}
      </For>
    </HStack>
  )
}

const Users = () => {
  const t = useT()
  useManageTitle("manage.sidemenu.users")
  const { to } = useRouter()
  const [getUsersLoading, getUsers] = useFetch(
    (): PPageResp<User> => r.get("/admin/user/list"),
  )
  const [users, setUsers] = createSignal<User[]>([])
  const refresh = async () => {
    const resp = await getUsers()
    handleResp(resp, (data) => setUsers(data.content || []))
  }
  refresh()

  const [deleting, deleteUser] = useListFetch(
    (id: number): PEmptyResp => r.post(`/admin/user/delete?id=${id}`),
  )
  const [cancel_2faId, cancel_2fa] = useListFetch(
    (id: number): PEmptyResp => r.post(`/admin/user/cancel_2fa?id=${id}`),
  )
  return (
    <VStack spacing="$2" alignItems="start" w="$full">
      <HStack spacing="$2">
        <Button
          colorScheme="accent"
          loading={getUsersLoading()}
          onClick={refresh}
        >
          {t("global.refresh")}
        </Button>
        <Button
          onClick={() => {
            to("/@manage/users/add")
          }}
        >
          {t("global.add")}
        </Button>
      </HStack>
      <Box w="$full" overflowX="auto">
        <Table highlightOnHover dense>
          <Thead>
            <Tr>
              <For
                each={[
                  "username",
                  "base_path",
                  "role",
                  "permission",
                  "available",
                ]}
              >
                {(title) => <Th>{t(`users.${title}`)}</Th>}
              </For>
              <Th>{t("global.operations")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <For each={users()}>
              {(user) => (
                <Tr>
                  <Td>{user.username}</Td>
                  <Td>{user.base_path}</Td>
                  <Td>
                    <Role role={user.role} />
                  </Td>
                  <Td>
                    <Permissions user={user} />
                  </Td>
                  <Td>
                    <Wether yes={!user.disabled} />
                  </Td>
                  <Td>
                    <HStack spacing="$2">
                      <Button
                        size="sm"
                        onClick={() => {
                          to(`/@manage/users/edit/${user.id}`)
                        }}
                      >
                        {t("global.edit")}
                      </Button>
                      <Show when={!UserMethods.is_guest(user)}>
                        <DeletePopover
                          name={user.username}
                          loading={deleting() === user.id}
                          onClick={async () => {
                            const resp = await deleteUser(user.id)
                            handleResp(resp, () => {
                              refresh()
                            })
                          }}
                        />
                      </Show>
                      <Show when={user.otp_secret}>
                        <Button
                          size="sm"
                          loading={cancel_2faId() === user.id}
                          onClick={() => cancel_2fa(user.id)}
                        >
                          {t("users.cancel_2fa")}
                        </Button>
                      </Show>
                    </HStack>
                  </Td>
                </Tr>
              )}
            </For>
          </Tbody>
        </Table>
      </Box>
    </VStack>
  )
}

export default Users