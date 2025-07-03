<template>
  <video class="chat-video" :src="url" controls :poster="poster || ''" />
</template>

<script setup>
const props = defineProps({
  url: String,
  poster: String
})
</script>

<style scoped>
.chat-video {
  width: 100%;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
}
</style>