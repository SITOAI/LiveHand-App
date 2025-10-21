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

// 控制创建知识库模态框显示
const showCreateModal = ref(false)

// 知识库数据
const knows = ref([])

// Mock数据 - 作为接口请求失败的备用数据
const mockKnows = [
  {
    id: 1,
    name: '法律知识库',
	user: 'lihua',
    time: '2025-06-26',
    prompt: '西安视途科技有限公司致力于通过本运营方案，明确公司在文化传媒领域的发展方向和战略目标。本方案涵盖《大国典藏》文创项目、《长安梦华录》文创项目、《长安梦华录》动画电影项目，以及旨在培养新兴导演人才的雏鹰计划。《大国典藏》文创项目，旨在记录和传播非物质文化遗产，强化民族文化自信。《长安梦华录》文创项目，将深入挖掘长安的历史文化资源，通过视频形式讲述长安的故事。《长安梦华录》动画电影项目，通过动画电影这一创新载体，吸引年轻观众，拓宽文化影响力。雏鹰计划为年轻导演提供技术、资金支持，以及创作平台，旨在发掘和培养具有潜力的导演人才，共同创作出有深度、有影响力的作品。通过这一计划，公司将促进内部创新，同时为行业输送新鲜血液。',
    count: '123',
	users: '8',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '法律', type: 'success' }
    ]
  },
  {
    id: 2,
    name: '政务知识库',
  	user: 'lihua',
    time: '2025-06-27',
    prompt: '政务知识库汇聚政策法规、办事指南等权威信息，助力高效政务服务与智能决策。',
    count: '234',
  	users: '10',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '政务', type: 'success' }
    ]
  },
  {
    id: 3,
    name: '医疗知识库',
  	user: 'lihua',
    time: '2025-07-01',
    prompt: '医疗知识库是集成医学文献、临床指南、疾病诊疗方案、药品信息等多维度内容的智能平台，旨在为医务人员提供科学、权威、实时的知识支持。通过结构化整理和智能检索，医生可快速获取所需医学信息，提升诊疗效率和决策质量；患者也能通过知识库获取通俗易懂的健康知识，增强健康意识与自我管理能力。医疗知识库是推动医疗信息化、精准医疗和智慧医疗建设的重要基础设施。',
    count: '901',
  	users: '16',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '医疗', type: 'success' }
    ]
  },
  {
    id: 4,
    name: 'AI知识库',
  	user: 'lihua',
    time: '2025-07-02',
    prompt: 'AI知识库是集成人工智能领域前沿研究成果、算法模型、应用案例及技术文档的综合性平台，涵盖机器学习、深度学习、自然语言处理、计算机视觉等多个方向。通过结构化组织与智能检索，帮助开发者、研究人员和企业快速获取所需知识，提升研发效率与创新能力。AI知识库不仅支持技术共享与协同发展，还可结合具体业务场景，提供定制化的智能解决方案，是推动人工智能技术落地和普及的重要支撑工具。',
    count: '762',
  	users: '21',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '技术', type: 'success' }
    ]
  },
  {
    id: 5,
    name: '高考知识库',
  	user: 'lihua',
    time: '2025-06-22',
    prompt: '汇总历年高考信息，获取各大高校录取信息，根据分科排名推荐名校专业。',
    count: '142',
  	users: '7',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '教育', type: 'success' }
    ]
  },
  {
    id: 7,
    name: '新闻知识库',
  	user: 'lihua',
    time: '2025-06-06',
    prompt: '关注国际热点新闻。',
    count: '65',
  	users: '3',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '新闻', type: 'success' }
    ]
  }
]

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
