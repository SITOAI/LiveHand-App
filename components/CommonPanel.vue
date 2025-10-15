<template>
  <u-popup 
    :close-on-click-overlay="false"
    :show="show"
    mode="left"
    :overlay="true"
    :closeable="false"
    :safe-area-inset-left="true"
    @close="closePanel"
    @update:show="val => emit('update:show', val)"
  >
    <view class="panel-wrapper">
      <!-- 顶部栏 -->
      <view class="panel-header">
        <text class="header-title">通用</text>
        <u-icon name="close-circle" size="28" @click="closePanel" />
      </view>

      <!-- 内容区域 - 待开发提示 -->
      <view class="not-available-content">
        <image class="icon" src="/static/AI.png" mode="aspectFit"></image>
        <view class="title">此功能正在开发中</view>
        <view class="subtitle">我们正在努力为您提供更好的功能体验</view>
        <view class="tip">敬请期待未来版本的更新！</view>
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['update:show'])

function closePanel() {
  emit('update:show', false)
}
</script>

<style scoped>
.panel-wrapper {
  width: 90vw;
  height: 95vh;
  background-color: #ebeff2;
  display: flex;
  flex-direction: column;
  padding: 5vh 5vw 0;
  border-radius: 10px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1vh 3vw;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(204,204,204,0.53);
}
.header-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

/* 待开发提示样式 */
.not-available-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 40rpx;
}

.icon {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 40rpx;
  opacity: 0.7;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 30rpx;
  color: #666;
  margin-bottom: 20rpx;
  line-height: 1.5;
}

.tip {
  font-size: 26rpx;
  color: #999;
  line-height: 1.5;
}
</style>