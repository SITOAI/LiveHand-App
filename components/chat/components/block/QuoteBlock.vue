<template>
  <view class="quote-card" @click="onOpen">
    <text class="quote-title">{{ title }}</text>
    <text class="quote-content">{{ content }}</text>
  </view>
</template>

<script setup>
const props = defineProps({
  title: String,
  content: String,
  source: String
})

function onOpen() {
  if (props.source) {
    uni.navigateTo({ url: props.source })
  }
}
</script>

<style scoped>
.quote-card {
  border-left: 4rpx solid #3c9cff;
  padding: 10rpx 16rpx;
  background: #f0f8ff;
  margin-bottom: 12rpx;
  border-radius: 6rpx;
}
.quote-title {
  font-weight: bold;
  margin-bottom: 4rpx;
}
.quote-content {
  color: #666;
  font-size: 24rpx;
}
</style>
