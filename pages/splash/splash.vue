<template>
  <view class="splash-container">
    <!-- 启动页图片 -->
    <image class="splash-image" src="../../static/start.png" mode="aspectFill"></image>
    
    <!-- 底部技术支持文案 -->
    <view class="tech-support">
      AI技术由西安视途科技提供
    </view>
  </view>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 设置启动页显示时间为2秒后跳转到首页
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/index/explore/layout'
    })
  }, 2000)
})
</script>

<style scoped>
.splash-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  overflow: hidden;
}

.splash-image {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.tech-support {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 28rpx;
  color: #666666;
  z-index: 2;
}
</style>