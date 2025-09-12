import { lazy } from "solid-js"
import { Center, Heading } from "@hope-ui/solid"
import { trimLeft } from "~/utils"
import { SideMenuItem, side_menu_items } from "./sidemenu_items"
import { useManageTitle } from "~/hooks"

type Route = Pick<SideMenuItem, "to" | "component">

const Placeholder = (props: { title: string; to: string }) => {
  useManageTitle(props.title)
  return (
    <Center h="$full">
      <Heading>{props.title}</Heading>
    </Center>
  )
}

const get_routes = (items: SideMenuItem[], acc: Route[] = []) => {
  items.forEach((item) => {
    if (item.children) {
      get_routes(item.children, acc)
    } else {
      acc.push({
        to: trimLeft(item.to!, "/@tenant"),
        component:
          item.component ||
          (() => <Placeholder title={item.title} to={item.to || "empty"} />),
      })
    }
  })
  return acc
}

const routes = get_routes(side_menu_items)
export { routes }