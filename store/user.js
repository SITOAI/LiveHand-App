// store/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('token') || '')

  const isLogin = computed(() => !!token.value)

  function login(newToken) {
    token.value = newToken
    uni.setStorageSync('token', newToken)
  }

  function logout() {
    token.value = ''
    uni.removeStorageSync('token')
    // 清除所有uni-app存储数据
    uni.clearStorageSync()
  }

  return {
    token,
    isLogin,
    login,
    logout,
  }
})
