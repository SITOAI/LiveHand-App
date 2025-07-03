<template>
  <view class="file-card" @longpress="onLongPress">
    <u-icon :name="getFileIcon(fileType)" size="26" />
    <text class="file-name">{{ name }}</text>
  </view>
</template>

<script setup>
const props = defineProps({
  name: String,
  url: String,
  fileType: String
})

function getFileIcon(type) {
  switch (type) {
    case 'word': return 'file-text'
    case 'excel': return 'file-excel'
    case 'ppt': return 'file-ppt'
    default: return 'file'
  }
}

function onLongPress() {
  uni.showActionSheet({
    itemList: ['收藏到知识库', '转发'],
    success: (res) => {
      console.log('用户选择：', res.tapIndex)
    }
  })
}
</script>

<style scoped>
.file-card {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 14rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
}
.file-name {
  font-size: 26rpx;
  color: #333;
}
</style>