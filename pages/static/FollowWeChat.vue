<template>
  <u-popup
    :show="show"
    mode="center"
    :overlay="true"
    :closeable="false"
    @close="closePopup"
    @update:show="val => emit('update:show', val)"
    :duration="300"
  >
    <view class="panel-wrapper">
      <!-- 顶部返回按钮 -->
      <view class="static-header">
        <u-icon name="arrow-left" size="20" @click="closePopup" />
      </view>

      <!-- 内容区：图片+提示文字 -->
      <view class="content">
        <image src="../static/wechat.jpg" class="qr-image" mode="widthFix" />
        <view class="tip-text">扫描二维码关注视途科技</view>
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

// 接收父组件传递的 show 状态
const props = defineProps({
  show: Boolean
})

// 向父组件发送关闭弹窗的事件
const emit = defineEmits(['update:show'])

// 关闭弹窗的逻辑
function closePopup() {
  emit('update:show', false)  // 将 show 状态设置为 false，关闭弹窗
}
</script>

<style scoped>
.panel-wrapper {
  width: 280px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.static-header {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 30px;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qr-image {
  width: 200px;
  margin-top: 10px;
}

.tip-text {
  margin-top: 12px;
  font-size: 14px;
  color: #333;
  text-align: center;
}
</style>
