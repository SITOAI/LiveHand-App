<template>
  <view class="knows-container">
	<KnowCard
	  v-for="know in knows"
	  :key="know.id"
	  :name="know.name"
	  :prompt="know.prompt"
	  :avatar="know.avatar"
	  :count="know.count"
	  :itemId="know.id"
	>
	</KnowCard>
  </view>
    <!-- 初次登录引导模态框 -->
    <view  v-if="showCreateModal" class="create-modal-overlay">
      <view class="create-modal-content">
        <!-- 文件夹图标 -->
        <view class="folder-icon-wrapper">
          <image src="/static/folder.png" class="folder-icon" mode="aspectFit"></image>
          <view class="star-animation">✨</view>
        </view>
        
        <!-- 提示文本气泡 -->
        <view class="bubble-text">点击加号创建自己的知识库</view>
        
        <!-- 连接线 -->
        <view class="connection-line">
          <view class="dashed-line"></view>
          <view class="circle"></view>
          <view class="solid-line"></view>
        </view>
        
        <!-- 关闭按钮 -->
        <button class="close-button" @click="closeModal">我知道了</button>
      </view>
    </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import http from '../../../../utils/http.js'
import KnowCard from '@/components/cards/KnowCard.vue' // 按需调整路径
import { mockKnows } from '../../../../utils/mock/knowsData.js'

// 控制创建知识库模态框显示
const showCreateModal = ref(false)

// 知识库数据
const knows = ref([])

// 从接口获取知识库数据
function getKnowsData() {
  // 从本地存储获取token
  const token = uni.getStorageSync('token');
  const params = {
    token: token
  }
  // 调用接口获取知识库列表
  http.post("/livehands/knowledge/query", params).then(result => {
    // 检查响应状态
    if (result.code === 200) {
      // 处理接口返回的数据，转换为需要的格式
      const formattedKnows = result.data.body.data.map((item, index) => ({
        id: item._id || index + 1,
        name: item.name || '未命名知识库',
        count: item.fileTotal || 0,
        avatar: '/static/foldery.png',
        // avatar: item.avatar || '/static/foldery.png',
        prompt: item.intro || '知识库描述',
      }))
      
      knows.value = formattedKnows
    } else {
      // 如果接口返回的数据格式不正确，使用mock数据
      uni.showToast({ title: '获取知识库数据失败，使用本地数据', icon: 'none' })
      knows.value = mockKnows
    }
  }).catch(error => {
    // 请求失败时使用mock数据
    console.error('获取知识库数据出错:', error)
    uni.showToast({ title: '网络错误，使用本地数据', icon: 'error' })
    knows.value = mockKnows
  })
}



// 在组件挂载时检查是否是首次登录
onMounted(() => {
  // 使用UniApp原生存储API检查是否首次访问
  const hasVisitedKnowledge = uni.getStorageSync('hasVisitedKnowledge')
  if (!hasVisitedKnowledge) {
    // 延迟显示，确保页面已经加载完成
    setTimeout(() => {
      showCreateModal.value = true
    }, 500)
  }
})

// 关闭模态框
const closeModal = () => {
  showCreateModal.value = false
  // 使用UniApp原生存储API记录用户已查看过引导
  uni.setStorageSync('hasVisitedKnowledge', 'true')
}

// 页面加载时获取数据
onLoad(() => {
  getKnowsData()
})
</script>

<style scoped>
.knows-container {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  min-height: 70vh;
  max-height: calc(100vh - 240rpx); /* 考虑底部tabbar高度 */
  overflow-y: auto;
  padding: 20rpx 20rpx 40rpx 20rpx; /* 增加底部内边距确保内容不被tabbar遮挡 */
}

/* 模态框样式 */
.create-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.create-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
}

/* 文件夹图标 */
.folder-icon-wrapper {
  position: relative;
  margin-bottom: 10rpx;
}

.folder-icon {
  width: 120rpx;
  height: 120rpx;
  background-color: #e8f4ff;
  border-radius: 24rpx;
  padding: 20rpx;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

/* 星星动画 */
.star-animation {
  position: absolute;
  right: -10rpx;
  top: -10rpx;
  font-size: 36rpx;
  animation: twinkle 2s infinite;
  z-index: 2;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.8);
  }
}

/* 气泡文本 */
.bubble-text {
  background-color: #fff;
  padding: 20rpx 40rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  color: #333;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 10rpx;
  position: relative;
}

.bubble-text::after {
  content: '';
  position: absolute;
  bottom: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20rpx solid transparent;
  border-right: 20rpx solid transparent;
  border-top: 10rpx solid #fff;
}

/* 连接线 */
.connection-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10rpx;
  height: 80rpx;
  z-index: 1001;
}

.dashed-line {
  width: 4rpx;
  height: 40rpx;
  background-image: linear-gradient(to bottom, #999 50%, transparent 50%);
  background-size: 4rpx 10rpx;
}

.circle {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background-color: #fff;
  border: 3rpx solid #999;
  margin: 8rpx 0;
}

.solid-line {
  width: 4rpx;
  height: 12rpx;
  background-color: #999;
}

/* 关闭按钮 */
.close-button {
  background-color: #fff;
  border: 2rpx solid #ddd;
  padding: 20rpx 50rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  color: #333;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  outline: none;
  pointer-events: auto;
  z-index: 1001;
}

.close-button:active {
  background-color: #e0e0e0;
}
</style>
