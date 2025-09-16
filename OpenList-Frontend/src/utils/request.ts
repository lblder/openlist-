import axios from "axios"
import { api, log } from "."

const instance = axios.create({
  baseURL: api + "/api",
  // timeout: 5000
  headers: {
    "Content-Type": "application/json;charset=utf-8",
    // 'Authorization': localStorage.getItem("admin-token") || "",
  },
  withCredentials: false,
})

instance.interceptors.request.use(
  (config) => {
    // 每次请求都从localStorage获取最新的Token
    const token = localStorage.getItem("token") || ""
    if (token) {
      config.headers.Authorization = token
    }
    // do something before request is sent
    return config
  },
  (error) => {
    // do something with request error
    console.log("Error: " + error.message) // for debug
    return Promise.reject(error)
  },
)

// response interceptor
instance.interceptors.response.use(
  (response) => {
    const resp = response.data
    log(resp)
    // if (resp.code === 401) {
    //   notify.error(resp.message);
    //   bus.emit(
    //     "to",
    //     `/@login?redirect=${encodeURIComponent(window.location.pathname)}`
    //   );
    // }
    return resp
  },
  (error) => {
    // response error
    console.error(error) // for debug
    // notificationService.show({
    //   status: "danger",
    //   title: error.code,
    //   description: error.message,
    // });
    return {
      code: axios.isCancel(error) ? -1 : error.response?.status,
      message: error.message,
    }
  },
)

// 删除初始化时设置的默认Authorization头
// instance.defaults.headers.common["Authorization"] =
//   localStorage.getItem("token") || ""

export const changeToken = (token?: string) => {
  // 只更新localStorage，不更新默认请求头
  localStorage.setItem("token", token ?? "")
}

export { instance as r }