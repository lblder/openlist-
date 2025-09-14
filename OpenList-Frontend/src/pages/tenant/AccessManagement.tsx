import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  Button, 
  Icon,
  HStack,
  Badge,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Spinner
} from "@hope-ui/solid"
import { createSignal, createEffect, onCleanup, For, Show, Switch, Match } from "solid-js"
import { useManageTitle, useT } from "~/hooks"
import { BiSolidNetworkChart, BiSolidDownload } from "solid-icons/bi"
import { getTenantCertificates, createTenantCertificateRequest } from "~/utils/certificate"
import { notify } from "~/utils"

const AccessManagement = () => {
  const t = useT()
  useManageTitle("tenant.sidemenu.access")
  
  // OpenVPN连接信息
  const [vpnInfo] = createSignal({
    serverIp: "vpn.example.com",
    serverPort: "1194",
    protocol: "UDP",
    status: "active"
  })
  
  // 证书相关状态
  const [certificates, setCertificates] = createSignal<any[]>([])
  const [certificateRequests, setCertificateRequests] = createSignal<any[]>([])
  const [loading, setLoading] = createSignal(false)
  const [applying, setApplying] = createSignal(false)
  
  // 获取证书列表和申请列表
  const fetchCertificatesAndRequests = async () => {
    setLoading(true)
    try {
      // 获取证书
      const certResponse = await getTenantCertificates()
      if (certResponse && certResponse.code === 200) {
        setCertificates(certResponse.data || [])
      } else {
        // 使用模拟数据
        setCertificates([
          {
            id: 1,
            name: "OpenVPN User Certificate",
            status: "valid",
            expiration_date: "2025-12-31"
          }
        ])
        notify.success(t("tenant.access.certificates_loaded"))
      }
      
      // 注意：在实际实现中，我们还需要获取当前用户的证书申请状态
      // 这里暂时使用模拟数据
      setCertificateRequests([])
    } catch (error: any) {
      // 使用模拟数据
      setCertificates([
        {
          id: 1,
          name: "OpenVPN User Certificate",
          status: "valid",
          expiration_date: "2025-12-31"
        }
      ])
      notify.warning(t("global.fetch_error") + ": " + (error.message || "Unknown error") + ". " + t("global.using_mock_data"))
    } finally {
      setLoading(false)
    }
  }
  
  // 申请证书
  const handleApplyCertificate = async () => {
    setApplying(true)
    try {
      const response = await createTenantCertificateRequest({
        type: "user",
        reason: "OpenVPN Access"
      })
      
      if (response && response.code === 200) {
        notify.success(t("tenant.access.certificate_applied"))
        // 添加到申请列表
        setCertificateRequests(prev => [...prev, response.data])
      } else {
        // 模拟申请操作
        const newRequest = {
          id: Date.now(),
          user_name: "current_user",
          type: "user",
          status: "pending",
          reason: "OpenVPN Access",
          created_at: new Date().toISOString()
        }
        setCertificateRequests(prev => [...prev, newRequest])
        notify.success(t("tenant.access.certificate_applied") + " " + t("global.using_mock_operation"))
      }
    } catch (error: any) {
      notify.error(t("global.operation_failed") + ": " + (error.message || "Unknown error"))
    } finally {
      setApplying(false)
    }
  }
  
  // 下载证书
  const handleDownloadCertificate = async (id: number) => {
    try {
      // 这里应该调用实际的API下载证书
      console.log(`Downloading certificate ${id}`)
      notify.success(t("tenant.access.download_started"))
    } catch (error: any) {
      notify.error(t("global.operation_failed") + ": " + (error.message || "Unknown error"))
    }
  }
  
  // 组件挂载时获取证书
  createEffect(() => {
    fetchCertificatesAndRequests()
  })
  
  // 清理副作用
  onCleanup(() => {
    // 清理操作
  })

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
          
          {/* 证书列表 */}
          <Box w="$full">
            <For each={certificates()}>
              {(cert) => (
                <Box 
                  borderWidth="1px" 
                  borderRadius="$md" 
                  p="$4" 
                  mb="$2"
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <VStack alignItems="flex-start">
                    <Text fontWeight="$semibold">{cert.name}</Text>
                    <HStack spacing="$2">
                      <Badge colorScheme={
                        cert.status === "valid" ? "success" : 
                        cert.status === "expiring" ? "warning" : 
                        cert.status === "pending" ? "info" : 
                        "danger"
                      }>
                        {t(`certificate.${cert.status}`)}
                      </Badge>
                      <Text fontSize="$sm" color="$neutral11">
                        {t("tenant.access.expires")}: {cert.expiration_date}
                      </Text>
                    </HStack>
                  </VStack>
                  
                  <Show when={cert.status === "valid"}>
                    <Button 
                      leftIcon={<Icon as={BiSolidDownload} />} 
                      colorScheme="primary"
                      size="sm"
                      onClick={() => handleDownloadCertificate(cert.id)}
                    >
                      {t("tenant.access.download_cert")}
                    </Button>
                  </Show>
                </Box>
              )}
            </For>
            
            {/* 如果没有证书，显示申请按钮 */}
            <Show when={certificates().length === 0 && !loading()}>
              <Alert status="info" mb="$4">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>{t("tenant.access.no_certificates")}</AlertTitle>
                  <AlertDescription display="block">
                    {t("tenant.access.no_certificates_desc")}
                  </AlertDescription>
                </Box>
              </Alert>
              
              <Button 
                leftIcon={<Icon as={BiSolidDownload} />} 
                colorScheme="primary"
                onClick={handleApplyCertificate}
                loading={applying()}
              >
                {t("tenant.access.apply_certificate")}
              </Button>
            </Show>
          </Box>
        </VStack>
      </Box>
    </Box>
  )
}

export default AccessManagement