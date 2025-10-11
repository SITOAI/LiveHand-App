<template>
  <view>
    <!-- 登录状态判断 -->
    <Login v-if="!isLogin" />
    <!-- 登录后自动跳转到tabbar页面，系统会自动处理tabbar显示 -->
    <view v-else class="hidden">登录成功，等待系统跳转...</view>
  </view>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useUserStore } from '../store/user.js'
import Login from './login/login.vue'

const userStore = useUserStore()
const isLogin = computed(() => userStore.isLogin)

onMounted(() => {
  // 登录成功后，如果不在tabbar页面，则自动跳转到第一个tabbar页面
  if (isLogin.value && getCurrentPages().length === 1) {
    uni.switchTab({ url: '/pages/index/explore/layout' })
  }
})

console.log("isLogin", isLogin.value)
</script>

<style scoped>
.hidden {
  display: none;
}
</style>