<template>
  <view class="member-container">
    <view class="avatar-wrapper">
      <image class="avatar" src="../../static/test/test2.png" mode="aspectFill"></image>
      <!-- <image class="avatar" src="../../static/my.png" mode="aspectFill"></image> -->
    </view>
    <view class="user-info">
      <view class="username">{{ username || 'LiveHands用户' }}</view>
      <view class="user-desc">已登录</view>
    </view>
    <view class="member-badge" @click="showComingSoon">
      <image class="badge-icon" src="../../static/star_icon.png" mode="aspectFit"></image>
      <text class="badge-text">用户认证</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../store/user.js'

const username = ref('')
const userStore = useUserStore()

onMounted(() => {
  const userInfo = uni.getStorageSync('userInfo') || {};
  username.value =`ST_${userInfo.nickName}`  || 'LiveHands用户'
})

// 显示敬请期待弹窗
const showComingSoon = () => {
  uni.showModal({
    title: '',
    content: '敬请期待',
    showCancel: false,
    confirmText: '确定'
  })
}
</script>

<style scoped>
.member-container {
  display: flex;
  align-items: center;
  padding: 10rpx 0;
}

.avatar-wrapper {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12rpx;
  background-color: #f0f0f0;
  border: 4rpx solid #e6f7ff;
}

.avatar {
  width: 100%;
  height: 100%;
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
  color: #666;
}

.member-badge {
  display: flex;
  align-items: center;
  padding: 12rpx 16rpx;
  background-color: #fff7e6;
  border-radius: 36rpx;
  border: 2rpx solid #ffd591;
}

.badge-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 8rpx;
}

.badge-text {
  font-size: 26rpx;
  color: #fa8c16;
  font-weight: 500;
}
</style>