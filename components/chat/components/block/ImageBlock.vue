<template>
  <image :src="url" class="chat-image" mode="widthFix" @click="previewImage" />
</template>

<script setup>
const props = defineProps({ url: String })
function previewImage() {
  uni.previewImage({ urls: [props.url] })
}
</script>

<style scoped>
.chat-image {
  width: 100%;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
}
</style>