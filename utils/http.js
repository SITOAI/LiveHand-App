// utils/http.js
class Http {
  constructor({
    baseURL = 'http://192.168.1.246:8082',
    timeout = 10000, // 10秒超时
    headers = { 'Content-Type': 'application/json' },
  } = {}) {
    this.baseURL = baseURL
    this.timeout = timeout
    this.headers = headers

    this.requestInterceptors = []
    this.responseInterceptors = []
  }

  // 添加请求拦截器，返回 config 或 Promise.reject(error)
  addRequestInterceptor(fn) {
    this.requestInterceptors.push(fn)
  }

  // 添加响应拦截器，返回 response 或 Promise.reject(error)
  addResponseInterceptor(fn) {
    this.responseInterceptors.push(fn)
  }

  // 内部调用请求拦截器
  async runRequestInterceptors(config) {
    let cfg = { ...config }
    for (const interceptor of this.requestInterceptors) {
      // 支持异步
      cfg = await interceptor(cfg)
    }
    return cfg
  }

  // 内部调用响应拦截器
  async runResponseInterceptors(response) {
    let res = response
    for (const interceptor of this.responseInterceptors) {
      // 支持异步
      res = await interceptor(res)
    }
    return res
  }

  // 发送请求核心
  async request(url, options = {}) {
    let config = {
      method: 'GET',
      headers: { ...this.headers },
      ...options,
    }

    // 完整 URL
    const fullUrl = this.baseURL + url

    // 先执行请求拦截器
    config = await this.runRequestInterceptors(config)

    // 创建 AbortController 用于取消和超时
    const controller = new AbortController()
    config.signal = controller.signal

    // 超时控制
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(fullUrl, config)
      clearTimeout(timeoutId)

      // 响应拦截器先处理原始响应
      const interceptedResponse = await this.runResponseInterceptors(response)

      if (!interceptedResponse.ok) {
        // 尝试解析错误信息
        let errorMsg = `HTTP错误: ${interceptedResponse.status}`
        try {
          const errJson = await interceptedResponse.json()
          errorMsg = errJson.message || errorMsg
        } catch {}

        const error = new Error(errorMsg)
        error.status = interceptedResponse.status
        throw error
      }

      // 默认返回 JSON，可以根据响应头判断是否为 json
      const contentType = interceptedResponse.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        return interceptedResponse.json()
      } else {
        // 返回文本
        return interceptedResponse.text()
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('请求超时或被取消')
      }
      throw error
    }
  }

  // GET 请求，支持 params 参数
  get(url, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url
    return this.request(fullUrl, {
      method: 'GET',
      ...options,
    })
  }

  // POST 请求，自动序列化 JSON
  post(url, data = {}, options = {}) {
    const config = {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    }
    return this.request(url, config)
  }

  put(url, data = {}, options = {}) {
    const config = {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    }
    return this.request(url, config)
  }

  delete(url, data = {}, options = {}) {
    const config = {
      method: 'DELETE',
      body: JSON.stringify(data),
      ...options,
    }
    return this.request(url, config)
  }
}

// 实例化并导出一个默认 Http 实例，方便全局用
const http = new Http({
  baseURL: 'http://ai.sitoai.cn',
  timeout: 15000, // 15秒超时
})

// 示例：添加请求拦截器，自动添加token
http.addRequestInterceptor(async (config) => {
  const token = localStorage.getItem('token') || ''
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// 示例：添加响应拦截器，401自动登出跳转登录
http.addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    // 这里可以做登出处理，比如清token、跳转登录页
    localStorage.removeItem('token')
    // 你可以使用router跳转，或者触发全局事件
    // router.push('/login')
    throw new Error('未授权，请重新登录')
  }
  return response
})

export default http
