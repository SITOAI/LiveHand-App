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
        <text class="header-title">版本更新</text>
      </view>

      <!-- 版本更新内容区域 -->
      <view class="static-body">
        <!-- 当前版本信息 -->
        <view class="version-info">
          <text class="current-version">当前版本: v{{ currentVersion }}</text>
          <text class="latest-version" v-if="hasNewVersion">最新版本: v{{ latestVersion }}</text>
        </view>

        <!-- 版本更新状态 -->
        <view class="update-status" :class="{ 'update-available': hasNewVersion, 'up-to-date': !hasNewVersion }">
          <u-icon :name="hasNewVersion ? 'download' : 'checkmark-circle'" size="20" :color="hasNewVersion ? '#007aff' : '#52c41a'" />
          <text>{{ hasNewVersion ? '发现新版本' : '当前已是最新版本' }}</text>
        </view>

        <!-- 更新按钮 -->
        <u-button 
          class="update-button" 
          :type="hasNewVersion ? 'primary' : 'default'" 
          :disabled="isUpdating || !hasNewVersion"
          @click="checkUpdate"
          :loading="isUpdating"
        >
          {{ isUpdating ? '更新中...' : (hasNewVersion ? '立即更新' : '检查更新') }}
        </u-button>

        <!-- 更新日志 -->
        <view class="update-log" v-if="showUpdateLog">
          <view class="log-title">
            <u-icon name="document-text" size="18" color="#666" />
            <text class="log-title-text">更新日志</text>
          </view>
          <view class="log-content">
            <view class="log-item" v-for="(item, index) in updateLogs" :key="index">
              <u-icon name="checkmark" size="14" color="#007aff" class="log-dot" />
              <text class="log-text">{{ item }}</text>
            </view>
          </view>
        </view>

        <!-- 更新说明 -->
        <view class="update-notice">
          <text class="notice-text">{{ updateNotice }}</text>
        </view>
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted } from 'vue'

const props = defineProps({
  show: Boolean,
  tab: Number
})
const emit = defineEmits(['update:show'])

// 响应式数据
const currentVersion = ref('1.0.0') // 当前版本
const latestVersion = ref('1.0.1')  // 最新版本
const hasNewVersion = ref(false)    // 是否有新版本
const isUpdating = ref(false)       // 是否正在更新
const showUpdateLog = ref(false)    // 是否显示更新日志
const updateNotice = ref('建议在WiFi环境下更新应用') // 更新说明
const updateLogs = ref([            // 更新日志列表
  '优化了应用性能，提升使用体验',
  '修复了已知问题',
  '增强了应用稳定性',
  '新增了部分功能'
])

// 生命周期钩子
onMounted(() => {
  // 初始化时获取应用版本信息
  initializeAppVersion()
  // 模拟检查更新
  simulateCheckUpdate()
})

// 初始化应用版本信息
function initializeAppVersion() {
  try {
    // 从manifest.json获取版本信息
    currentVersion.value = '1.0.0'
  } catch (error) {
    console.error('获取版本信息失败:', error)
  }
}

// 模拟检查更新
function simulateCheckUpdate() {
  // 随机模拟是否有新版本（80%概率有新版本）
  hasNewVersion.value = Math.random() > 0.2
  // 有新版本时显示更新日志
  if (hasNewVersion.value) {
    showUpdateLog.value = true
  }
}

// 检查更新
function checkUpdate() {
  if (isUpdating.value) return
  
  if (!hasNewVersion.value) {
    // 如果当前没有新版本，则重新检查
    isUpdating.value = true
    // 模拟检查更新的网络请求延迟
    setTimeout(() => {
      simulateCheckUpdate()
      isUpdating.value = false
      // 如果检查后仍没有新版本，显示提示
      if (!hasNewVersion.value) {
        uni.showToast({
          title: '已是最新版本',
          icon: 'none',
          duration: 2000
        })
      }
    }, 1500)
  } else {
    // 如果有新版本，则执行更新
    performUpdate()
  }
}

// 执行更新
function performUpdate() {
  isUpdating.value = true
  
  // 模拟下载和安装过程
  setTimeout(() => {
    // 模拟下载完成
    isUpdating.value = false
    
    // 显示更新完成提示
    uni.showModal({
      title: '更新完成',
      content: '应用已更新至最新版本，是否立即重启应用？',
      showCancel: true,
      cancelText: '稍后',
      confirmText: '立即重启',
      success: (res) => {
        if (res.confirm) {
          // 这里可以添加实际的应用重启逻辑
          // 在真实场景中，可能需要调用原生API进行重启
          console.log('重启应用')
          uni.showToast({
            title: '应用将重启以完成更新',
            icon: 'none',
            duration: 2000
          })
          // 关闭弹窗
          closePopup()
        }
      }
    })
  }, 3000)
}

// 关闭弹窗
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
  padding: 4vh 3vw 1vh 3vw;
}

/* 顶部返回按钮 */
.static-header {
  height: 40px;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  margin-left: 10px;
}

/* 主体内容区域 */
.static-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

/* 版本信息 */
.version-info {
  text-align: center;
  margin-bottom: 30px;
}

.current-version {
  display: block;
  font-size: 16px;
  color: #333;
  margin-bottom: 10px;
}

.latest-version {
  display: block;
  font-size: 18px;
  color: #007aff;
  font-weight: 600;
}

/* 更新状态 */
.update-status {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 30px;
  transition: background-color 0.3s;
}

.update-status.update-available {
  background-color: #e6f7ff;
}

.update-status.up-to-date {
  background-color: #f6ffed;
}

.update-status text {
  margin-left: 10px;
  font-size: 15px;
  color: #333;
}

/* 更新按钮 */
.update-button {
  margin-bottom: 30px;
  border-radius: 25px;
  font-size: 16px;
  height: 50px;
  line-height: 50px;
}

/* 更新日志 */
.update-log {
  background-color: #f5f5f5;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
}

.log-title {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.log-title-text {
  font-size: 16px;
  font-weight: 600;
  margin-left: 10px;
  color: #333;
}

.log-content {
  space: 10px;
}

.log-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  line-height: 1.5;
}

.log-dot {
  margin-right: 8px;
  margin-top: 4px;
}

.log-text {
  flex: 1;
  font-size: 14px;
  color: #666;
}

/* 更新说明 */
.update-notice {
  text-align: center;
}

.notice-text {
  font-size: 13px;
  color: #999;
}
</style>
