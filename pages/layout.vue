<template>
  <view class="layout-container">
    <!-- 简化的layout页面，现在只作为备用路由或过渡页面 -->
    <!-- 实际的登录状态检查和页面跳转已经在App.vue中集中处理 -->
  </view>
</template>

<script setup>
// 移除所有登录状态检查和跳转逻辑
// 这些逻辑已经在App.vue的onLaunch中集中处理，避免重复跳转导致闪烁
import { onMounted } from 'vue'

onMounted(() => {
  // 简单的页面重定向，避免用户直接访问layout页面时出现空白
  const token = uni.getStorageSync('token') || '';
  if (!token) {
    uni.reLaunch({ url: '/pages/login/login' });
  } else {
    uni.reLaunch({ url: '/pages/index/explore/layout' });
  }
})
</script>

<style scoped>
.hidden {
  display: none;
}
</style>