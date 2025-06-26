<template>
  <u-popup
    :show="show"
    mode="bottom"
    :round="10"
    closeOnClickOverlay
    overlay
  >
    <view
      class="popup-panel"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- 顶部滑动把手 -->
      <view class="drag-handle"></view>

      <!-- 头部 -->
      <view class="popup-header">
        <view class="header-title">{{ title }}</view>
        <view class="header-close" @click="$emit('update:show', false)">
          <u-icon name="close" size="20" color="#fff" />
        </view>
      </view>

      <!-- 列表 -->
      <view class="popup-list">
        <view
          v-for="(item, index) in items"
          :key="index"
          class="popup-item"
          @click="handleSelect(item)"
        >
            <view class="item-left-icon">
              <u-icon :name="item.icon" size="24" color="#666" />
            </view>
          <view class="item-right-content">
            <view class="item-title">{{ item.title }}</view>
            <view class="item-desc">{{ item.desc }}</view>
          </view>
        </view>
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  show: Boolean,
  title: Number,
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:show', 'select'])

function handleSelect(item) {
  emit('select', item)
  emit('update:show', false)
}

// 手势逻辑
const startY = ref(0)
const isMoving = ref(false)

function onTouchStart(e) {
  startY.value = e.touches[0].clientY
  isMoving.value = true
}

function onTouchMove(e) {
  if (!isMoving.value) return
  const currentY = e.touches[0].clientY
  const deltaY = currentY - startY.value
  // 可选：这里加动画效果
}

function onTouchEnd(e) {
  if (!isMoving.value) return
  isMoving.value = false
  const endY = e.changedTouches[0].clientY
  const deltaY = endY - startY.value

  if (deltaY > 50) {
    emit('update:show', false)
  }
}
</script>

<style scoped>
.popup-panel {
  background: #fff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  padding: 12px 20px 24px; /* 上右下内边距，顶部留点给拖拽条 */
  box-sizing: border-box;
  position: relative;
}

/* 顶部拖拽把手 */
.drag-handle {
  width: 40px;
  height: 6px;
  background-color: #ccc;
  border-radius: 3px;
  margin: 6px auto 10px auto;
}

/* 头部，左右分散 */
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 8px;
}

.header-title {
  font-size: 18px;
  font-weight: 800;
  color: #333;
}

/* 右上角关闭按钮：圆形深灰背景 */
.header-close {
  width: 32px;
  height: 32px;
  background-color: #555;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

/* 列表容器，item之间间距 */
.popup-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

/* 单个item容器 */
.popup-item {
  width: 90%;
  background-color: #f0f0f0;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.popup-item:active {
  background-color: #d9d9d9;
}

/* 左侧图标白色圆形背景 */
.item-left-icon {
  width: 40px;
  height: 40px;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
  box-shadow: 0 0 5px rgba(0,0,0,0.1);
}

/* 右侧上下布局 */
.item-right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.item-title {
  font-size: 16px;
  color: #333;
  font-weight: 600;
  margin-bottom: 4px;
}

.item-desc {
  font-size: 12px;
  color: #999;
  line-height: 1.2;
}
</style>
