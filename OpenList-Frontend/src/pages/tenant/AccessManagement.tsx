import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  Button, 
  Icon,
  HStack,
  Badge
} from "@hope-ui/solid"
import { createSignal } from "solid-js"
import { useManageTitle, useT } from "~/hooks"
import { BiSolidNetworkChart, BiSolidDownload } from "solid-icons/bi"

const AccessManagement = () => {
  const t = useT()
  useManageTitle("tenant.sidemenu.access")
  
  // 模拟OpenVPN连接信息
  const [vpnInfo] = createSignal({
    serverIp: "vpn.example.com",
    serverPort: "1194",
    protocol: "UDP",
    status: "active"
  })
  
  const handleDownloadCertificate = () => {
    // 模拟证书下载功能
    alert(t("tenant.access.download_started"))
  }

  return (
    <Box>
      <Heading mb="$4">{t("tenant.access.title")}</Heading>
      
      <Box borderWidth="1px" borderRadius="$lg" p="$6" mb="$4">
        <HStack spacing="$4" mb="$4">
          <Icon as={BiSolidNetworkChart} boxSize="$8" color="$primary9" />
          <Heading as="h3" size="lg">{t("tenant.access.vpn_info")}</Heading>
        </HStack>
        
        <VStack spacing="$4" alignItems="flex-start">
          <Box>
            <Text fontWeight="$medium" mb="$1">{t("tenant.access.server_ip")}</Text>
            <Text>{vpnInfo().serverIp}</Text>
          </Box>
          
          <Box>
            <Text fontWeight="$medium" mb="$1">{t("tenant.access.server_port")}</Text>
            <Text>{vpnInfo().serverPort}</Text>
          </Box>
          
          <Box>
            <Text fontWeight="$medium" mb="$1">{t("tenant.access.protocol")}</Text>
            <Text>{vpnInfo().protocol}</Text>
          </Box>
          
          <Box>
            <Text fontWeight="$medium" mb="$1">{t("tenant.access.status")}</Text>
            <Badge colorScheme={vpnInfo().status === "active" ? "success" : "danger"}>
              {vpnInfo().status === "active" ? t("tenant.access.active") : t("tenant.access.inactive")}
            </Badge>
          </Box>
        </VStack>
      </Box>
      
      <Box borderWidth="1px" borderRadius="$lg" p="$6">
        <VStack spacing="$4" alignItems="flex-start">
          <Heading as="h3" size="lg" mb="$2">{t("tenant.access.certificates")}</Heading>
          <Text>{t("tenant.access.cert_desc")}</Text>
          <Button 
            leftIcon={<Icon as={BiSolidDownload} />} 
            colorScheme="primary"
            onClick={handleDownloadCertificate}
          >
            {t("tenant.access.download_cert")}
          </Button>
        </VStack>
      </Box>
    </Box>
  )
}

export default AccessManagement