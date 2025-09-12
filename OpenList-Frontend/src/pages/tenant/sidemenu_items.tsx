import { SideMenuItem } from "./SideMenu"
import {
  BsPersonCircle,
  BsHddNetwork,
  BsBucket,
} from "solid-icons/bs"
import { Component, lazy } from "solid-js"
import { Center, Heading } from "@hope-ui/solid"

const Placeholder = (props: { title: string }) => {
  return (
    <Center h="$full">
      <Heading>{props.title}</Heading>
    </Center>
  )
}

export const side_menu_items: SideMenuItem[] = [
  {
    title: "tenant.sidemenu.dashboard",
    icon: BsPersonCircle,
    to: "/@tenant",
    component: lazy(() => import("./Dashboard")),
  },
  {
    title: "tenant.sidemenu.profile",
    icon: BsPersonCircle,
    to: "/@tenant/profile",
    component: lazy(() => import("./Profile")),
  },
  {
    title: "tenant.sidemenu.access",
    icon: BsHddNetwork,
    to: "/@tenant/access",
    component: lazy(() => import("./AccessManagement")),
  },
  {
    title: "tenant.sidemenu.data",
    icon: BsBucket,
    to: "/@tenant/data",
    component: lazy(() => import("./DataManagement")),
  },
]