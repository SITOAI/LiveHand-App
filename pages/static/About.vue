<template>
  <u-popup
    :close-on-click-overlay="false"
    :show="show"
    mode="left"
    :overlay="true"
    :closeable="false"
    :safe-area-inset-left="true"
    @close="closePanel"
    @update:show="val => emit('update:show', val)"
  >
    <view class="panel-wrapper" @touchstart="onTouchStart" @touchend="onTouchEnd">
      <!-- 顶部栏 -->
      <view class="panel-header">
        <text class="header-title">关于我们</text>
        <u-icon name="close-circle" size="28" @click="closePanel" />
      </view>

      <!-- 内容区域 -->
      <scroll-view scroll-y class="common-wrapper">
        <!-- Logo & 版本 -->
        <view class="logo-section">
          <image class="logo" src="/static/logo.png" mode="widthFix" />
          <text class="app-name">LiveHand</text>
          <text class="version">v{{ version }}</text>
        </view>

        <!-- 菜单列表 -->
        <view class="section">
          <view class="section-title">法律信息</view>
          <view class="section-body">
            <view @click="openUser"><MenuItem title="用户服务协议" icon="file-text" :isOk="true" /></view>
            <view @click="openPrivacy"><MenuItem title="隐私政策" icon="lock" :isOk="true" /></view>
          </view>
        </view>
		
		<!-- Panel -->
		<UserPanel v-model:show="showUserPanel" />
		<PrivacyPanel v-model:show="showPrivacyPanel" />
      </scroll-view>

      <!-- 底部信息 -->
      <view class="somthing-info">
        <text>西安视途科技有限公司 版权所有 © 2025</text>
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { ref } from 'vue'
import MenuItem from '../../components/children/MenuItem.vue'

// 引入对应的Panel组件（模仿原代码结构）
import UserPanel from './User.vue'
import PrivacyPanel from './Privacy.vue'


const props = defineProps({ show: Boolean })
const emit = defineEmits(['update:show'])

const version = ref('2.0.1')

// 定义各Panel的显示状态（模仿原代码ref声明方式）
const showUserPanel = ref(false)
const showPrivacyPanel = ref(false)

// 手势关闭逻辑（完全模仿原代码）
let startX = 0, startY = 0
function onTouchStart(e) {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
}
function onTouchEnd(e) {
  const deltaX = e.changedTouches[0].clientX - startX
  const deltaY = Math.abs(e.changedTouches[0].clientY - startY)
  if (deltaX < -60 && deltaY < 30) closePanel()
}

function closePanel() {
  emit('update:show', false)
}

// 打开各Panel的方法（完全模仿原代码逻辑）
function openUser() {
  showUserPanel.value = true
}
function openPrivacy() {
  showPrivacyPanel.value = true
}
</script>

<style scoped>
/* 完全继承原代码的样式 */
.panel-wrapper {
  width: 90vw;
  height: 95vh;
  background-color: #ebeff2;
  display: flex;
  flex-direction: column;
  padding: 5vh 5vw 0;
  border-radius: 10px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1vh 3vw;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(204,204,204,0.53);
}
.header-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.common-wrapper {
  flex: 1;
  overflow-y: scroll;
}
.section {
  margin-top: 16px;
}
.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  padding-bottom: 8px;
}
.section-body {
  background-color: #f8f8f8;
  border-radius: 10px;
}
.somthing-info {
  padding-bottom: 2vh;
  font-size: 10px;
  color: #ccc;
  text-align: center;
}

/* 关于我们特有样式（模仿原代码） */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
  background-color: #fff;
  border-radius: 10px;
  margin-bottom: 16px;
}
.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 12px;
  border-radius: 12px;
  background-color: #409EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32px;
}
.app-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}
.version {
  font-size: 14px;
  color: #909399;
}
</style>