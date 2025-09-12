import { Center, Heading } from "@hope-ui/solid"
import { useManageTitle } from "~/hooks"

const SdnControl = () => {
  useManageTitle("manage.sidemenu.sdn_control")
  return (
    <Center h="$full">
      <Heading>SDN Control</Heading>
    </Center>
  )
}

export default SdnControl