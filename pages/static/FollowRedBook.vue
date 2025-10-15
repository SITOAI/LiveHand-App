<template>
  <u-popup
    :show="show"
    mode="bottom"
    :safe-area-inset-top="true"
    :overlay="true"
    :closeable="true"
    :close-on-click-overlay="true"
    @close="closePopup"
    @update:show="val => emit('update:show', val)"
    :duration="300"
    ref="popupRef"
  >
    <view
      class="panel-wrapper"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
	  <!-- 顶部返回按钮 - 确保在web-view上方 -->
	  <view class="static-header" style="z-index: 999;">
	    <u-icon name="arrow-left" size="24" @click="closePopup" />
	  </view>

      <!-- 嵌入网页内容 -->
      <view style="flex: 1; position: relative;">000000000000000
        <web-view :src="url" :webview-styles="{ width: '100%', height: '100%' }" :fullscreen="false" :update-title="false" />
      </view>
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
const popupRef = ref(null)

function closePopup() {
  emit('update:show', false)
}

// 暴露closePopup方法供父组件调用
defineExpose({
  closePopup
})

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
  padding-top: 7vh;
  width: 100vw;
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding-left: 4vw;
  box-sizing: border-box;
}

/* 顶部返回按钮 */
.static-header {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 12px;
}
</style>
