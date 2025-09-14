import {
  Box,
  Button,
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
  Input,
  InputGroup,
  InputLeftElement,
} from "@hope-ui/solid"
import { createMemo, createSignal, For, Show, Switch } from "solid-js"
import { useManageTitle, useT } from "~/hooks"
import { BiSolidTrash, BiSolidEdit, BiSolidSearch } from "solid-icons/bi"
import { FaSolidUser, FaSolidUsers } from "solid-icons/fa"

// 模拟账户数据类型
interface Account {
  id: number
  username: string
  role: "admin" | "tenant"
  status: "active" | "inactive"
  email: string
  lastLogin: string
  createdAt: string
}

// 模拟数据
const mockAccounts: Account[] = [
  {
    id: 1,
    username: "admin",
    role: "admin",
    status: "active",
    email: "admin@example.com",
    lastLogin: "2023-10-15 14:30:00",
    createdAt: "2023-01-01",
  },
  {
    id: 2,
    username: "tenant1",
    role: "tenant",
    status: "active",
    email: "tenant1@example.com",
    lastLogin: "2023-10-14 09:15:00",
    createdAt: "2023-02-01",
  },
  {
    id: 3,
    username: "tenant2",
    role: "tenant",
    status: "inactive",
    email: "tenant2@example.com",
    lastLogin: "2023-09-30 16:45:00",
    createdAt: "2023-03-01",
  },
  {
    id: 4,
    username: "tenant3",
    role: "tenant",
    status: "active",
    email: "tenant3@example.com",
    lastLogin: "2023-10-10 11:20:00",
    createdAt: "2023-04-01",
  },
  {
    id: 5,
    username: "tenant4",
    role: "tenant",
    status: "active",
    email: "tenant4@example.com",
    lastLogin: "2023-10-12 13:10:00",
    createdAt: "2023-05-01",
  },
]

const AccountManagement = () => {
  useManageTitle("manage.sidemenu.account_management")
  const t = useT()
  
  const [accounts, setAccounts] = createSignal<Account[]>(mockAccounts)
  const [filterRole, setFilterRole] = createSignal<string>("all")
  const [filterStatus, setFilterStatus] = createSignal<string>("all")
  const [searchTerm, setSearchTerm] = createSignal<string>("")
  
  // 获取角色对应的图标
  const getRoleIcon = (role: string) => {
    return role === "admin" ? FaSolidUser : FaSolidUsers
  }
  
  // 获取角色对应的颜色
  const getRoleColor = (role: string) => {
    return role === "admin" ? "danger" : "accent"
  }
  
  // 刷新账户列表（模拟）
  const refresh = () => {
    setAccounts([...mockAccounts])
  }
  
  // 过滤后的账户列表
  const filteredAccounts = createMemo(() => {
    return accounts().filter(account => {
      const roleMatch = filterRole() === "all" || account.role === filterRole()
      const statusMatch = filterStatus() === "all" || account.status === filterStatus()
      const searchMatch = searchTerm() === "" || 
        (account.username ? account.username.toLowerCase().includes(searchTerm().toLowerCase()) : false) ||
        account.email.toLowerCase().includes(searchTerm().toLowerCase())
      return roleMatch && statusMatch && searchMatch
    })
  })
  
  // 删除账户（模拟）
  const deleteAccount = (id: number) => {
    setAccounts(prev => prev.filter(account => account.id !== id))
  }
  
  // 编辑账户（模拟）
  const editAccount = (id: number) => {
    // 模拟账户编辑操作
    console.log(`Editing account ${id}`)
  }
  
  // 添加账户（模拟）
  const addAccount = () => {
    // 模拟添加账户操作
    console.log("Adding new account")
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
        >
          {t("global.refresh")}
        </Button>
        <Button
          colorScheme="primary"
          onClick={addAccount}
        >
          {t("global.add")}
        </Button>
        
        <InputGroup flex="1" maxW="300px">
          <InputLeftElement>
            <Icon as={BiSolidSearch} />
          </InputLeftElement>
          <Input
            placeholder={t("account.search_placeholder")}
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </InputGroup>
        
        <Select 
          value={filterRole()} 
          onChange={(value) => setFilterRole(value)}
          size="sm"
          w="150px"
        >
          <SelectTrigger>
            <SelectValue placeholder={t("account.role_filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectListbox>
              <SelectOption value="all">
                <SelectOptionText>{t("account.all_roles")}</SelectOptionText>
              </SelectOption>
              <SelectOption value="admin">
                <SelectOptionText>{t("account.admin")}</SelectOptionText>
              </SelectOption>
              <SelectOption value="tenant">
                <SelectOptionText>{t("account.tenant")}</SelectOptionText>
              </SelectOption>
            </SelectListbox>
          </SelectContent>
        </Select>
        
        <Select 
          value={filterStatus()} 
          onChange={(value) => setFilterStatus(value)}
          size="sm"
          w="150px"
        >
          <SelectTrigger>
            <SelectValue placeholder={t("account.status_filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectListbox>
              <SelectOption value="all">
                <SelectOptionText>{t("account.all_status")}</SelectOptionText>
              </SelectOption>
              <SelectOption value="active">
                <SelectOptionText>{t("account.active")}</SelectOptionText>
              </SelectOption>
              <SelectOption value="inactive">
                <SelectOptionText>{t("account.inactive")}</SelectOptionText>
              </SelectOption>
            </SelectListbox>
          </SelectContent>
        </Select>
      </HStack>
      
      <Box w="$full" overflowX="auto">
        <Table dense>
          <Thead>
            <Tr>
              <Th>{t("account.username")}</Th>
              <Th>{t("account.role")}</Th>
              <Th>{t("account.email")}</Th>
              <Th>{t("account.status")}</Th>
              <Th>{t("account.created_at")}</Th>
              <Th>{t("account.last_login")}</Th>
              <Th>{t("global.operations")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <For each={filteredAccounts()}>
              {(account) => (
                <Tr>
                  <Td>
                    <HStack spacing="$2">
                      <Icon as={getRoleIcon(account?.role)} />
                      <Text>{account.username}</Text>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={getRoleColor(account?.role)}>
                      {account?.role === "admin" ? t("account.admin") : t("account.tenant")}
                    </Badge>
                  </Td>
                  <Td>{account.email}</Td>
                  <Td>
                    <Badge colorScheme={account?.status === "active" ? "success" : "neutral"}>
                      {account.status === "active" ? t("account.active") : t("account.inactive")}
                    </Badge>
                  </Td>
                  <Td>{account.createdAt}</Td>
                  <Td>{account.lastLogin}</Td>
                  <Td>
                    <HStack spacing="$2">
                      <IconButton
                        aria-label={t("global.edit")}
                        icon={<BiSolidEdit />}
                        colorScheme="accent"
                        size="sm"
                        onClick={() => editAccount(account.id)}
                      />
                      <Show when={account?.role !== "admin"}>
                        <IconButton
                          aria-label={t("global.delete")}
                          icon={<BiSolidTrash />}
                          colorScheme="danger"
                          size="sm"
                          onClick={() => deleteAccount(account.id)}
                        />
                      </Show>
                    </HStack>
                  </Td>
                </Tr>
              )}
            </For>
          </Tbody>
        </Table>
      </Box>
    </VStack>
  )
}

export default AccountManagement