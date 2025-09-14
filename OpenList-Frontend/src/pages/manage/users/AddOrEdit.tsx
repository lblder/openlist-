import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  VStack,
} from "@hope-ui/solid"
import { MaybeLoading, FolderChooseInput } from "~/components"
import { useFetch, useRouter, useT, useManageTitle } from "~/hooks"
import { handleResp, notify, r } from "~/utils"
import { PEmptyResp, PResp, User, UserMethods, UserPermissions, UserRole } from "~/types"
import { createStore } from "solid-js/store"
import { For, Show } from "solid-js"
import { Me, me, setMe } from "~/store"

const Permission = (props: {
  name: string
  can: boolean
  onChange: (val: boolean) => void
}) => {
  const t = useT()
  return (
    <FormControl
      display="inline-flex"
      flexDirection="row"
      alignItems="center"
      gap="$2"
      rounded="$md"
      shadow="$md"
      p="$2"
      w="fit-content"
    >
      <FormLabel mb="0">{t(`users.permissions.${props.name}`)}</FormLabel>
      <Checkbox
        checked={props.can}
        onChange={() => props.onChange(!props.can)}
      />
    </FormControl>
  )
}

const AddOrEdit = () => {
  const t = useT()
  const { params, back } = useRouter()
  const { id } = params
  useManageTitle(() => `global.${id ? "edit" : "add"}`)
  const [user, setUser] = createStore<User>({
    id: 0,
    username: "",
    password: "",
    base_path: "",
    role: UserRole.GENERAL,
    permission: 0,
    disabled: false,
    sso_id: "",
    otp_secret: "",
    created_at: "",
    updated_at: "",
  })
  const [userLoading, loadUser] = useFetch(
    (): PResp<User> => r.get(`/admin/user/get?id=${id}`),
  )

  const initEdit = async () => {
    const resp = await loadUser()
    handleResp<User>(resp, setUser)
  }
  if (id) {
    initEdit()
  }
  const [okLoading, ok] = useFetch((): PEmptyResp => {
    return r.post(`/admin/user/${id ? "update" : "create"}`, user)
  })
  return (
    <MaybeLoading loading={userLoading()}>
      <VStack w="$full" alignItems="start" spacing="$2">
        <Heading>{t(`global.${id ? "edit" : "add"}`)}</Heading>
        <Show when={!UserMethods.is_guest(user)}>
          <FormControl w="$full" display="flex" flexDirection="column" required>
            <FormLabel for="username" display="flex" alignItems="center">
              {t(`users.username`)}
            </FormLabel>
            <Input
              id="username"
              value={user.username}
              onInput={(e) => setUser("username", e.currentTarget.value)}
            />
          </FormControl>
          <FormControl w="$full" display="flex" flexDirection="column" required>
            <FormLabel for="password" display="flex" alignItems="center">
              {t(`users.password`)}
              {id && `(${t("users.password-tips")})`}
            </FormLabel>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={user.password}
              onInput={(e) => setUser("password", e.currentTarget.value)}
            />
          </FormControl>
        </Show>

        <FormControl w="$full" display="flex" flexDirection="column" required>
          <FormLabel for="base_path" display="flex" alignItems="center">
            {t(`users.base_path`)}
          </FormLabel>
          <FolderChooseInput
            id="base_path"
            value={user.base_path}
            onChange={(path) => setUser("base_path", path)}
            onlyFolder
          />
        </FormControl>
        
        <Show when={!UserMethods.is_guest(user)}>
          <FormControl w="$full" required>
            <FormLabel for="role" display="flex" alignItems="center">
              {t(`users.role`)}
            </FormLabel>
            <Select
              id="role"
              value={user.role}
              onChange={(e) => setUser("role", Number(e.currentTarget.value))}
            >
              <option value={UserRole.GENERAL}>{t("users.role_general")}</option>
              <option value={UserRole.GUEST}>{t("users.role_guest")}</option>
              <option value={UserRole.ADMIN}>{t("users.role_admin")}</option>
              <option value={UserRole.TENANT}>{t("users.role_tenant")}</option>
            </Select>
          </FormControl>
        </Show>
        
        <FormControl w="$full" required>
          <FormLabel display="flex" alignItems="center">
            {t(`users.permission`)}
          </FormLabel>
          <Flex w="$full" wrap="wrap" gap="$2">
            <For each={UserPermissions}>
              {(item, i) => (
                <Permission
                  name={item}
                  can={UserMethods.can(user, i())}
                  onChange={(val) => {
                    if (val) {
                      setUser("permission", (user.permission |= 1 << i()))
                    } else {
                      setUser("permission", (user.permission &= ~(1 << i())))
                    }
                  }}
                />
              )}
            </For>
          </Flex>
        </FormControl>
        <FormControl w="fit-content" display="flex">
          <Checkbox
            css={{ whiteSpace: "nowrap" }}
            id="disabled"
            onChange={(e: any) => setUser("disabled", e.currentTarget.checked)}
            color="$neutral10"
            fontSize="$sm"
            checked={user.disabled}
          >
            {t(`users.disabled`)}
          </Checkbox>
        </FormControl>
        <Button
          loading={okLoading()}
          onClick={async () => {
            const resp = await ok()
            // TODO maybe can use handleRespWithNotifySuccess
            handleResp(resp, async () => {
              notify.success(t("global.save_success"))
              if (user.username === me().username)
                handleResp(await (r.get("/me") as PResp<Me>), setMe)
              back()
            })
          }}
        >
          {t(`global.${id ? "save" : "add"}`)}
        </Button>
      </VStack>
    </MaybeLoading>
  )
}

export default AddOrEdit