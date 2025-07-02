<template>
  <u-popup
    :show="show"
    mode="right"
    :overlay="true"
    :closeable="false"
    @close="closePopup"
    @update:show="val => emit('update:show', val)"
    :duration="300"
  >
    <view
      class="panel-wrapper"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
	  <!-- 顶部返回按钮 -->
	  <view class="static-header">
	    <u-icon name="arrow-left" size="24" @click="closePopup" />
	  </view>

      <!-- 嵌入网页内容 -->
      <web-view :src="url" />
    </view>
  </u-popup>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'

const props = defineProps({
  show: Boolean
})
const emit = defineEmits(['update:show'])

const url = ref('https://www.xiaohongshu.com/user/profile/5fb3d0260000000001006910')

function closePopup() {
  emit('update:show', false)
}

// 手势滑动关闭逻辑
let startX = 0
let startY = 0

function onTouchStart(e) {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
}

function onTouchEnd(e) {
  const endX = e.changedTouches[0].clientX
  const endY = e.changedTouches[0].clientY
  const deltaX = endX - startX
  const deltaY = Math.abs(endY - startY)

  if (deltaX > 60 && deltaY < 30) {
    closePopup()
  }
}
</script>

<style scoped>
.panel-wrapper {
  width: 96vw;
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding: 0;
}

/* 顶部返回按钮 */
.static-header {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #eee;
}
</style>
