import {
  Box,
  Button,
  Grid,
  HStack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
  Badge,
  IconButton,
  Icon,
  Switch as HopeSwitch,
  Select,
  SelectContent,
  SelectListbox,
  SelectOption,
  SelectOptionText,
  SelectTrigger,
  SelectValue,
  Text,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Input,
  FormLabel,
  FormControl,
  FormErrorMessage,
  useColorModeValue,
} from "@hope-ui/solid"
import { createMemo, createSignal, For, Show, Switch, Match, Component } from "solid-js"
import { useManageTitle, useT } from "~/hooks"
import { BiSolidDownload, BiSolidTrash, BiSolidEdit, BiSolidPlusCircle } from "solid-icons/bi"
import { FaSolidUser, FaSolidServer } from "solid-icons/fa"
import type { IconTypes } from "solid-icons"
import { createStorageSignal } from "@solid-primitives/storage"

// 证书数据类型
interface Certificate {
  id: number
  name: string
  type: "user" | "node"
  status: "valid" | "expiring" | "revoked"
  owner: string
  expirationDate: string
  issuedDate: string
}

// 模拟数据
const mockCertificates: Certificate[] = [
  {
    id: 1,
    name: "user-certificate-1",
    type: "user",
    status: "valid",
    owner: "john_doe",
    expirationDate: "2024-12-31",
    issuedDate: "2023-01-01",
  },
  {
    id: 2,
    name: "node-certificate-1",
    type: "node",
    status: "expiring",
    owner: "node-001",
    expirationDate: "2023-11-30",
    issuedDate: "2022-01-01",
  },
  {
    id: 3,
    name: "user-certificate-2",
    type: "user",
    status: "revoked",
    owner: "jane_smith",
    expirationDate: "2024-06-30",
    issuedDate: "2022-06-01",
  },
  {
    id: 4,
    name: "node-certificate-2",
    type: "node",
    status: "valid",
    owner: "node-002",
    expirationDate: "2025-01-15",
    issuedDate: "2023-01-15",
  },
  {
    id: 5,
    name: "user-certificate-3",
    type: "user",
    status: "valid",
    owner: "bob_wilson",
    expirationDate: "2024-09-30",
    issuedDate: "2022-09-01",
  },
]

// 证书操作组件
const CertificateOp: Component<{ 
  cert: Certificate; 
  refresh: () => void; 
  onEdit: (cert: Certificate) => void; 
  onDownload: (id: number) => void; 
  onRevoke: (id: number) => void 
}> = (props) => {
  const t = useT()
  
  return (
    <HStack spacing="$2">
      <IconButton
        aria-label={t("certificate.download")}
        icon={<BiSolidDownload />}
        colorScheme="primary"
        size="sm"
        onClick={() => props.onDownload(props.cert.id)}
      />
      <Show when={props.cert.status !== "revoked"}>
        {(certStatus) => (
          <IconButton
            aria-label={t("certificate.update")}
            icon={<BiSolidEdit />}
            colorScheme="accent"
            size="sm"
            onClick={() => props.onEdit(props.cert)}
          />
        )}
      </Show>
      <Show when={props.cert.status !== "revoked"}>
        {(certStatus) => (
          <IconButton
            aria-label={t("certificate.revoke")}
            icon={<BiSolidTrash />}
            colorScheme="danger"
            size="sm"
            onClick={() => props.onRevoke(props.cert.id)}
          />
        )}
      </Show>
    </HStack>
  )
}

// 证书网格项组件
const CertificateGridItem: Component<{ 
  cert: Certificate; 
  refresh: () => void; 
  onEdit: (cert: Certificate) => void; 
  onDownload: (id: number) => void; 
  onRevoke: (id: number) => void 
}> = (props) => {
  const t = useT()
  
  return (
    <VStack
      w="$full"
      spacing="$2"
      rounded="$lg"
      border="1px solid $neutral7"
      background={useColorModeValue("$neutral2", "$neutral3")()}
      p="$3"
      _hover={{
        border: "1px solid $info8",
      }}
    >
      <HStack spacing="$2" justifyContent="space-between" w="$full">
        <Text
          fontWeight="$medium"
          css={{
            wordBreak: "break-all",
          }}
        >
          {props.cert.name}
        </Text>
        <Badge colorScheme={props.cert.status === "valid" ? "success" : props.cert.status === "expiring" ? "warning" : "danger"}>
          {t(`certificate.${props.cert.status}`)}
        </Badge>
      </HStack>
      
      <HStack spacing="$2">
        <Show when={props.cert.type === "user"}>
          {(certType) => (
            <Icon as={FaSolidUser as unknown as IconTypes} />
          )}
        </Show>
        <Show when={props.cert.type === "node"}>
          {(certType) => (
            <Icon as={FaSolidServer as unknown as IconTypes} />
          )}
        </Show>
        <Text>
          {props.cert.type === "user" 
            ? t("certificate.user") 
            : t("certificate.node")}
        </Text>
      </HStack>
      
      <HStack spacing="$2" w="$full" justifyContent="space-between">
        <Text fontWeight="$semibold">{t("certificate.owner")}:</Text>
        <Text css={{ wordBreak: "break-all" }}>{props.cert.owner}</Text>
      </HStack>
      
      <HStack spacing="$2" w="$full" justifyContent="space-between">
        <Text fontWeight="$semibold">{t("certificate.issued_date")}:</Text>
        <Text>{props.cert.issuedDate}</Text>
      </HStack>
      
      <HStack spacing="$2" w="$full" justifyContent="space-between">
        <Text fontWeight="$semibold">{t("certificate.expiration_date")}:</Text>
        <Text>{props.cert.expirationDate}</Text>
      </HStack>
      
      <CertificateOp 
        cert={props.cert} 
        refresh={props.refresh} 
        onEdit={props.onEdit} 
        onDownload={props.onDownload} 
        onRevoke={props.onRevoke} 
      />
    </VStack>
  )
}

// 证书列表项组件
const CertificateListItem: Component<{ 
  cert: Certificate; 
  refresh: () => void; 
  onEdit: (cert: Certificate) => void; 
  onDownload: (id: number) => void; 
  onRevoke: (id: number) => void 
}> = (props) => {
  const t = useT()
  
  return (
    <Tr>
      <Td>{props.cert.name}</Td>
      <Td>
        <HStack spacing="$2">
          <Show when={props.cert.type === "user"}>
            {(certType) => (
              <Icon as={FaSolidUser as unknown as IconTypes} />
            )}
          </Show>
          <Show when={props.cert.type === "node"}>
            {(certType) => (
              <Icon as={FaSolidServer as unknown as IconTypes} />
            )}
          </Show>
          <Text>
            {props.cert.type === "user" 
              ? t("certificate.user") 
              : t("certificate.node")}
          </Text>
        </HStack>
      </Td>
      <Td>{props.cert.owner}</Td>
      <Td>
        <Badge colorScheme={props.cert.status === "valid" ? "success" : props.cert.status === "expiring" ? "warning" : "danger"}>
          {t(`certificate.${props.cert.status}`)}
        </Badge>
      </Td>
      <Td>{props.cert.issuedDate}</Td>
      <Td>{props.cert.expirationDate}</Td>
      <Td>
        <CertificateOp 
          cert={props.cert} 
          refresh={props.refresh} 
          onEdit={props.onEdit} 
          onDownload={props.onDownload} 
          onRevoke={props.onRevoke} 
        />
      </Td>
    </Tr>
  )
}

const CertificateManagement: Component = () => {
  useManageTitle("manage.sidemenu.certificate_management")
  const t = useT()
  
  const [certificates, setCertificates] = createSignal<Certificate[]>(mockCertificates)
  const [filterStatus, setFilterStatus] = createSignal<string>("all")
  const [filterType, setFilterType] = createSignal<string>("all")
  
  // 添加/编辑证书的表单状态
  const [currentCertificate, setCurrentCertificate] = createSignal<Certificate | null>(null)
  const [name, setName] = createSignal<string>("")
  const [type, setType] = createSignal<"user" | "node">("user")
  const [owner, setOwner] = createSignal<string>("")
  const [expirationDate, setExpirationDate] = createSignal<string>("")
  const [issuedDate, setIssuedDate] = createSignal<string>("")
  const [formErrors, setFormErrors] = createSignal<Record<string, string>>({})
  
  const [isOpen, setIsOpen] = createSignal(false)
  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)
  
  // 视图布局状态 (网格或表格)
  const [layout, setLayout] = createStorageSignal(
    "certificates-layout",
    "grid" as "grid" | "table",
  )
  
  // 刷新证书列表（模拟）
  const refresh = () => {
    setCertificates([...mockCertificates])
  }
  
  // 过滤后的证书列表
  const filteredCertificates = createMemo(() => {
    return certificates().filter(cert => {
      const statusMatch = filterStatus() === "all" || cert.status === filterStatus()
      const typeMatch = filterType() === "all" || cert.type === filterType()
      return statusMatch && typeMatch
    })
  })
  
  // 吊销证书（模拟）
  const revokeCertificate = (id: number) => {
    setCertificates(prev => 
      prev.map(cert => 
        cert.id === id ? {...cert, status: "revoked"} : cert
      )
    )
  }
  
  // 更新证书（模拟）
  const updateCertificate = (id: number) => {
    // 模拟证书更新操作
    console.log(`Updating certificate ${id}`)
  }
  
  // 下载证书（模拟）
  const downloadCertificate = (id: number) => {
    // 模拟证书下载操作
    console.log(`Downloading certificate ${id}`)
  }
  
  // 打开添加证书模态框
  const openAddCertificateModal = () => {
    setCurrentCertificate(null)
    setName("")
    setType("user")
    setOwner("")
    setExpirationDate("")
    setIssuedDate("")
    setFormErrors({})
    onOpen()
  }
  
  // 打开编辑证书模态框
  const openEditCertificateModal = (cert: Certificate) => {
    setCurrentCertificate(cert)
    setName(cert.name)
    setType(cert.type)
    setOwner(cert.owner)
    setExpirationDate(cert.expirationDate)
    setIssuedDate(cert.issuedDate)
    setFormErrors({})
    onOpen()
  }
  
  // 验证表单
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!name()) {
      errors.name = t("certificate.name_required") || "Name is required"
    }
    
    if (!owner()) {
      errors.owner = t("certificate.owner_required") || "Owner is required"
    }
    
    if (!expirationDate()) {
      errors.expirationDate = t("certificate.expiration_date_required") || "Expiration date is required"
    }
    
    if (!issuedDate()) {
      errors.issuedDate = t("certificate.issued_date_required") || "Issued date is required"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // 保存证书
  const saveCertificate = () => {
    if (!validateForm()) {
      return
    }
    
    if (currentCertificate()) {
      // 编辑证书
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === currentCertificate()!.id 
            ? {
                ...cert,
                name: name(),
                type: type(),
                owner: owner(),
                expirationDate: expirationDate(),
                issuedDate: issuedDate(),
              }
            : cert
        )
      )
    } else {
      // 添加新证书
      const newCertificate: Certificate = {
        id: Math.max(0, ...certificates().map(c => c.id)) + 1,
        name: name(),
        type: type(),
        status: "valid",
        owner: owner(),
        expirationDate: expirationDate(),
        issuedDate: issuedDate(),
      }
      
      setCertificates(prev => [...prev, newCertificate])
    }
    
    onClose()
  }
  
  return (
    <VStack spacing="$3" alignItems="start" w="$full">
      <HStack 
        spacing="$2" 
        gap="$2" 
        w="$full"
        wrap={{
          "@initial": "wrap",
          "@md": "unset",
        }}
      >
        <Button 
          colorScheme="accent"
          onClick={refresh}
          leftIcon={<BiSolidEdit />}
        >
          {t("global.refresh")}
        </Button>
        <Button
          colorScheme="primary"
          onClick={openAddCertificateModal}
          leftIcon={<BiSolidPlusCircle />}
        >
          {t("global.add")}
        </Button>
        
        <Select 
          value={filterStatus()} 
          onChange={(value: any) => setFilterStatus(value)}
          size="sm"
          w="150px"
        >
          <SelectTrigger>
            <SelectValue placeholder={t("certificate.status_filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectListbox>
              <SelectOption value="all">
                <SelectOptionText>{t("certificate.all_status")}</SelectOptionText>
              </SelectOption>
              <SelectOption value="valid">
                <SelectOptionText>{t("certificate.valid")}</SelectOptionText>
              </SelectOption>
              <SelectOption value="expiring">
                <SelectOptionText>{t("certificate.expiring")}</SelectOptionText>
              </SelectOption>
              <SelectOption value="revoked">
                <SelectOptionText>{t("certificate.revoked")}</SelectOptionText>
              </SelectOption>
            </SelectListbox>
          </SelectContent>
        </Select>
        
        <Select 
          value={filterType()} 
          onChange={(value: any) => setFilterType(value)}
          size="sm"
          w="150px"
        >
          <SelectTrigger>
            <SelectValue placeholder={t("certificate.type_filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectListbox>
              <SelectOption value="all">
                <SelectOptionText>{t("certificate.all_types")}</SelectOptionText>
              </SelectOption>
              <SelectOption value="user">
                <SelectOptionText>{t("certificate.user")}</SelectOptionText>
              </SelectOption>
              <SelectOption value="node">
                <SelectOptionText>{t("certificate.node")}</SelectOptionText>
              </SelectOption>
            </SelectListbox>
          </SelectContent>
        </Select>
        
        <HopeSwitch
          checked={layout() === "table"}
          onChange={(e: Event) => {
            setLayout(
              (e.target as HTMLInputElement).checked ? "table" : "grid",
            )
          }}
        >
          {t("storages.other.table_layout")}
        </HopeSwitch>
      </HStack>
      
      <Switch>
        <Match when={layout() === "grid"}>
          <Grid
            w="$full"
            gap="$2_5"
            templateColumns={{
              "@initial": "1fr",
              "@lg": "repeat(auto-fill, minmax(324px, 1fr))",
            }}
          >
            <For each={filteredCertificates()}>
              {(cert) => (
                <CertificateGridItem 
                  cert={cert} 
                  refresh={refresh} 
                  onEdit={openEditCertificateModal}
                  onDownload={downloadCertificate}
                  onRevoke={revokeCertificate}
                />
              )}
            </For>
          </Grid>
        </Match>
        <Match when={layout() === "table"}>
          <Box w="$full" overflowX="auto">
            <Table dense>
              <Thead>
                <Tr>
                  <Th>{t("certificate.name")}</Th>
                  <Th>{t("certificate.type")}</Th>
                  <Th>{t("certificate.owner")}</Th>
                  <Th>{t("certificate.status")}</Th>
                  <Th>{t("certificate.issued_date")}</Th>
                  <Th>{t("certificate.expiration_date")}</Th>
                  <Th>{t("global.operations")}</Th>
                </Tr>
              </Thead>
              <Tbody>
                <For each={filteredCertificates()}>
                  {(cert) => (
                    <CertificateListItem 
                      cert={cert} 
                      refresh={refresh} 
                      onEdit={openEditCertificateModal}
                      onDownload={downloadCertificate}
                      onRevoke={revokeCertificate}
                    />
                  )}
                </For>
              </Tbody>
            </Table>
          </Box>
        </Match>
      </Switch>
      
      {/* 添加/编辑证书模态框 */}
      <Modal opened={isOpen()} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>
            {currentCertificate() 
              ? t("certificate.edit_certificate") 
              : t("certificate.add_certificate")}
          </ModalHeader>
          <ModalBody>
            <VStack spacing="$4">
              <FormControl invalid={!!formErrors().name}>
                <FormLabel>{t("certificate.name")}</FormLabel>
                <Input
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  placeholder={t("certificate.name_placeholder") || "Enter certificate name"}
                />
                <FormErrorMessage>{formErrors().name}</FormErrorMessage>
              </FormControl>
              
              <FormControl>
                <FormLabel>{t("certificate.type")}</FormLabel>
                <Select
                  value={type()}
                  onChange={(value: any) => setType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectListbox>
                      <SelectOption value="user">
                        <SelectOptionText>{t("certificate.user")}</SelectOptionText>
                      </SelectOption>
                      <SelectOption value="node">
                        <SelectOptionText>{t("certificate.node")}</SelectOptionText>
                      </SelectOption>
                    </SelectListbox>
                  </SelectContent>
                </Select>
              </FormControl>
              
              <FormControl invalid={!!formErrors().owner}>
                <FormLabel>{t("certificate.owner")}</FormLabel>
                <Input
                  value={owner()}
                  onInput={(e) => setOwner(e.currentTarget.value)}
                  placeholder={t("certificate.owner_placeholder") || "Enter owner"}
                />
                <FormErrorMessage>{formErrors().owner}</FormErrorMessage>
              </FormControl>
              
              <HStack spacing="$4" w="$full">
                <FormControl invalid={!!formErrors().issuedDate}>
                  <FormLabel>{t("certificate.issued_date")}</FormLabel>
                  <Input
                    type="date"
                    value={issuedDate()}
                    onInput={(e) => setIssuedDate(e.currentTarget.value)}
                  />
                  <FormErrorMessage>{formErrors().issuedDate}</FormErrorMessage>
                </FormControl>
                
                <FormControl invalid={!!formErrors().expirationDate}>
                  <FormLabel>{t("certificate.expiration_date")}</FormLabel>
                  <Input
                    type="date"
                    value={expirationDate()}
                    onInput={(e) => setExpirationDate(e.currentTarget.value)}
                  />
                  <FormErrorMessage>{formErrors().expirationDate}</FormErrorMessage>
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing="$2">
              <Button onClick={onClose} colorScheme="neutral">
                {t("global.cancel")}
              </Button>
              <Button onClick={saveCertificate} colorScheme="primary">
                {t("global.save")}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}

export default CertificateManagement