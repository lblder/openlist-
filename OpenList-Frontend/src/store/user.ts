import { createSignal } from "solid-js"
import { User, UserMethods, UserPermissions } from "~/types"

export type Me = User & { otp: boolean }

// 创建一个默认的空用户对象
const defaultUser: Me = {
  id: 0,
  username: "",
  password: "",
  base_path: "",
  role: 0,
  disabled: false,
  permission: 0,
  otp_secret: "",
  sso_id: "",
  created_at: "",
  updated_at: "",
  otp: false
}

const [me, setMe] = createSignal<Me>(defaultUser)

type Permission = (typeof UserPermissions)[number]
export const userCan = (p: Permission) => {
  const u = me()
  return UserMethods.can(u, UserPermissions.indexOf(p))
}

export { me, setMe, defaultUser }