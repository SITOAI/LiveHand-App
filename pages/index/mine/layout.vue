<template>
  <view class="agent-not-available">
    <view class="not-available-content">
      <image class="icon" src="/static/AI.png" mode="aspectFit"></image>
      <view class="title">我的页面功能暂未开放</view>
      <view class="subtitle">正在努力开发中，敬请期待！</view>
      <view class="tip">我们正在努力为您提供更好的功能体验</view>
    </view>
  
    <!-- 添加SelectionPanel组件 -->
    <SelectionPanel v-model:show="showCenterModal" />
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import SelectionPanel from "../../../components/SelectionPanel.vue"

// 响应式数据
const showCenterModal = ref(false)
let modalListener = null

// 监听TabBar中间按钮点击
onMounted(() => {
  // 直接监听TabBar中间按钮点击事件
  modalListener = uni.onTabBarMidButtonTap(() => {
    showCenterModal.value = true
  })
})

onUnmounted(() => {
  // 移除事件监听并重置状态
  if (modalListener) {
    uni.$off('showCenterModal', modalListener)
  }
  showCenterModal.value = false
})

// 处理选择事件

</script>

<style scoped>
.agent-not-available {
  width: 100vw;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
}

.not-available-content {
  padding-top: 35vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  max-width: 400px;
}

.icon {
  width: 120px;
  height: 120px;
  margin-bottom: 30rpx;
  opacity: 0.7;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
  line-height: 1.5;
}

.tip {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
}
</style>