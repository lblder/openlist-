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
import type { SelectProps } from "@hope-ui/solid/dist/components/select/select"
import { createMemo, createSignal, For, Show, Switch, Match, Component, createEffect, onCleanup } from "solid-js"
import { useManageTitle, useT, useFetch } from "~/hooks"
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
  createCertificate,
  revokeCertificate,
  updateCertificate,
  deleteCertificate
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

const CertificateManagement: Component = () => {
  const t = useT()
  useManageTitle("certificate.title")
  
  // 证书列表相关状态
  const [certificates, setCertificates] = createSignal<Certificate[]>([])
  const [certificateRequests, setCertificateRequests] = createSignal<CertificateRequest[]>([])
  const [users, setUsers] = createSignal<User[]>([])
  const [loading, data] = useFetch(getCertificates)
  const [, requestsData] = useFetch(getCertificateRequests)
  const [, usersData] = useFetch(getUsers)
  const [filterStatus, setFilterStatus] = createSignal<string>("all")
  const [filterType, setFilterType] = createSignal<string>("all")
  const [search, setSearch] = createSignal<string>("")
  const [layout, setLayout] = createStorageSignal<"grid" | "table">("certificate-layout", "grid")
  
  // 添加/编辑证书模态框相关状态
  const [isOpen, setIsOpen] = createSignal(false)
  const [currentCertificate, setCurrentCertificate] = createSignal<Certificate | null>(null)
  const [name, setName] = createSignal("")
  const [type, setType] = createSignal<"user" | "node">("user")
  const [owner, setOwner] = createSignal("")
  const [issuedDate, setIssuedDate] = createSignal("")
  const [expirationDate, setExpirationDate] = createSignal("")
  const [content, setContent] = createSignal("")
  const [formErrors, setFormErrors] = createSignal<Record<string, string>>({})
  
  // 用户选择相关状态
  const [userSearch, setUserSearch] = createSignal("")
  const [isUserSelectOpen, setIsUserSelectOpen] = createSignal(false)
  
  // 获取用户列表
  const fetchUsers = async () => {
    handleResp<any>(
      await getUsers(),
      (data: any) => {
        setUsers(data.content || [])
      }
    )
  }
  
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
    setIsUserSelectOpen(false)
    setUserSearch("")
  }
  
  // 处理所有者输入变化
  const handleOwnerInput = (e: Event & { currentTarget: HTMLInputElement }) => {
    const value = e.currentTarget.value
    setOwner(value)
    setUserSearch(value)
    if (value) {
      setIsUserSelectOpen(true)
    }
  }
  
  // 处理搜索输入变化
  const handleSearchInput = (e: Event & { currentTarget: HTMLInputElement }) => {
    const value = e.currentTarget.value
    setUserSearch(value)
    if (value) {
      setIsUserSelectOpen(true)
    }
  }
  
  // 处理证书申请所有者输入变化
  const handleRequestOwnerInput = (e: Event & { currentTarget: HTMLInputElement }) => {
    const value = e.currentTarget.value
    setRequestUserName(value)
    setUserSearch(value)
    if (value) {
      setIsUserSelectOpen(true)
    }
  }
  
  // 选择证书申请用户
  const selectRequestUser = (user: User) => {
    setRequestUserName(user.username)
    setIsUserSelectOpen(false)
    setUserSearch("")
  }
  
  // 证书申请模态框相关状态
  const [isRequestModalOpen, setIsRequestModalOpen] = createSignal(false)
  const [requestUserName, setRequestUserName] = createSignal("")
  const [requestType, setRequestType] = createSignal<"user" | "node">("user")
  const [requestReason, setRequestReason] = createSignal("")
  const [requestFormErrors, setRequestFormErrors] = createSignal<Record<string, string>>({})
  
  // 刷新数据
  const refresh = async () => {
    const certResult = await data()
    handleResp(certResult, (data: any) => setCertificates(data.content || []))
    
    const requestResult = await requestsData()
    handleResp(requestResult, (data: any) => setCertificateRequests(data.content || []))
    
    const userResult = await usersData()
    handleResp(userResult, (data: any) => setUsers(data.content || []))
  }
  
  // 初始化数据
  createEffect(() => {
    refresh()
  })
  
  // 过滤证书
  const filteredCertificates = createMemo(() => {
    return certificates().filter(cert => {
      const matchesStatus = filterStatus() === "all" || cert.status === filterStatus()
      const matchesType = filterType() === "all" || cert.type === filterType()
      const matchesSearch = !search() || 
        cert.name.toLowerCase().includes(search().toLowerCase()) ||
        cert.owner.toLowerCase().includes(search().toLowerCase())
      return matchesStatus && matchesType && matchesSearch
    })
  })
  
  // 打开添加证书模态框
  const openAddCertificateModal = () => {
    setCurrentCertificate(null)
    setName("")
    setType("user")
    setOwner("")
    setIssuedDate("")
    setExpirationDate("")
    setContent("")
    setFormErrors({})
    setIsOpen(true)
  }
  
  // 打开编辑证书模态框
  const openEditCertificateModal = (cert: Certificate) => {
    setCurrentCertificate(cert)
    setName(cert.name)
    setType(cert.type)
    setOwner(cert.owner)
    setIssuedDate(cert.issued_date)
    setExpirationDate(cert.expiration_date)
    setContent(cert.content || "")
    setFormErrors({})
    setIsOpen(true)
  }
  
  // 关闭模态框
  const onClose = () => {
    setIsOpen(false)
  }
  
  // 表单验证
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!name()) {
      errors.name = t("certificate.name_required")
    }
    
    if (!owner()) {
      errors.owner = t("certificate.owner_required")
    }
    
    if (!issuedDate()) {
      errors.issuedDate = t("certificate.issued_date_required")
    }
    
    if (!expirationDate()) {
      errors.expirationDate = t("certificate.expiration_date_required")
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // 保存证书
  const saveCertificate = async () => {
    if (!validateForm()) return
    
    const certData = {
      name: name(),
      type: type(),
      owner: owner(),
      owner_id: users().find(u => u.username === owner())?.id,
      issued_date: issuedDate(),
      expiration_date: expirationDate(),
      content: content()
    }
    
    let result
    if (currentCertificate()) {
      // 更新证书
      result = await updateCertificate(currentCertificate()!.id, certData)
    } else {
      // 创建证书
      result = await createCertificate(certData)
    }
    
    handleResp(
      result as any,
      () => {
        notify.success(t("certificate.certificate_saved"))
        onClose()
        refresh()
      }
    )
  }
  
  // 删除证书
  const deleteCert = async (id: number) => {
    const result = await deleteCertificate(id)
    handleResp(
      result as any,
      () => {
        notify.success(t("certificate.certificate_deleted"))
        refresh()
      }
    )
  }
  
  // 吊销证书
  const handleRevokeCertificate = async (id: number) => {
    const result = await revokeCertificate(id)
    handleResp(
      result as any,
      () => {
        notify.success(t("certificate.certificate_revoked"))
        refresh()
      },
      (err) => {
        notify.error(`${t("certificate.certificate_revoked")} - ${err}`)
      }
    )
  }
  
  // 下载证书
  const handleDownloadCertificate = async (id: number) => {
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
    } catch (error: any) {
      notify.error(`${t("certificate.download_started")} - ${error.message}`)
    }
  }
  
  // 打开添加证书申请模态框
  const openAddRequestModal = () => {
    setRequestUserName("")
    setRequestType("user")
    setRequestReason("")
    setRequestFormErrors({})
    setIsRequestModalOpen(true)
  }
  
  // 关闭证书申请模态框
  const onRequestModalClose = () => {
    setIsRequestModalOpen(false)
  }
  
  // 验证证书申请表单
  const validateRequestForm = () => {
    const errors: Record<string, string> = {}
    
    if (!requestUserName()) {
      errors.userName = t("certificate.owner_required")
    }
    
    if (!requestReason()) {
      errors.reason = t("certificate.reason_required")
    }
    
    setRequestFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // 创建证书申请
  const createRequest = async () => {
    if (!validateRequestForm()) return
    
    const requestData = {
      user_name: requestUserName(),
      type: requestType(),
      reason: requestReason()
    }
    
    const result = await createCertificate(requestData)
    handleResp(
      result as any,
      () => {
        notify.success(t("certificate.request_created"))
        onRequestModalClose()
        refresh()
      }
    )
  }
  
  // 批准证书申请
  const approveRequest = async (id: number) => {
    const result = await approveCertificateRequest(id, { approved_by: me().username })
    handleResp(
      result as any,
      () => {
        notify.success(t("certificate.request_approved"))
        refresh()
      }
    )
  }
  
  // 拒绝证书申请
  const rejectRequest = async (id: number, reason?: string) => {
    const result = await rejectCertificateRequest(id, { 
      rejected_by: me().username, 
      rejected_reason: reason 
    })
    handleResp(
      result as any,
      () => {
        notify.success(t("certificate.request_rejected"))
        refresh()
      }
    )
  }
  
  // 证书网格项组件
  const CertificateGridItem: Component<{ cert: Certificate; refresh: () => void; onEdit: (cert: Certificate) => void; onDownload: (id: number) => void; onRevoke: (id: number) => void }> = (props) => {
    return (
      <Box 
        p="$4" 
        border="1px solid $neutral7" 
        rounded="$md"
        _hover={{ borderColor: "$primary7" }}
      >
        <VStack spacing="$3" alignItems="start">
          <HStack justifyContent="space-between" w="$full">
            <Text fontWeight="$semibold" noOfLines={1}>
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
          
          <HStack spacing="$2">
            {props.cert.type === "user" && (
              <Icon as={FaSolidUser as any} color="white" />
            )}
            {props.cert.type === "node" && (
              <Icon as={FaSolidServer as any} color="white" />
            )}
          </HStack>
          
          <Text fontSize="$sm" noOfLines={1}>
            {t("certificate.owner")}: {props.cert.owner}
          </Text>
          
          <HStack spacing="$2" w="$full">
            <Text fontSize="$sm">
              {new Date(props.cert.issued_date).toLocaleDateString()}
            </Text>
            <Text fontSize="$sm" color="$neutral11">
              →
            </Text>
            <Text fontSize="$sm">
              {new Date(props.cert.expiration_date).toLocaleDateString()}
            </Text>
          </HStack>
          
          <HStack spacing="$2" w="$full" justifyContent="flex-end">
            <IconButton
              aria-label={t("certificate.download")}
              icon={<BiSolidDownload />}
              colorScheme="primary"
              size="sm"
              onClick={() => props.onDownload(props.cert.id)}
            />
            {props.cert.status !== "revoked" && (
              <IconButton
                aria-label={t("certificate.update")}
                icon={<BiSolidEdit />}
                colorScheme="accent"
                size="sm"
                onClick={() => props.onEdit(props.cert)}
              />
            )}
            {props.cert.status !== "revoked" && (
              <IconButton
                aria-label={t("certificate.revoke")}
                icon={<BiSolidTrash />}
                colorScheme="danger"
                size="sm"
                onClick={() => props.onRevoke(props.cert.id)}
              />
            )}
          </HStack>
        </VStack>
      </Box>
    )
  }
  
  // 证书列表项组件
  const CertificateListItem: Component<{ cert: Certificate; refresh: () => void; onEdit: (cert: Certificate) => void; onDownload: (id: number) => void; onRevoke: (id: number) => void }> = (props) => {
    return (
      <Tr>
        <Td>{props.cert.name}</Td>
        <Td>
          <HStack spacing="$2">
            {props.cert.type === "user" && (
              <Icon as={FaSolidUser as any as IconTypes} />
            )}
            {props.cert.type === "node" && (
              <Icon as={FaSolidServer as any as IconTypes} />
            )}
            <Text>
              {props.cert.type === "user" 
                ? t("certificate.user") 
                : t("certificate.node")}
            </Text>
          </HStack>
        </Td>
        <Td>
          <HStack spacing="$2">
            <Icon as={FaSolidUser as any as IconTypes} />
            <Text>{props.cert.owner}</Text>
          </HStack>
        </Td>
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
          <HStack spacing="$2">
            <IconButton
              aria-label={t("certificate.download")}
              icon={<BiSolidDownload />}
              colorScheme="primary"
              size="sm"
              onClick={() => props.onDownload(props.cert.id)}
            />
            {props.cert.status !== "revoked" && (
              <IconButton
                aria-label={t("certificate.update")}
                icon={<BiSolidEdit />}
                colorScheme="accent"
                size="sm"
                onClick={() => props.onEdit(props.cert)}
              />
            )}
            {props.cert.status !== "revoked" && (
              <IconButton
                aria-label={t("certificate.revoke")}
                icon={<BiSolidTrash />}
                colorScheme="danger"
                size="sm"
                onClick={() => props.onRevoke(props.cert.id)}
              />
            )}
          </HStack>
        </Td>
      </Tr>
    )
  }
  
  // 证书操作组件
  const CertificateOp: Component<{ cert: Certificate; refresh: () => void; onEdit: (cert: Certificate) => void; onDownload: (id: number) => void; onRevoke: (id: number) => void }> = (props) => {
    return (
      <HStack spacing="$2">
        <IconButton
          aria-label={t("certificate.download")}
          icon={<BiSolidDownload />}
          colorScheme="primary"
          size="sm"
          onClick={() => props.onDownload(props.cert.id)}
        />
        {props.cert.status !== "revoked" && (
          <IconButton
            aria-label={t("certificate.update")}
            icon={<BiSolidEdit />}
            colorScheme="accent"
            size="sm"
            onClick={() => props.onEdit(props.cert)}
          />
        )}
        {props.cert.status !== "revoked" && (
          <IconButton
            aria-label={t("certificate.revoke")}
            icon={<BiSolidTrash />}
            colorScheme="danger"
            size="sm"
            onClick={() => props.onRevoke(props.cert.id)}
          />
        )}
      </HStack>
    )
  }
  
  // 证书申请操作组件
  const CertificateRequestOp: Component<{ request: CertificateRequest; refresh: () => void }> = (props) => {
    const [rejectReason, setRejectReason] = createSignal("")
    const [showRejectPopover, setShowRejectPopover] = createSignal(false)
    
    return (
      <HStack spacing="$2">
        {props.request.status === "pending" && (
          <>
            <IconButton
              aria-label={t("certificate.approve")}
              icon={<BiSolidCheckCircle />}
              colorScheme="success"
              size="sm"
              onClick={() => approveRequest(props.request.id)}
            />
            {/* 简化拒绝操作，移除Popover */}
            <IconButton
              aria-label={t("certificate.reject")}
              icon={<BiSolidXCircle />}
              colorScheme="danger"
              size="sm"
              onClick={() => {
                const reason = window.prompt(t("certificate.reject_reason"))
                if (reason !== null) {
                  rejectRequest(props.request.id, reason)
                }
              }}
            />
          </>
        )}
        
        {props.request.status === "valid" && (
          <Badge colorScheme="success">{t("certificate.approved")}</Badge>
        )}
        
        {props.request.status === "rejected" && (
          <VStack alignItems="start" spacing="$1">
            <Badge colorScheme="danger">{t("certificate.rejected")}</Badge>
            {props.request.rejected_reason && (
              <Text fontSize="$xs" color="$neutral11">
                {props.request.rejected_reason}
              </Text>
            )}
          </VStack>
        )}
      </HStack>
    )
  }
  
  // 证书申请项组件
  const CertificateRequestItem: Component<{ request: CertificateRequest; refresh: () => void; onApprove: (id: number) => void; onReject: (id: number, reason?: string) => void }> = (props) => {
    return (
      <Tr>
        <Td>
          <HStack spacing="$2">
            <Icon as={FaSolidUser as any as IconTypes} />
            <Text>{props.request.user_name}</Text>
          </HStack>
        </Td>
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
  
  // 证书申请表格行组件
  const CertificateRequestTableRow: Component<{ request: CertificateRequest, refresh: () => void }> = (props) => {
    return (
      <Tr>
        <Td>
          <HStack spacing="$2">
            {props.request.type === "user" && (
              <Icon as={FaSolidUser as any} color="white" />
            )}
            {props.request.type === "node" && (
              <Icon as={FaSolidServer as any} color="white" />
            )}
            <Text>
              {props.request.type === "user"
                ? props.request.user_name
                : props.request.node_name}
            </Text>
          </HStack>
        </Td>
        <Td>
          <HStack spacing="$2">
            <Badge
              colorScheme={
                props.request.type === "user" ? "info" : "accent"
              }
            >
              {t(`certificate.${props.request.type}`)}
            </Badge>
          </HStack>
        </Td>
        <Td>{new Date(props.request.created_at).toLocaleDateString()}</Td>
        <Td>
          <CertificateRequestOp request={props.request} refresh={props.refresh} />
        </Td>
      </Tr>
    )
  }
  
  // 当打开证书模态框时获取用户列表
  createEffect(() => {
    if (isOpen()) {
      fetchUsers()
    }
  })
  
  return (
    <VStack spacing="$4" alignItems="start" w="$full">
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
        <Button
          colorScheme="info"
          onClick={openAddRequestModal}
          leftIcon={<BiSolidPlusCircle />}
        >
          {t("certificate.add_request")}
        </Button>
        
        <Input
          placeholder={t("global.search")}
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          w="200px"
        />
        
        <Select<string> 
          value={filterStatus()} 
          onChange={(value) => setFilterStatus(value)}
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
          onChange={(value) => setFilterType(value as any)}
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
          onChange={(e: any) => {
            setLayout(
              e.currentTarget.checked ? "table" : "grid",
            )
          }}
        >
          {t("storages.other.table_layout")}
        </HopeSwitch>
      </HStack>
      
      {loading() ? (
        <HStack spacing="$2">
          <Spinner size="sm" />
          <Text>{t("global.loading")}</Text>
        </HStack>
      ) : (
        <>
          {filteredCertificates().length > 0 ? (
            <>
              {layout() === "grid" ? (
                <Grid
                  w="$full"
                  gap="$4"
                  templateColumns={{
                    "@initial": "1fr",
                    "@lg": "repeat(auto-fill, minmax(300px, 1fr))",
                  }}
                >
                  <For each={filteredCertificates() as any}>
                    {(cert: any) => (
                      <CertificateGridItem 
                        cert={cert} 
                        refresh={refresh} 
                        onEdit={openEditCertificateModal}
                        onDownload={handleDownloadCertificate}
                        onRevoke={handleRevokeCertificate}
                      />
                    )}
                  </For>
                </Grid>
              ) : (
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
                      <For each={filteredCertificates() as Certificate[]}>
                        {(cert: Certificate) => (
                          <Tr>
                            <Td>{cert.name}</Td>
                            <Td>
                              <Badge colorScheme={cert.type === "user" ? "info" : "accent"}>
                                {t(`certificate.${cert.type}`)}
                              </Badge>
                            </Td>
                            <Td>{cert.owner}</Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  cert.status === "valid" ? "success" :
                                  cert.status === "expiring" ? "warning" :
                                  cert.status === "revoked" ? "danger" : "neutral"
                                }
                              >
                                {t(`certificate.${cert.status}`)}
                              </Badge>
                            </Td>
                            <Td>{new Date(cert.issued_date).toLocaleDateString()}</Td>
                            <Td>{new Date(cert.expiration_date).toLocaleDateString()}</Td>
                            <Td>
                              <CertificateOp 
                                cert={cert} 
                                refresh={refresh} 
                                onEdit={openEditCertificateModal}
                                onDownload={handleDownloadCertificate}
                                onRevoke={handleRevokeCertificate}
                              />
                            </Td>
                          </Tr>
                        )}
                      </For>
                    </Tbody>
                  </Table>
                </Box>
              )}
            </>
          ) : (
            <Alert status="info">
              <AlertIcon />
              <AlertTitle>{t("certificate.no_certificates")}</AlertTitle>
              <AlertDescription>{t("certificate.no_certificates_desc")}</AlertDescription>
            </Alert>
          )}
        </>
      )}
      
      {/* 证书申请列表 */}
      <Box w="$full">
        <Text fontSize="$lg" fontWeight="$semibold" mb="$4">
          {t("certificate.certificate_requests")}
        </Text>
        
        {certificateRequests().length > 0 ? (
          <Box w="$full" overflowX="auto">
            <Table dense>
              <Thead>
                <Tr>
                  <Th>{t("certificate.user")}</Th>
                  <Th>{t("certificate.type")}</Th>
                  <Th>{t("certificate.reason")}</Th>
                  <Th>{t("certificate.status")}</Th>
                  <Th>{t("certificate.created_at")}</Th>
                  <Th>{t("global.operations")}</Th>
                </Tr>
              </Thead>
              <Tbody>
                <For each={certificateRequests() as any}>
                  {(request: any) => (
                    <CertificateRequestItem 
                      request={request} 
                      refresh={refresh} 
                      onApprove={approveRequest}
                      onReject={rejectRequest}
                    />
                  )}
                </For>
              </Tbody>
            </Table>
          </Box>
        ) : (
          <Alert status="info">
            <AlertIcon />
            <AlertTitle>{t("certificate.no_requests")}</AlertTitle>
            <AlertDescription>{t("certificate.no_requests_desc")}</AlertDescription>
          </Alert>
        )}
      </Box>
      
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
                <Select value={type()} onChange={(value) => setType(value as any)}>
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
                        <Show when={!!filteredUsers().length}>
                          <For each={filteredUsers()}>
                            {(user: User) => (
                              <Box
                                w="$full"
                                p="$3"
                                cursor="pointer"
                                _hover={{ bg: "$info3" } as any}
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
                        <Show when={!filteredUsers().length && !!userSearch()}>
                          <Box w="$full" p="$4" textAlign="center">
                            <Text color="$neutral11">{t("certificate.no_users_found")}</Text>
                          </Box>
                        </Show>
                      </VStack>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
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
                  as="textarea"
                  rows={5}
                  value={content()}
                  onInput={(e) => setContent(e.currentTarget.value)}
                  placeholder={t("certificate.content_placeholder") || "Enter certificate content"}
                />
              </FormControl>
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
                <Popover opened={isUserSelectOpen()} onChange={setIsUserSelectOpen}>
                  <PopoverTrigger>
                    <InputGroup>
                      <Input
                        value={requestUserName()}
                        onInput={handleRequestOwnerInput}
                        onFocus={() => requestUserName() && setIsUserSelectOpen(true)}
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
                        <Show when={!!filteredUsers().length}>
                          <For each={filteredUsers()}>
                            {(user: User) => (
                              <Box
                                w="$full"
                                p="$3"
                                cursor="pointer"
                                _hover={{ bg: "$info3" } as any}
                                onClick={() => selectRequestUser(user)}
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
                        <Show when={!filteredUsers().length && !!userSearch()}>
                          <Box w="$full" p="$4" textAlign="center">
                            <Text color="$neutral11">{t("certificate.no_users_found")}</Text>
                          </Box>
                        </Show>
                      </VStack>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
                <FormErrorMessage>{requestFormErrors().userName}</FormErrorMessage>
              </FormControl>
              
              <FormControl>
                <FormLabel>{t("certificate.type")}</FormLabel>
                <Select value={requestType()} onChange={(value) => setRequestType(value as "user" | "node")}>
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
                onClick={createRequest}
              >
                {t("global.create")}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}

export default CertificateManagement