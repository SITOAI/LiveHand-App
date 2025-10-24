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
          <text class="current-version">当前版本: V{{ currentVersion }}</text>
          <text class="latest-version" v-if="props.hasNewVersion">最新版本: V{{ props.latestVersion }}</text>
        </view>

        <!-- 版本更新状态 -->
        <view class="update-status" :class="{ 'update-available': props.hasNewVersion, 'up-to-date': !props.hasNewVersion }">
          <u-icon :name="props.hasNewVersion ? 'download' : 'checkmark-circle'" size="20" :color="props.hasNewVersion ? '#007aff' : '#52c41a'" />
          <text>{{ props.hasNewVersion ? '发现新版本' : '当前已是最新版本' }}</text>
        </view>

        <!-- 更新按钮 -->
        <u-button 
          class="update-button" 
          :type="props.hasNewVersion ? 'primary' : 'default'" 
          :disabled="isUpdating"
          @click="props.hasNewVersion ? performUpdate() : showUpToDateMessage()"
          :loading="isUpdating"
        >
          {{ isUpdating ? '更新中...' : (props.hasNewVersion ? '立即更新' : '检查更新') }}
        </u-button>

        <!-- 更新日志 -->
        <view class="update-log" v-if="showUpdateLog">
          <view class="log-title">
            <u-icon name="document-text" size="18" color="#666" />
            <text class="log-title-text">更新日志</text>
          </view>
          <view class="log-content">
            <view class="log-item" v-for="(item, index) in props.updateLogs" :key="index">
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
import { defineProps, defineEmits, ref, onMounted, watch } from 'vue'
import http from '../../utils/http.js'

const props = defineProps({
  show: Boolean,
  tab: Number,
  updateInfo: Object,
  hasNewVersion: Boolean,
  latestVersion: String,
  updateLogs: Array
})
const emit = defineEmits(['update:show'])


// 响应式数据
const currentVersion = ref('1.0.0') // 当前版本
const isUpdating = ref(false)       // 是否正在更新
const showUpdateLog = ref(false)    // 是否显示更新日志
const updateNotice = ref('建议在WiFi环境下更新应用') // 更新说明

// 生命周期钩子
onMounted(() => {
  // 初始化时获取应用版本信息
  initializeAppVersion()
})

// 监听props变化
watch(() => props.updateLogs, (newLogs) => {
  if (newLogs && newLogs.length > 0) {
    showUpdateLog.value = true
  } else {
    showUpdateLog.value = false
  }
}, { immediate: true })

// 初始化应用版本信息
function initializeAppVersion() {
  try {
    // 默认版本号
    currentVersion.value = '1.0.0'
    
    // 如果在App平台运行，使用plus.runtime.getProperty获取应用信息
    if (typeof plus !== 'undefined') {
      try {
        // 使用plus.runtime.getProperty获取应用信息，包括配置的版本号
        plus.runtime.getProperty(plus.runtime.appid, function(info) {
          if (info && info.version) {
            currentVersion.value = info.version
          }
        })
      } catch (err) {
      }
    }
  } catch (error) {
    // 出错时使用默认值
    currentVersion.value = '.0.0'
  }
}

// 显示已是最新版本提示
function showUpToDateMessage() {
  uni.showToast({
    title: '已是最新版本',
    icon: 'none',
    duration: 2000
  })
}

// 检查更新 - 外部调用版本更新接口
async function checkUpdate() {
  if (isUpdating.value) return
  
  isUpdating.value = true
  
  try {
    // 准备请求参数
    let packageName = '__UNI__34CDEE1' // 默认包名
    
    try {
      if (typeof plus !== 'undefined') {
        // 判断是否为生产环境
        const isProduction = process.env.NODE_ENV === 'production'
        
        // 开发环境使用固定包名，生产环境使用plus.runtime.appid
        if (isProduction) {
          // 生产环境使用plus.runtime.appid并格式化为所需格式
            // 移除__UNI__前缀和下划线，格式化为uni.app.UNIXXX格式
            const rawAppId = plus.runtime.appid || '__UNI__34CDEE1'
            packageName = rawAppId.replace(/^__UNI__/, 'uni.app.UNI')
        } else {
          // 开发环境使用默认包名并格式化为所需格式
          packageName = 'uni.app.UNI34CDEE1'
        }
      }
    } catch (err) {
    }
    
    const params = {
      package_name: packageName,
      current_version: currentVersion.value
    }
    
    // 调用版本更新接口
    const response = await http.request('/livehands/check_update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    
    // 处理响应数据
    if (response && response.code === 200) {
      updateInfo.value = response.data
      latestVersion.value = response.data.version
      
      // 判断是否需要更新
      hasNewVersion.value = response.data.need_update === 1
      
      // 解析更新日志 - 以分号分隔每个更新内容
      if (response.data.change_notes) {
        // 同时支持英文分号(;)和中文分号(；)作为分隔符
        // 使用正则表达式分割，确保兼容两种分号
        // 同时支持英文分号(;)和中文分号(；)作为分隔符
        updateLogs.value = response.data.change_notes.split(/[;；]/)
          .map(item => item.trim())
          .filter(item => item.length > 0)
        showUpdateLog.value = updateLogs.value.length > 0
      }
      
      // 如果不需要更新，显示提示
      if (!hasNewVersion.value) {
        uni.showToast({
          title: '已是最新版本',
          icon: 'none',
          duration: 2000
        })
      }
    } else {
      uni.showToast({
        title: response?.msg || '检查更新失败',
        icon: 'none',
        duration: 2000
      })
    }
  } catch (error) {
    uni.showToast({
      title: '网络异常，请稍后重试',
      icon: 'none',
      duration: 2000
    })
  } finally {
    isUpdating.value = false
  }
}

// 执行更新
function performUpdate() {
  // 检查更新信息和下载地址是否存在
  if (!props.updateInfo || !props.updateInfo.direct_download_url) {
    uni.showToast({
      title: '更新包地址无效',
      icon: 'none',
      duration: 2000
    })
    return
  }
  
  isUpdating.value = true
  
  // 下载更新包
  uni.downloadFile({
    // 使用direct_download_url进行下载
    url: props.updateInfo.direct_download_url,
    success: (res) => {
      console.log("555555555555555555:", res)
      isUpdating.value = false
      
      if (res.statusCode === 200) {
        // 下载成功，开始安装
        if (uni.canIUse('installApp')) {
          // 对于支持installApp的平台
          uni.installApp({
            filePath: res.tempFilePath,
            success: () => {
            },
            fail: (err) => {
              uni.showToast({
                title: '应用安装失败',
                icon: 'none',
                duration: 2000
              })
            }
          })
        } else {
          // 对于不支持installApp的平台，提示用户手动安装
          uni.showModal({
            title: '下载完成',
            content: '请点击确定手动安装应用',
            showCancel: false,
            success: () => {
              // 在实际场景中，可能需要根据平台进行不同处理
              console.log('引导用户手动安装')
            }
          })
        }
      } else {
        uni.showToast({
          title: '下载失败',
          icon: 'none',
          duration: 2000
        })
      }
    },
    fail: (err) => {
      isUpdating.value = false
      console.error('下载更新包失败:', err)
      uni.showToast({
        title: '下载失败，请检查网络',
        icon: 'none',
        duration: 2000
      })
    }
  })
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
