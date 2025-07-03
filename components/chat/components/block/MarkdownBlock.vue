<template>
  <view class="markdown-block">
    <u-parse :content="content" v-if="markdown" />
    <text v-else>{{ content }}</text>
  </view>
</template>

<script setup>
const props = defineProps({
  content: String,
  markdown: Boolean
})
</script>

<style scoped>
.markdown-block {
  margin-bottom: 12rpx;
  word-break: break-word;
}
</style>