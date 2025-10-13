<template>
  <u-popup
    :show="show"
    mode="bottom"
    :round="10"
    closeOnClickOverlay
    overlay
    @close="handleClose"
    :safeAreaInsetBottom="true"
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
        <view class="header-close" @click="handleClose">
          <u-icon name="close" size="18" color="#fff" />
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
import { ref, defineProps, defineEmits, watch } from 'vue'

// 定义属性，保留show属性用于v-model绑定
const props = defineProps({
  show: Boolean,
  title: {
    type: String,
    default: '创建内容'
  }
})

// 定义事件
const emit = defineEmits(['update:show', 'select'])

// 内部定义items数据，不再从外部传入
const items = ref([
  { title: '粘贴链接', desc: '从剪贴板粘贴链接内容', icon: 'attach' },
  { title: '拍照', desc: '打开相机拍摄照片', icon: 'camera' },
  { title: '上传图片', desc: '从相册选择图片上传', icon: 'photo' },
  { title: '实时录音', desc: '录制语音备忘', icon: 'mic' },
  { title: '导入音视频', desc: '导入本地音视频文件', icon: 'play-circle' },
  { title: '上传文件', desc: '上传各种文件', icon: 'file-text' },
  { title: '新建知识库', desc: '创建新的知识库空间', icon: 'bag' }
])

// 处理选择事件
function handleSelect(item) {
  // 内部实现跳转逻辑
  switch (item.title) {
    case '粘贴链接':
      uni.navigateTo({ url: '/pages/index/create/link/create' })
      break
    case '拍照':
      uni.navigateTo({ url: '/pages/index/create/camera/create' })
      break
    case '上传图片':
      uni.navigateTo({ url: '/pages/index/create/picture/create' })
      break
    case '实时录音':
      uni.navigateTo({ url: '/pages/index/create/audio/create' })
      break
    case '导入音视频':
      uni.navigateTo({ url: '/pages/index/create/video/create' })
      break
    case '上传文件':
      uni.navigateTo({ url: '/pages/index/create/file/create' })
      break
    case '新建知识库':
      uni.navigateTo({ url: '/pages/index/create/knowledge/create' })
      break
  }
  handleClose()
}

// 处理关闭事件
function handleClose() {
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
    handleClose()
  }
}
</script>

<style scoped>
.popup-panel {
  background: #f5f5f5;
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
