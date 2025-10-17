class Http {
  constructor({
    baseURL = 'http://ai.sitoai.cn',
    timeout = 300000, // 修改为5分钟超时
    headers = { 'Content-Type': 'application/json' },
  } = {}) {
    this.baseURL = baseURL
    this.timeout = timeout
    this.headers = headers

    this.requestInterceptors = []
    this.responseInterceptors = []
  }

  addRequestInterceptor(fn) {
    this.requestInterceptors.push(fn)
  }

  addResponseInterceptor(fn) {
    this.responseInterceptors.push(fn)
  }

  async runRequestInterceptors(config) {
    let cfg = { ...config }
    for (const interceptor of this.requestInterceptors) {
      cfg = await interceptor(cfg)
    }
    return cfg
  }

  async runResponseInterceptors(response) {
    let res = response
    for (const interceptor of this.responseInterceptors) {
      res = await interceptor(res)
    }
    return res
  }

  // 核心请求
  async request(url, options = {}) {
    let config = {
      method: 'GET',
      headers: { ...this.headers },
      ...options,
    }

    const fullUrl = this.baseURL + url
    config = await this.runRequestInterceptors(config)

    return new Promise((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        reject(new Error('请求超时'))
      }, this.timeout)

      uni.request({
        url: fullUrl,
        method: config.method || 'GET',
        header: config.headers,
        data: config.body ? JSON.parse(config.body) : {},
        timeout: this.timeout, // 直接在uni.request中设置超时时间
        success: async (res) => {
          clearTimeout(timeoutTimer)

          const response = {
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: async () => res.data,
            text: async () => JSON.stringify(res.data),
            headers: {
              get: (key) => res.header?.[key.toLowerCase()] || ''
            }
          }

          const intercepted = await this.runResponseInterceptors(response)

          if (!intercepted.ok) {
            const errData = await intercepted.json()
            const error = new Error(errData?.message || `HTTP错误: ${intercepted.status}`)
            error.status = intercepted.status
            return reject(error)
          }

          const contentType = intercepted.headers.get('content-type') || ''
          try {
            const data = await intercepted.json()
            return resolve(data)
          } catch (e) {
            const text = await intercepted.text()
            try {
              return resolve(JSON.parse(text))  // 某些服务返回的是 text 但内容是 JSON 字符串
            } catch {
              return resolve(text) // 真的是纯文本
            }
          }
        },
        fail: (err) => {
          clearTimeout(timeoutTimer)
          reject(new Error(err.errMsg || '请求失败'))
        }
      })
    })
  }

  get(url, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url
    return this.request(fullUrl, {
      method: 'GET',
      ...options,
    })
  }

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

const http = new Http({
  baseURL: 'http://ai.sitoai.cn',
  timeout: 1500000,
})

// 请求拦截器：自动附加 token
http.addRequestInterceptor(async (config) => {
  try {
    const token = uni.getStorageSync('token') || ''
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
  } catch (e) {
    console.warn('token 获取失败:', e)
  }
  return config
})

// 响应拦截器：自动处理 401
http.addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    try {
      uni.removeStorageSync('token')
    } catch (e) {
      console.warn('token 清除失败:', e)
    }
    throw new Error('未授权，请重新登录')
  }
  return response
})

export default http
