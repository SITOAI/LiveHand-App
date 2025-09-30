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
  }

  return {
    token,
    isLogin,
    login,
    logout,
  }
})
