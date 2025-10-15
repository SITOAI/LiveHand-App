<template>
  <view class="unmember-container">
    <view class="avatar-wrapper">
      <image class="avatar" src="../../static/mine.png" mode="aspectFill"></image>
    </view>
    <view class="user-info">
      <view class="username">未登录</view>
      <view class="user-desc">登录后享受更多功能</view>
    </view>
    <view class="login-btn" @click="goLogin">
      <text class="btn-text">登录/注册</text>
    </view>
  </view>
</template>

<script setup>
function goLogin() {
  uni.navigateTo({ url: '/pages/login/login' })
}
</script>

<style scoped>
.unmember-container {
  display: flex;
  align-items: center;
  padding: 10rpx 0;
}

.avatar-wrapper {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 32rpx;
  background-color: #f0f0f0;
  border: 4rpx dashed #d9d9d9;
}

.avatar {
  width: 100%;
  height: 100%;
  opacity: 0.7;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.user-desc {
  font-size: 28rpx;
  color: #999;
}

.login-btn {
  padding: 16rpx 40rpx;
  background-color: #1890ff;
  border-radius: 36rpx;
}

.btn-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}
</style>