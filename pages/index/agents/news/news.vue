<template>
  <view class="iframe-wrapper">
    <!-- 加载中动画 -->
    <view class="loading-container" v-if="loading">
      <u-loading-icon text="加载中" textSize="18"></u-loading-icon>
    </view>

    <!-- iframe 内容 -->
    <iframe
      v-show="!loading"
      class="news-iframe"
      src="http://news.sitoai.cn"
      frameborder="0"
      @load="onIframeLoad"
    ></iframe>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const loading = ref(true)

function onIframeLoad() {
  loading.value = false
}
</script>

<style scoped>
.iframe-wrapper {
  width: 100vw;
  height: 100vh;
  padding: 10px;
  box-sizing: border-box;
  background: #f5f5f5;
  position: relative;
}

.news-iframe {
  width: 100%;
  height: calc(100vh - 30px); /* 留出底部20px空间 + padding 10px */
  border: none;
  border-radius: 15px;
  overflow: hidden;
}

.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
