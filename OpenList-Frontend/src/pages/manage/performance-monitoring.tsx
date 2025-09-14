import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Text,
  VStack,
} from "@hope-ui/solid"
import { createSignal, For, onCleanup, onMount } from "solid-js"
import { useManageTitle, useT } from "~/hooks"
import { BiSolidChart } from "solid-icons/bi"
import { FaSolidNetworkWired, FaSolidMicrochip, FaSolidMemory } from "solid-icons/fa"
import { TbActivityHeartbeat } from "solid-icons/tb"

// 模拟监控数据类型
interface MetricData {
  name: string
  value: number
  unit: string
  description: string
}

interface NodeData {
  id: number
  name: string
  cpuUsage: number
  memoryUsage: number
  networkUsage: number
  status: "online" | "offline" | "warning"
}

interface LinkData {
  source: number
  target: number
  bandwidth: number
  latency: number
  status: "active" | "inactive"
}

// 模拟数据
const mockMetrics: MetricData[] = [
  { name: "network_utilization", value: 75, unit: "%", description: "网络资源利用率" },
  { name: "throughput", value: 1250, unit: "rps", description: "系统总吞吐量" },
  { name: "response_time", value: 42, unit: "ms", description: "平均请求处理时间" },
  { name: "cpu_usage", value: 68, unit: "%", description: "CPU利用率" },
  { name: "memory_usage", value: 56, unit: "%", description: "内存利用率" },
  { name: "disk_io", value: 245, unit: "MB/s", description: "磁盘I/O" },
]

const mockNodes: NodeData[] = [
  { id: 1, name: "主节点", cpuUsage: 72, memoryUsage: 65, networkUsage: 80, status: "online" },
  { id: 2, name: "存储节点-1", cpuUsage: 45, memoryUsage: 38, networkUsage: 65, status: "online" },
  { id: 3, name: "存储节点-2", cpuUsage: 58, memoryUsage: 70, networkUsage: 90, status: "warning" },
  { id: 4, name: "计算节点-1", cpuUsage: 85, memoryUsage: 42, networkUsage: 75, status: "online" },
  { id: 5, name: "计算节点-2", cpuUsage: 32, memoryUsage: 28, networkUsage: 40, status: "online" },
]

const mockLinks: LinkData[] = [
  { source: 1, target: 2, bandwidth: 1000, latency: 5, status: "active" },
  { source: 1, target: 3, bandwidth: 1000, latency: 8, status: "active" },
  { source: 1, target: 4, bandwidth: 1000, latency: 12, status: "active" },
  { source: 1, target: 5, bandwidth: 1000, latency: 7, status: "active" },
  { source: 2, target: 3, bandwidth: 1000, latency: 20, status: "active" },
]

const PerformanceMonitoring = () => {
  useManageTitle("manage.sidemenu.performance-monitoring")
  const t = useT()
  
  const [metrics, setMetrics] = createSignal<MetricData[]>(mockMetrics)
  const [nodes, setNodes] = createSignal<NodeData[]>(mockNodes)
  const [links, setLinks] = createSignal<LinkData[]>(mockLinks)
  
  // 模拟数据刷新
  const refreshData = () => {
    // 模拟更新数据
    const updatedMetrics = metrics().map(metric => ({
      ...metric,
      value: metric.value + (Math.random() * 10 - 5) // 随机波动
    }))
    
    const updatedNodes = nodes().map(node => ({
      ...node,
      cpuUsage: Math.min(100, Math.max(0, node.cpuUsage + (Math.random() * 10 - 5))),
      memoryUsage: Math.min(100, Math.max(0, node.memoryUsage + (Math.random() * 10 - 5))),
      networkUsage: Math.min(100, Math.max(0, node.networkUsage + (Math.random() * 10 - 5))),
    }))
    
    setMetrics(updatedMetrics)
    setNodes(updatedNodes)
  }
  
  // 设置定时刷新
  let refreshInterval: number | undefined
  onMount(() => {
    refreshInterval = setInterval(refreshData, 5000) // 每5秒刷新一次
  })
  
  onCleanup(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
  })
  
  return (
    <VStack spacing="$4" alignItems="stretch">
      {/* 顶部操作栏 */}
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
          onClick={refreshData}
          leftIcon={<BiSolidChart />}
        >
          {t("global.refresh")}
        </Button>
      </HStack>
      
      {/* 核心指标展示 */}
      <Grid
        w="$full"
        gap="$4"
        templateColumns={{
          "@initial": "1fr",
          "@md": "repeat(2, 1fr)",
          "@lg": "repeat(3, 1fr)",
        }}
      >
        <For each={metrics()}>
          {(metric) => (
            <GridItem>
              <Box 
                borderWidth="1px" 
                borderRadius="$lg" 
                p="$4"
              >
                <HStack spacing="$2" mb="$2">
                  <BiSolidChart />
                  <Text fontWeight="$semibold">{t(`performance_monitoring.metrics.${metric.name}`) || metric.description}</Text>
                </HStack>
                <Flex justifyContent="space-between" alignItems="end">
                  <Heading size="2xl">{metric.value.toFixed(1)}</Heading>
                  <Text fontSize="$lg" color="$neutral11">{metric.unit}</Text>
                </Flex>
              </Box>
            </GridItem>
          )}
        </For>
      </Grid>
      
      {/* 链路拓扑视图 */}
      <Box 
        borderWidth="1px" 
        borderRadius="$lg"
      >
        <Box p="$4" borderBottomWidth="1px">
          <HStack spacing="$2">
            <FaSolidNetworkWired />
            <Text fontWeight="$semibold">{t("performance_monitoring.network_topology")}</Text>
          </HStack>
        </Box>
        <Box p="$4">
          <Box 
            h="300px" 
            bg="$neutral3" 
            rounded="$md"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text>{t("performance_monitoring.topology_chart_placeholder")}</Text>
          </Box>
          <HStack spacing="$4" mt="$4" overflowX="auto" pb="$2">
            <For each={links()}>
              {(link) => (
                <Box 
                  minW="200px"
                  borderWidth="1px"
                  borderRadius="$md"
                  p="$3"
                >
                  <Text fontWeight="$semibold">
                    {nodes().find(n => n.id === link.source)?.name} → {nodes().find(n => n.id === link.target)?.name}
                  </Text>
                  <HStack justifyContent="space-between" mt="$2">
                    <Text fontSize="$sm">{t("performance_monitoring.bandwidth")}: {link.bandwidth} Mbps</Text>
                    <Text fontSize="$sm">{t("performance_monitoring.latency")}: {link.latency} ms</Text>
                  </HStack>
                </Box>
              )}
            </For>
          </HStack>
        </Box>
      </Box>
      
      {/* 节点详细视图 */}
      <Box 
        borderWidth="1px" 
        borderRadius="$lg"
      >
        <Box p="$4" borderBottomWidth="1px">
          <HStack spacing="$2">
            <FaSolidMicrochip />
            <Text fontWeight="$semibold">{t("performance_monitoring.node_details")}</Text>
          </HStack>
        </Box>
        <Box p="$4">
          <Grid
            gap="$4"
            templateColumns={{
              "@initial": "1fr",
              "@md": "repeat(2, 1fr)",
              "@lg": "repeat(3, 1fr)",
            }}
          >
            <For each={nodes()}>
              {(node) => (
                <Box 
                  borderWidth="1px"
                  borderRadius="$md"
                  p="$4"
                  borderColor={node.status === "warning" ? "$warning8" : node.status === "offline" ? "$danger8" : undefined}
                >
                  <HStack justifyContent="space-between">
                    <Text fontWeight="$semibold">{node.name}</Text>
                    <Box 
                      w="12px" 
                      h="12px" 
                      rounded="50%" 
                      bg={node.status === "online" ? "$success9" : node.status === "warning" ? "$warning9" : "$danger9"}
                    />
                  </HStack>
                  
                  <VStack spacing="$3" mt="$4">
                    <HStack w="$full" justifyContent="space-between">
                      <HStack spacing="$2">
                        <FaSolidMicrochip color="#6b7280" />
                        <Text fontSize="$sm">{t("performance_monitoring.cpu")}</Text>
                      </HStack>
                      <Text fontSize="$sm">{node.cpuUsage.toFixed(1)}%</Text>
                    </HStack>
                    
                    <HStack w="$full" justifyContent="space-between">
                      <HStack spacing="$2">
                        <FaSolidMemory color="#6b7280" />
                        <Text fontSize="$sm">{t("performance_monitoring.memory")}</Text>
                      </HStack>
                      <Text fontSize="$sm">{node.memoryUsage.toFixed(1)}%</Text>
                    </HStack>
                    
                    <HStack w="$full" justifyContent="space-between">
                      <HStack spacing="$2">
                        <TbActivityHeartbeat color="#6b7280" />
                        <Text fontSize="$sm">{t("performance_monitoring.network")}</Text>
                      </HStack>
                      <Text fontSize="$sm">{node.networkUsage.toFixed(1)}%</Text>
                    </HStack>
                  </VStack>
                </Box>
              )}
            </For>
          </Grid>
        </Box>
      </Box>
    </VStack>
  )
}

export default PerformanceMonitoring