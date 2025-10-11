<template>
  <view class="agent-not-available">
    <view class="not-available-content">
      <image class="icon" src="@/static/AI.png" mode="aspectFit" />
      <view class="title">智能体功能暂未开放</view>
      <view class="subtitle">简历智能体正在开发中，敬请期待！</view>
      <view class="tip">我们正在努力为您提供更好的智能助手体验</view>
    </view>
  </view>
</template>

<script setup>
// 简历智能体暂未开发
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
  margin-bottom: 10rpx;
  line-height: 1.5;
}

.tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 20rpx;
}
</style>
