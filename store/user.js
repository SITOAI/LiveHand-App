import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('token') || '')
  const user_id = ref(uni.getStorageSync('user_id') || '')
  const knowledge_user_id = ref(uni.getStorageSync('knowledge_user_id') || '')
  const file_path = ref(uni.getStorageSync('file_path') || '')
  const avatar = ref(uni.getStorageSync('avatar') || '')
  const nickname = ref(uni.getStorageSync('nickname') || '')
  const role = ref(uni.getStorageSync('role') || '')

  const isLogin = computed(() => !!token.value)

  function login(userInfo = {}) {
    if (userInfo.token) {
      token.value = userInfo.token
      uni.setStorageSync('token', userInfo.token)
    }
    if (userInfo.user_id) {
      user_id.value = userInfo.user_id
      uni.setStorageSync('user_id', userInfo.user_id)
    }
    if (userInfo.knowledge_user_id) {
      knowledge_user_id.value = userInfo.knowledge_user_id
      uni.setStorageSync('knowledge_user_id', userInfo.knowledge_user_id)
    }
    if (userInfo.file_path) {
      file_path.value = userInfo.file_path
      uni.setStorageSync('file_path', userInfo.file_path)
    }
    if (userInfo.avatar) {
      avatar.value = userInfo.avatar
      uni.setStorageSync('avatar', userInfo.avatar)
    }
    if (userInfo.nickname) {
      nickname.value = userInfo.nickname
      uni.setStorageSync('nickname', userInfo.nickname)
    }
    if (userInfo.role) {
      role.value = userInfo.role
      uni.setStorageSync('role', userInfo.role)
    }
  }

  function logout() {
    token.value = ''
    user_id.value = ''
    knowledge_user_id.value = ''
    file_path.value = ''
    avatar.value = ''
    nickname.value = ''
    role.value = ''

    uni.removeStorageSync('token')
    uni.removeStorageSync('user_id')
    uni.removeStorageSync('knowledge_user_id')
    uni.removeStorageSync('file_path')
    uni.removeStorageSync('avatar')
    uni.removeStorageSync('nickname')
    uni.removeStorageSync('role')
  }

  return {
    token,
    user_id,
    knowledge_user_id,
    file_path,
    avatar,
    nickname,
    role,
    isLogin,
    login,
    logout,
  }
})
