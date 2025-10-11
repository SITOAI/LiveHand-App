<template>
  <div class="know-card" @click="openDetails">
    <div class="know-content-wrapper">
      <!-- 左侧文件夹图标 -->
      <div class="folder-icon-container">
        <image  :src="avatar" class="folder-icon" mode="aspectFit"></image>

      </div>
      
      <!-- 中间内容 -->
      <div class="know-content-info">
        <div class="know-title-row">
          <div class="know-title">{{ name }}</div>
          <div class="know-count">({{ count }})</div>
        </div>
        <div class="description-row">
          <div class="know-description">{{ prompt }}</div>
          <!-- 右侧更多按钮 -->
          <div class="more-icon-container" @click.stop="openDetails">
            <image  src="../../static/extra.png" class="more-icon" mode="aspectFit"></image>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  name: String,
  prompt: String,
  count: String,
  avatar: String,
  itemId: String
})

const onMore = () => {
  console.log('点击了更多')
}

function openDetails() {
  uni.navigateTo({
    url: `/pages/details/KnowDetails/KnowDetails?id=${encodeURIComponent(props.itemId)}&avatar=${encodeURIComponent(props.avatar)}&name=${encodeURIComponent(props.name)}&prompt=${encodeURIComponent(props.prompt)}&count=${props.count}`
  })
}
</script>

<style scoped>
.know-card {
  width: 100%;
  background-color: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
  padding: 32rpx;
  box-sizing: border-box;
}

.know-content-wrapper {
  display: flex;
  align-items: center;
  gap: 10rpx;
  width: 100%;
}

/* 左侧文件夹图标 */
.folder-icon-container {
    margin-right: 10rpx;
}

.folder-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 12rpx;

}

/* 中间内容 */
.know-content-info {
  flex: 1;
  min-width: 0;
}

.know-title-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.know-title {
  font-family: Source Han Sans CN, Source Han Sans CN;
  font-weight: 500;
  font-size: 30rpx;
  color: #131313;
}

.know-count {
  font-size: 24rpx;
  color: #131313;
  padding: 4rpx;
}

.description-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.know-description {
  font-weight: 400;
  font-size: 24rpx;
  color: #999999;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 10rpx;
}

/* 右侧更多按钮 */
.more-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70rpx;
  height: 70rpx;
  cursor: pointer;
  flex-shrink: 0;
}

.more-icon {
  width: 38rpx;
  height: 38rpx;
}
</style>
