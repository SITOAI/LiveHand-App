<template>
  <view class="chat-message" :class="message.role">
    <!-- AI 头像 -->
    <image
      v-if="message.role === 'assistant'"
      src="@/static/logo.png"
      class="avatar"
    />

    <!-- 气泡区域 -->
    <view class="bubble" :class="message.role">
      <template v-for="(block, index) in message.blocks" :key="index">
        <component :is="resolveComponent(block.type)" v-bind="block" />
      </template>
    </view>
  </view>
</template>

<script setup>
import MarkdownBlock from './block/MarkdownBlock.vue'
import ImageBlock from './block/ImageBlock.vue'
import VideoBlock from './block/VideoBlock.vue'
import FileBlock from './block/FileBlock.vue'
import QuoteBlock from './block/QuoteBlock.vue'

const props = defineProps({
  message: Object
})

function resolveComponent(type) {
  switch (type) {
    case 'text': return MarkdownBlock
    case 'image': return ImageBlock
    case 'video': return VideoBlock
    case 'file': return FileBlock
    case 'quote': return QuoteBlock
    default: return MarkdownBlock
  }
}
</script>

<style scoped>
.chat-message {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24rpx;
}

/* 用户消息向右排列 */
.chat-message.user {
  flex-direction: row-reverse;
}

/* AI 头像 */
.avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

/* 用户气泡和助手气泡样式 */
.bubble {
  max-width: 80%;
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
  word-break: break-word;
}

/* AI 气泡 */
.bubble.assistant {
  background-color: #f9f9f9;
  color: #333;
  border-top-left-radius: 0;
  border: 1px solid gray;
  margin-left: 12rpx;
}

/* 用户气泡 */
.bubble.user {
  background-color: #ddd;
  color: #000;
  border-top-right-radius: 0;
  margin-right: 12rpx;
}

/* 用户头像不显示，这里保留 margin 对齐 */
.chat-message.user .avatar {
  display: none;
}
</style>
