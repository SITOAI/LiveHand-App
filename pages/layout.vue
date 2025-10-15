<template>
  <view>
    <!-- 登录状态判断 -->
    <Login v-if="!isLogin" />
    <!-- 登录后自动跳转到tabbar页面，系统会自动处理tabbar显示 -->
    <view v-else class="hidden">登录成功，等待系统跳转...</view>
  </view>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useUserStore } from '../store/user.js'
import Login from './login/login.vue'

const userStore = useUserStore()
const isLogin = computed(() => userStore.isLogin)

// 监听登录状态变化，确保登录成功后立即跳转到探索页面
watch(isLogin, (newVal) => {
  if (newVal) {
    uni.switchTab({ url: '/pages/index/explore/layout' })
  }
}, { immediate: true })

onMounted(() => {
  // 如果已经登录，直接跳转到探索页面
  if (isLogin.value) {
    uni.switchTab({ url: '/pages/index/explore/layout' })
  }
})
</script>

<style scoped>
.hidden {
  display: none;
}
</style>