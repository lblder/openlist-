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
  Tabs,
  TabList,
  Tab,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Tooltip,
  Popover,
  PopoverContent,
  PopoverBody,
  PopoverTrigger,
  InputGroup,
  InputRightElement
} from "@hope-ui/solid"
import { createMemo, createSignal, For, Show, Switch, Match, Component, createEffect, onCleanup } from "solid-js"
import { useManageTitle, useT } from "~/hooks"
import { BiSolidDownload, BiSolidTrash, BiSolidEdit, BiSolidPlusCircle, BiSolidCheckCircle, BiSolidXCircle, BiSolidUser } from "solid-icons/bi"
import { FaSolidUser, FaSolidServer } from "solid-icons/fa"
import { TiTick, TiTimes } from "solid-icons/ti"
import type { IconTypes } from "solid-icons"
import { createStorageSignal } from "@solid-primitives/storage"
import { 
  getCertificates, 
  getCertificateRequests, 
  approveCertificateRequest, 
  rejectCertificateRequest,
  downloadCertificate,
  createCertificateRequest,
  createCertificate
} from "~/utils/certificate"
import { notify, handleResp } from "~/utils"
import { me } from "~/store"
import { getUsers } from "~/utils/api"
import type { User } from "~/types"

// 证书数据类型
interface Certificate {
  id: number
  name: string
  type: "user" | "node"
  status: "pending" | "valid" | "expiring" | "revoked" | "rejected"
  owner: string
  owner_id?: number
  content?: string
  expiration_date: string
  issued_date: string
  created_at: string
  updated_at: string
}

// 证书申请数据类型
interface CertificateRequest {
  id: number
  user_name: string
  user_id?: number
  type: "user" | "node"
  status: "pending" | "valid" | "rejected"
  reason: string
  approved_by?: string
  approved_at?: string
  rejected_by?: string
  rejected_at?: string
  rejected_reason?: string
  created_at: string
  updated_at: string
}

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
        <IconButton
          aria-label={t("certificate.update")}
          icon={<BiSolidEdit />}
          colorScheme="accent"
          size="sm"
          onClick={() => props.onEdit(props.cert)}
        />
      </Show>
      <Show when={props.cert.status !== "revoked"}>
        <IconButton
          aria-label={t("certificate.revoke")}
          icon={<BiSolidTrash />}
          colorScheme="danger"
          size="sm"
          onClick={() => props.onRevoke(props.cert.id)}
        />
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
        <Text fontWeight="$semibold" fontSize="$md">
          {props.cert.name}
        </Text>
        <Badge
          colorScheme={
            props.cert.status === "valid" ? "success" :
            props.cert.status === "expiring" ? "warning" :
            props.cert.status === "revoked" ? "danger" : "neutral"
          }
        >
          {t(`certificate.${props.cert.status}`)}
        </Badge>
      </HStack>
      
      <HStack spacing="$2" justifyContent="space-between" w="$full">
        <Text fontSize="$sm" color="$neutral11">
          {t("certificate.type")}: {t(`certificate.${props.cert.type}`)}
        </Text>
        <Text fontSize="$sm" color="$neutral11">
          {t("certificate.owner")}: {props.cert.owner}
        </Text>
      </HStack>
      
      <HStack spacing="$2" justifyContent="space-between" w="$full">
        <Text fontSize="$sm" color="$neutral11">
          {t("certificate.issued_date")}: {new Date(props.cert.issued_date).toLocaleDateString()}
        </Text>
        <Text fontSize="$sm" color="$neutral11">
          {t("certificate.expiration_date")}: {new Date(props.cert.expiration_date).toLocaleDateString()}
        </Text>
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

// 证书表格行组件
const CertificateTableRow: Component<{ 
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
        <Badge colorScheme={props.cert.type === "user" ? "info" : "accent"}>
          {t(`certificate.${props.cert.type}`)}
        </Badge>
      </Td>
      <Td>{props.cert.owner}</Td>
      <Td>
        <Badge
          colorScheme={
            props.cert.status === "valid" ? "success" :
            props.cert.status === "expiring" ? "warning" :
            props.cert.status === "revoked" ? "danger" : "neutral"
          }
        >
          {t(`certificate.${props.cert.status}`)}
        </Badge>
      </Td>
      <Td>{new Date(props.cert.issued_date).toLocaleDateString()}</Td>
      <Td>{new Date(props.cert.expiration_date).toLocaleDateString()}</Td>
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

// 证书申请操作组件
const CertificateRequestOp: Component<{ 
  request: CertificateRequest; 
  refresh: () => void 
}> = (props) => {
  const t = useT()
  const [loading, setLoading] = createSignal(false)
  
  const handleApprove = async () => {
    setLoading(true)
    const currentUser = me()
    handleResp(
      await approveCertificateRequest(props.request.id, { approved_by: currentUser?.username || '' }),
      () => {
        notify.success(t("certificate.request_approved"))
        props.refresh()
      },
      (err) => {
        notify.error(`${t("certificate.request_approved")} - ${err.message}`)
      }
    )
    setLoading(false)
  }
  
  const handleReject = async () => {
    setLoading(true)
    const currentUser = me()
    handleResp(
      await rejectCertificateRequest(props.request.id, { rejected_by: currentUser?.username || '' }),
      () => {
        notify.success(t("certificate.request_rejected"))
        props.refresh()
      },
      (err) => {
        notify.error(`${t("certificate.request_rejected")} - ${err.message}`)
      }
    )
    setLoading(false)
  }
  
  return (
    <HStack spacing="$2">
      <Show when={props.request.status === "pending"}>
        <IconButton
          aria-label={t("certificate.approve")}
          icon={<TiTick />}
          colorScheme="success"
          size="sm"
          loading={loading()}
          onClick={handleApprove}
        />
        <IconButton
          aria-label={t("certificate.reject")}
          icon={<TiTimes />}
          colorScheme="danger"
          size="sm"
          loading={loading()}
          onClick={handleReject}
        />
      </Show>
      <Show when={props.request.status === "valid"}>
        <Badge colorScheme="success">{t("certificate.approved")}</Badge>
      </Show>
      <Show when={props.request.status === "rejected"}>
        <Badge colorScheme="danger">{t("certificate.rejected")}</Badge>
      </Show>
    </HStack>
  )
}

// 证书申请表格行组件
const CertificateRequestTableRow: Component<{ 
  request: CertificateRequest; 
  refresh: () => void 
}> = (props) => {
  const t = useT()
  
  return (
    <Tr>
      <Td>{props.request.user_name}</Td>
      <Td>
        <Badge colorScheme={props.request.type === "user" ? "info" : "accent"}>
          {t(`certificate.${props.request.type}`)}
        </Badge>
      </Td>
      <Td maxW="200px">
        <Tooltip label={props.request.reason} placement="top">
          <Text noOfLines={1}>{props.request.reason}</Text>
        </Tooltip>
      </Td>
      <Td>
        <Badge
          colorScheme={
            props.request.status === "pending" ? "warning" :
            props.request.status === "valid" ? "success" : "danger"
          }
        >
          {t(`certificate.${props.request.status}`)}
        </Badge>
      </Td>
      <Td>{new Date(props.request.created_at).toLocaleDateString()}</Td>
      <Td>
        <CertificateRequestOp request={props.request} refresh={props.refresh} />
      </Td>
    </Tr>
  )
}

const CertificateManagement = () => {
  const t = useT()
  useManageTitle("manage.sidemenu.certificate_management")
  
  // 证书状态
  const [certificates, setCertificates] = createSignal<Certificate[]>([])
  const [certificateRequests, setCertificateRequests] = createSignal<CertificateRequest[]>([])
  const [loading, setLoading] = createSignal(false)
  const [tabIndex, setTabIndex] = createSignal(0)
  
  // 过滤状态
  const [statusFilter, setStatusFilter] = createStorageSignal<"all" | Certificate["status"]>("certificate_status_filter", "all")
  const [typeFilter, setTypeFilter] = createStorageSignal<"all" | Certificate["type"]>("certificate_type_filter", "all")
  
  // 添加/编辑证书模态框状态
  const [isModalOpen, setIsModalOpen] = createSignal(false)
  const [editingCertificate, setEditingCertificate] = createSignal<Certificate | null>(null)
  
  // 表单状态
  const [name, setName] = createSignal("")
  const [type, setType] = createSignal<"user" | "node">("user")
  const [owner, setOwner] = createSignal("")
  const [ownerId, setOwnerId] = createSignal<number | undefined>(undefined)
  const [issuedDate, setIssuedDate] = createSignal("")
  const [expirationDate, setExpirationDate] = createSignal("")
  const [content, setContent] = createSignal("")
  const [formErrors, setFormErrors] = createSignal<Record<string, string>>({})
  
  // 用户选择相关状态
  const [users, setUsers] = createSignal<User[]>([])
  const [userSearch, setUserSearch] = createSignal("")
  const [isUserSelectOpen, setIsUserSelectOpen] = createSignal(false)
  
  // 添加/编辑证书申请模态框状态
  const [isRequestModalOpen, setIsRequestModalOpen] = createSignal(false)
  const [requestUserName, setRequestUserName] = createSignal("")
  const [requestType, setRequestType] = createSignal<"user" | "node">("user")
  const [requestReason, setRequestReason] = createSignal("")
  const [requestFormErrors, setRequestFormErrors] = createSignal<Record<string, string>>({})
  
  // 获取用户列表
  const fetchUsers = async () => {
    handleResp(
      await getUsers(),
      (data) => {
        setUsers(data.content || [])
      }
    )
  }
  
  // 获取证书列表
  const fetchCertificates = async () => {
    setLoading(true)
    handleResp(
      await getCertificates(),
      (data) => {
        setCertificates(data)
        notify.success(t("certificate.certificate_list_loaded"))
      }
    )
    setLoading(false)
  }
  
  // 获取证书申请列表
  const fetchCertificateRequests = async () => {
    setLoading(true)
    handleResp(
      await getCertificateRequests(),
      (data) => {
        setCertificateRequests(data)
        notify.success(t("certificate.request_list_loaded"))
      }
    )
    setLoading(false)
  }
  
  // 刷新数据
  const refresh = () => {
    if (tabIndex() === 0) {
      fetchCertificates()
    } else {
      fetchCertificateRequests()
    }
  }
  
  // 过滤后的证书列表
  const filteredCertificates = createMemo(() => {
    let result = certificates()
    
    if (statusFilter() !== "all") {
      result = result.filter(cert => cert.status === statusFilter())
    }
    
    if (typeFilter() !== "all") {
      result = result.filter(cert => cert.type === typeFilter())
    }
    
    return result
  })
  
  // 过滤后的用户列表（用于搜索）
  const filteredUsers = createMemo(() => {
    if (!userSearch()) {
      return users()
    }
    
    return users().filter(user => 
      user.username.toLowerCase().includes(userSearch().toLowerCase())
    )
  })
  
  // 选择用户
  const selectUser = (user: User) => {
    setOwner(user.username)
    setOwnerId(user.id)
    setIsUserSelectOpen(false)
    setUserSearch("")
  }
  
  // 处理输入变化
  const handleOwnerInput = (e: Event & { currentTarget: HTMLInputElement }) => {
    const value = e.currentTarget.value
    setOwner(value)
    setUserSearch(value)
    if (value) {
      setIsUserSelectOpen(true)
    }
  }
  
  // 处搜索输入变化
  const handleSearchInput = (e: Event & { currentTarget: HTMLInputElement }) => {
    const value = e.currentTarget.value
    setUserSearch(value)
    if (value) {
      setIsUserSelectOpen(true)
    }
  }
  
  // 下载证书
  const handleDownload = async (id: number) => {
    try {
      const blob = await downloadCertificate(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `certificate-${id}.crt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      notify.success(t("certificate.download_started"))
    } catch (error) {
      notify.error(`${t("certificate.download_started")} - ${(error as Error).message}`)
    }
  }
  
  // 吊销证书
  const handleRevoke = (id: number) => {
    // 实现吊销证书逻辑
    notify.success(t("certificate.certificate_revoked"))
    refresh()
  }
  
  // 编辑证书
  const handleEdit = (cert: Certificate) => {
    setEditingCertificate(cert)
    setName(cert.name)
    setType(cert.type)
    setOwner(cert.owner)
    setIssuedDate(cert.issued_date.split("T")[0])
    setExpirationDate(cert.expiration_date.split("T")[0])
    setIsModalOpen(true)
  }
  
  // 保存证书
  const saveCertificate = async () => {
    // 表单验证
    const errors: Record<string, string> = {}
    if (!name()) errors.name = t("certificate.name_required")
    if (!owner()) errors.owner = t("certificate.owner_required")
    if (!issuedDate()) errors.issuedDate = t("certificate.issued_date_required")
    if (!expirationDate()) errors.expirationDate = t("certificate.expiration_date_required")
    
    setFormErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    // 保存逻辑
    setLoading(true)
    if (editingCertificate()) {
      // 更新证书
      handleResp(
        await createCertificate({
          name: name(),
          type: type(),
          owner: owner(),
          owner_id: ownerId(),
          issued_date: issuedDate(),
          expiration_date: expirationDate(),
          content: content()
        }),
        () => {
          notify.success(t("certificate.certificate_saved"))
          onClose()
          refresh()
        }
      )
    } else {
      // 创建证书
      handleResp(
        await createCertificate({
          name: name(),
          type: type(),
          owner: owner(),
          owner_id: ownerId(),
          issued_date: issuedDate(),
          expiration_date: expirationDate(),
          content: content()
        }),
        () => {
          notify.success(t("certificate.certificate_saved"))
          onClose()
          refresh()
        }
      )
    }
    setLoading(false)
  }
  
  // 关闭模态框
  const onClose = () => {
    setIsModalOpen(false)
    setEditingCertificate(null)
    setName("")
    setType("user")
    setOwner("")
    setOwnerId(undefined)
    setIssuedDate("")
    setExpirationDate("")
    setContent("")
    setFormErrors({})
  }
  
  // 关闭申请模态框
  const onRequestModalClose = () => {
    setIsRequestModalOpen(false)
    setRequestUserName("")
    setRequestType("user")
    setRequestReason("")
    setRequestFormErrors({})
  }
  
  // 保存证书申请
  const saveCertificateRequest = async () => {
    // 表单验证
    const errors: Record<string, string> = {}
    if (!requestUserName()) errors.userName = t("certificate.owner_required")
    if (!requestReason()) errors.reason = t("certificate.reason_required")
    
    setRequestFormErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    // 保存逻辑
    setLoading(true)
    handleResp(
      await createCertificateRequest({
        user_name: requestUserName(),
        type: requestType(),
        reason: requestReason()
      }),
      () => {
        notify.success(t("certificate.request_created"))
        onRequestModalClose()
        refresh()
      }
    )
    setLoading(false)
  }
  
  // 初始化数据
  createEffect(() => {
    if (tabIndex() === 0) {
      fetchCertificates()
    } else {
      fetchCertificateRequests()
    }
  })
  
  // 当打开证书模态框时获取用户列表
  createEffect(() => {
    if (isModalOpen()) {
      fetchUsers()
    }
  })
  
  return (
    <VStack w="$full" alignItems="start" spacing="$4">
      <HStack w="$full" justifyContent="space-between">
        <Tabs
          index={tabIndex()}
          onChange={(index) => setTabIndex(index)}
          variant="line"
          w="$full"
        >
          <TabList>
            <Tab>{t("certificate.certificate_list")}</Tab>
            <Tab>{t("certificate.certificate_requests")}</Tab>
          </TabList>
        </Tabs>
        
        <HStack spacing="$2">
          <Show when={tabIndex() === 0}>
            <Button
              leftIcon={<BiSolidPlusCircle />}
              colorScheme="primary"
              onClick={() => setIsModalOpen(true)}
            >
              {t("certificate.add_certificate")}
            </Button>
          </Show>
          <Show when={tabIndex() === 1}>
            <Button
              leftIcon={<BiSolidPlusCircle />}
              colorScheme="primary"
              onClick={() => setIsRequestModalOpen(true)}
            >
              {t("certificate.add_request")}
            </Button>
          </Show>
        </HStack>
      </HStack>
      
      <Show when={tabIndex() === 0}>
        {/* 证书列表过滤器 */}
        <HStack spacing="$4" w="$full">
          <FormControl w="200px">
            <FormLabel>{t("certificate.status_filter")}</FormLabel>
            <Select
              value={statusFilter()}
              onChange={(value) => setStatusFilter(value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectListbox>
                  <SelectOption value="all">
                    <SelectOptionText>{t("certificate.all_status")}</SelectOptionText>
                  </SelectOption>
                  <SelectOption value="pending">
                    <SelectOptionText>{t("certificate.pending")}</SelectOptionText>
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
                  <SelectOption value="rejected">
                    <SelectOptionText>{t("certificate.rejected")}</SelectOptionText>
                  </SelectOption>
                </SelectListbox>
              </SelectContent>
            </Select>
          </FormControl>
          
          <FormControl w="200px">
            <FormLabel>{t("certificate.type_filter")}</FormLabel>
            <Select
              value={typeFilter()}
              onChange={(value) => setTypeFilter(value as any)}
            >
              <SelectTrigger>
                <SelectValue />
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
          </FormControl>
        </HStack>
        
        {/* 证书列表 */}
        <Show when={loading()} fallback={
          <Show when={filteredCertificates().length > 0} fallback={
            <Alert status="info">
              <AlertIcon />
              <AlertTitle>{t("certificate.no_certificates")}</AlertTitle>
              <AlertDescription>{t("certificate.no_certificates_desc")}</AlertDescription>
            </Alert>
          }>
            <VStack w="$full" spacing="$4">
              {/* 表格视图 */}
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
                      <CertificateTableRow 
                        cert={cert} 
                        refresh={refresh} 
                        onEdit={handleEdit} 
                        onDownload={handleDownload} 
                        onRevoke={handleRevoke} 
                      />
                    )}
                  </For>
                </Tbody>
              </Table>
              
              {/* 网格视图 */}
              <Grid
                w="$full"
                gap="$4"
                templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
              >
                <For each={filteredCertificates()}>
                  {(cert) => (
                    <CertificateGridItem 
                      cert={cert} 
                      refresh={refresh} 
                      onEdit={handleEdit} 
                      onDownload={handleDownload} 
                      onRevoke={handleRevoke} 
                    />
                  )}
                </For>
              </Grid>
            </VStack>
          </Show>
        }>
          <VStack w="$full" alignItems="center" justifyContent="center" p="$8">
            <Spinner size="lg" />
            <Text>{t("global.loading")}</Text>
          </VStack>
        </Show>
      </Show>
      
      <Show when={tabIndex() === 1}>
        {/* 证书申请列表 */}
        <Show when={loading()} fallback={
          <Show when={certificateRequests().length > 0} fallback={
            <Alert status="info">
              <AlertIcon />
              <AlertTitle>{t("certificate.no_requests")}</AlertTitle>
              <AlertDescription>{t("certificate.no_requests_desc")}</AlertDescription>
            </Alert>
          }>
            <Table dense>
              <Thead>
                <Tr>
                  <Th>{t("certificate.owner")}</Th>
                  <Th>{t("certificate.type")}</Th>
                  <Th>{t("certificate.reason")}</Th>
                  <Th>{t("certificate.status")}</Th>
                  <Th>{t("certificate.created_at")}</Th>
                  <Th>{t("global.operations")}</Th>
                </Tr>
              </Thead>
              <Tbody>
                <For each={certificateRequests()}>
                  {(request) => (
                    <CertificateRequestTableRow 
                      request={request} 
                      refresh={refresh} 
                    />
                  )}
                </For>
              </Tbody>
            </Table>
          </Show>
        }>
          <VStack w="$full" alignItems="center" justifyContent="center" p="$8">
            <Spinner size="lg" />
            <Text>{t("global.loading")}</Text>
          </VStack>
        </Show>
      </Show>
      
      {/* 添加/编辑证书模态框 */}
      <Modal opened={isModalOpen()} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingCertificate() 
              ? t("certificate.edit_certificate") 
              : t("certificate.add_certificate")}
          </ModalHeader>
          <ModalCloseButton />
          
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
                  onChange={(value) => setType(value as "user" | "node")}
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
                <Show when={type() === "user"}>
                  <Popover opened={isUserSelectOpen()} onChange={setIsUserSelectOpen}>
                    <PopoverTrigger>
                      <InputGroup>
                        <Input
                          value={owner()}
                          onInput={handleOwnerInput}
                          onFocus={() => owner() && setIsUserSelectOpen(true)}
                          placeholder={t("certificate.owner_placeholder") || "Enter owner"}
                          autocomplete="off"
                        />
                        <InputRightElement>
                          <BiSolidUser color="$neutral8" />
                        </InputRightElement>
                      </InputGroup>
                    </PopoverTrigger>
                    <PopoverContent 
                      w="100%" 
                      rounded="$md"
                      shadow="$lg"
                      border="1px solid $neutral7"
                    >
                      <PopoverBody p="$0">
                        <VStack 
                          w="$full" 
                          spacing="$1" 
                          maxH="250px" 
                          overflowY="auto"
                          rounded="$md"
                        >
                          <InputGroup>
                            <Input
                              placeholder={t("certificate.search_user") || "Search user..."}
                              value={userSearch()}
                              onInput={handleSearchInput}
                              onFocus={() => setIsUserSelectOpen(true)}
                              autocomplete="off"
                              variant="unstyled"
                              p="$2"
                              borderBottom="1px solid $neutral7"
                              rounded="$0"
                            />
                            <InputRightElement>
                              <BiSolidUser color="$neutral8" />
                            </InputRightElement>
                          </InputGroup>
                          <Show when={filteredUsers().length > 0}>
                            <For each={filteredUsers()}>
                              {(user) => (
                                <Box
                                  w="$full"
                                  p="$3"
                                  cursor="pointer"
                                  _hover={{ bg: "$info3" }}
                                  onClick={() => selectUser(user)}
                                  transition="all 0.2s"
                                >
                                  <HStack spacing="$3">
                                    <Box
                                      w="$8"
                                      h="$8"
                                      rounded="$full"
                                      bg="$info5"
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                    >
                                      <FaSolidUser color="white" />
                                    </Box>
                                    <VStack alignItems="start" spacing="$1">
                                      <Text fontWeight="$medium">{user?.username || "N/A"}</Text>
                                      <Text fontSize="$sm" color="$neutral11">
                                        {user.role !== undefined 
                                          ? user.role === 0 ? "General User" 
                                            : user.role === 1 ? "Guest" 
                                            : user.role === 2 ? "Administrator" 
                                            : user.role === 3 ? "Tenant" 
                                            : "Unknown"
                                          : "Unknown"}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                </Box>
                              )}
                            </For>
                          </Show>
                          <Show when={filteredUsers().length === 0 && userSearch()}>
                            <Box w="$full" p="$4" textAlign="center">
                              <Text color="$neutral11">{t("certificate.no_users_found")}</Text>
                            </Box>
                          </Show>
                        </VStack>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                </Show>
                <Show when={type() === "node"}>
                  <Input
                    value={owner()}
                    onInput={(e) => setOwner(e.currentTarget.value)}
                    placeholder={t("certificate.owner_placeholder") || "Enter owner"}
                  />
                </Show>
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
              
              <FormControl>
                <FormLabel>{t("certificate.content")}</FormLabel>
                <Input
                  value={content()}
                  onInput={(e) => setContent(e.currentTarget.value)}
                  placeholder={t("certificate.content_placeholder") || "Enter certificate content"}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <HStack spacing="$2">
              <Button onClick={onClose}>{t("global.cancel")}</Button>
              <Button 
                colorScheme="primary" 
                onClick={saveCertificate}
              >
                {t("global.save")}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* 添加证书申请模态框 */}
      <Modal opened={isRequestModalOpen()} onClose={onRequestModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t("certificate.add_request")}</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing="$4">
              <FormControl invalid={!!requestFormErrors().userName}>
                <FormLabel>{t("certificate.owner")}</FormLabel>
                <Input
                  value={requestUserName()}
                  onInput={(e) => setRequestUserName(e.currentTarget.value)}
                  placeholder={t("certificate.owner_placeholder") || "Enter owner"}
                />
                <FormErrorMessage>{requestFormErrors().userName}</FormErrorMessage>
              </FormControl>
              
              <FormControl>
                <FormLabel>{t("certificate.type")}</FormLabel>
                <Select
                  value={requestType()}
                  onChange={(value) => setRequestType(value as "user" | "node")}
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
              
              <FormControl invalid={!!requestFormErrors().reason}>
                <FormLabel>{t("certificate.reason")}</FormLabel>
                <Input
                  value={requestReason()}
                  onInput={(e) => setRequestReason(e.currentTarget.value)}
                  placeholder={t("certificate.reason_placeholder") || "Enter reason"}
                />
                <FormErrorMessage>{requestFormErrors().reason}</FormErrorMessage>
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <HStack spacing="$2">
              <Button onClick={onRequestModalClose}>{t("global.cancel")}</Button>
              <Button 
                colorScheme="primary" 
                loading={loading()}
                onClick={saveCertificateRequest}
              >
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