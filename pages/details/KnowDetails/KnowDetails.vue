<template>
  <view class="note-details-page">
    <!-- 顶部固定区域：图标、Header、Tabs -->
    <view class="top-fixed-header">
      <!-- 顶部图标 -->
      <view class="top-icon-row">
        <u-icon name="arrow-left" size="24" @click="goBack" />
        <view class="right-icons">
          <image src="../../../static/share.png" class="folder-icon" mode="aspectFit" @click="onShare"></image>
          <image src="../../../static/more_explore.png" class="folder-icon" mode="aspectFit" @click="showMore = true"></image>
        </view>
      </view>

      <!-- Header 卡片 -->
      <view class="note-header-card">
        <view class="note-title-row">
          <image :src="avatar" class="knowledge-img" mode="aspectFit" />
          <text class="note-title">{{ name }}</text>
          <u-icon name="edit-pen" size="18" @click="showEdit = true" />
        </view>
        
        <!-- 新增 prompt 显示 -->
        <view class="note-prompt">{{ prompt }}</view>
        
        <!-- 底部一行，标签 | 时间 | @用户名 -->
        <!-- <view class="note-footer-row">
          <view class="note-tags">
            <u-tag
			    shape="circle"
              v-for="(tag, i) in tags"
              :key="i"
              :text="tag.text"
              :type="tag.type"
              size="mini"
              plain
            />
          </view>
          <text class="note-footer-separator">|</text>
          <text class="note-time">{{ time }}</text>
          <text class="note-footer-separator">|</text>
          <text class="note-user">@{{ user }}</text>
        </view> -->
      </view>
      
      <!-- Tabs栏 -->
      <u-tabs
        :list="tabList"
        :current="activeTab"
        lineWidth="150"
        lineColor="#000"
        @change="handleTabChange"
        :scrollable="false"
      />
    </view>

    <!-- Swiper 内容区 -->
    <view
      class="tab-content-wrapper"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <swiper
        class="tab-swiper"
        :current="activeTab"
        @change="onSwiperChange"
        :indicator-dots="false"
      >
        <swiper-item>
          <scroll-view scroll-y class="tab-inner-scroll">
            <view class="notes-container">
              <NoteCard
                v-for="note in notes"
                :key="note.id"
                :title="note.title"
                :time="note.time"
                :content="note.content"
                :repo="note.repo"
                :musice="note.musice"
                :tags="note.tags"
                :handmould="note.handmould"
                :summary="note.summary"
              />
            </view>
          </scroll-view>
        </swiper-item>
        <swiper-item>
          <scroll-view scroll-y class="tab-inner-scroll">
            <!-- 文件标签页内容 -->
            <view class="file-list">
              <view class="file-tabs">
                <view class="file-tab" :class="{ active: activeFileTab === 'all' }" @click="handleFileTabChange('all')">全部</view>
                <view class="file-tab" :class="{ active: activeFileTab === 'file' }" @click="handleFileTabChange('file')">文件</view>
                <view class="file-tab" :class="{ active: activeFileTab === 'audio' }" @click="handleFileTabChange('audio')">音频</view>
                <view class="file-tab" :class="{ active: activeFileTab === 'image' }" @click="handleFileTabChange('image')">图片</view>
              </view>
              
              <!-- 文件列表 -->
              <view class="file-items">
                <view v-if="files.length === 0" class="no-files">
                  <text>暂无文件</text>
                </view>
                <view v-for="file in filteredFilesList" :key="file.id" class="file-item">
                  <image :src="getFileIconPath(file.type)" class="file-icon" mode="aspectFit"></image>
                  <view class="file-item-info">
                    <text class="file-item-name">{{ file.name }}</text>
                    <text class="file-item-meta">{{ file.uploadTime || formatDate(new Date()) }}</text>
                  </view>
                  <u-icon name="arrow-downward" size="16" color="#2E5CE7" class="file-item-more"></u-icon>
                </view>
              </view>
            </view>
          </scroll-view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 底部聊天栏 -->
    <!-- <view class="chatbar" v-if="!chatPopupVisible">
      <view class="fake-input" @click="chatPopupVisible = true">
        <u-icon name="star" size="22" />
        <text class="fake-input-text">向LiveHands提问...</text>
      </view>
      <TalkButton @click="onTalkWithAI">发送</TalkButton>
    </view> -->

    <!-- 更多操作 popup -->
    <u-popup :show="showMore" mode="bottom" @close="showMore = false" />

    <!-- 编辑弹窗 -->
    <u-modal
      :show="showEdit"
      title="编辑笔记"
      @confirm="showEdit = false"
      @cancel="showEdit = false"
    >
      <view style="padding: 20px;">编辑笔记弹窗内容</view>
    </u-modal>

    <!-- 聊天 popup -->
    <u-popup
      :show="chatPopupVisible"
      mode="bottom"
      :safe-area-inset-bottom="true"
      :overlay="true"
      :custom-style="{
        height: '95vh',
        borderTopLeftRadius: '20rpx',
        borderTopRightRadius: '20rpx',
        overflow: 'hidden'
      }"
      @close="chatPopupVisible = false"
    >
      <scroll-view style="height: 100%" scroll-y>
        <LiveChat
          class="note-detail-live-chat"
          :height="'80vh'"
          :showHeader="true"
          :title="title"
          @onClose="handleCloseChat"
          :sourcePage="'knowDetails'"
          :datasetId="itemId"
        />
      </scroll-view>
    </u-popup>
    <!-- AI提问浮动按钮 -->
    <view class="ai-question-button" @click="showAiChat">
      <view class="ai-icon-wrapper">
        <image src="../../../static/AI.png" class="ai-icon" mode="aspectFit"></image>
      </view>
      <text class="question-text">提问</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TalkButton from '../../../components/children/TalkButton.vue'
import LiveChat from '../../../components/chat/LiveChat.vue'
import NoteCard from '../../../components/cards/NoteCard.vue'
import http from '../../../utils/http.js'

const activeTab = ref(0)
const lastTab = ref(0)

// 添加当前激活的文件标签
const activeFileTab = ref('all')

const tabList = [
  { name: '笔记' },
  { name: '文件' }
]

const files = ref([
  {
    id: 1,
    name: '2025年AI技术趋势深度报告.pdf',
    type: 'pdf',
    uploadTime: '2025-06-01 14:23',
    preview: '/static/previews/pdf-preview.png'
  },
  {
    id: 2,
    name: '项目流程图设计稿.png',
    type: 'image',
    uploadTime: '2025-05-29 09:11',
    preview: '/static/previews/image-preview.png'
  },
  {
    id: 3,
    name: '数据统计表2025年Q2.xlsx',
    type: 'excel',
    uploadTime: '2025-06-15 16:45',
    preview: '/static/previews/excel-preview.png'
  }
])

const showMore = ref(false)
const showEdit = ref(false)
const chatPopupVisible = ref(false)

// 笔记数据
const notes = ref([])

// Mock数据 - 作为接口请求失败的备用数据
const mockNotes = [
  {
    id: 1,
    title: 'AI研究记录',
    time: '2025-06-26 08:30',
    content: '西安视途科技有限公司是一家专注于 AI Agent 和 大模型核心技术研发 的人工智能企业，成立于2024年8月20号.',
    handmould: 'AI研究记录手抄内容：视途科技专注于AI Agent和大模型核心技术研发，成立于2024年8月20日。公司在AI领域有丰富的经验和技术积累。',
    summary: 'AI研究记录总结：视途科技是一家专注于人工智能核心技术的企业，尤其在AI Agent和大模型方面有深入研究，成立时间为2024年8月20日。',
    repo: '默认知识库',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '技术', type: 'warning' }
    ]
  },
  {
    id: 2,
    title: '多模态智能体总结',
    time: '2025-06-25 10:00',
    content: '我们目前在多模态智能体方面的研究集中在图像、语音、文本的融合交互上，并结合 LLM 的上下文管理能力展开实验。',
    handmould: '多模态智能体总结手抄内容：当前研究重点在于图像、语音、文本三种模态的融合交互，同时结合大语言模型的上下文管理能力进行实验和开发。',
    summary: '多模态智能体研究总结：团队正在进行多模态智能体的研究，主要关注图像、语音和文本的融合交互，并结合大语言模型的上下文管理能力开展实验工作。',
    repo: '默认知识库',
    musice:true,
    tags: [
      { text: '多模态', type: 'warning' },
      { text: '架构', type: 'warning' }
    ]
  },
  {
    id: 3,
    title: '知识图谱接入实验',
    time: '2025-06-24 14:00',
    content: '目前已完成 LiveKG 与 LiveAgent 的初步打通，验证了智能体对接图谱后的检索调用效果。',
    handmould: '知识图谱接入实验手抄内容：成功完成LiveKG与LiveAgent的初步对接，测试结果表明智能体能够有效检索和调用图谱中的知识。',
    summary: '知识图谱接入实验总结：项目团队已经成功实现了LiveKG知识图谱与LiveAgent智能体的初步集成，验证了智能体能够有效检索和利用图谱中的知识。',
    repo: '默认知识库',
    tags: [
      { text: '图谱', type: 'warning' },
      { text: '智能检索', type: 'warning' }
    ]
  },
  {
    id: 4,
    title: '部署方案调研',
    time: '2025-06-23 16:00',
    content: '对比本地化部署、私有云、混合云三种部署方式的性能、稳定性和接入成本，为下季度客户部署做好准备。',
    handmould: '部署方案调研手抄内容：对本地化部署、私有云和混合云三种模式进行了全面对比，分析了各自的性能表现、系统稳定性和接入成本。',
    summary: '部署方案调研总结：针对客户需求，对本地化部署、私有云和混合云三种部署方式进行了详细对比，包括性能、稳定性和接入成本等方面，为下季度的客户部署提供了决策依据。',
    repo: '部署与运维',
    tags: [
      { text: '本地化', type: 'warning' },
      { text: '私有云', type: 'warning' }
    ]
  },
  {
    id: 5,
    title: '插件系统扩展记录',
    time: '2025-06-22',
    content: '新增 MCP 插件适配能力，支持按模板生成 Word、Excel 等文档，已完成测试。',
    handmould: '插件系统扩展记录手抄内容：成功扩展了MCP插件适配功能，现在可以根据模板自动生成Word、Excel等办公文档，并已通过内部测试。',
    summary: '插件系统扩展总结：插件系统新增了MCP插件适配能力，实现了根据模板自动生成Word、Excel等文档的功能，目前已完成所有测试工作。',
    repo: '插件系统',
    tags: [
      { text: '插件', type: 'warning' },
      { text: '模板', type: 'warning' }
    ]
  },
  {
    id: 6,
    title: '知识专利',
    time: '2025-06-22',
    content: '本知识专利记录了某领域核心技术的创新方法与实现路径，涵盖算法设计、系统架构及应用场景，具有独创性与实用价值，为相关技术研发与产业化提供知识产权保障。',
    handmould: '知识专利手抄内容：本专利涵盖了某领域核心技术的创新方法与实现路径，包括算法设计、系统架构和应用场景等方面，具有很高的独创性和实用价值。',
    summary: '知识专利总结：本知识专利详细记录了某领域核心技术的创新方法与实现路径，内容涵盖算法设计、系统架构及应用场景，具有显著的独创性和实用价值，为相关技术的研发与产业化提供了重要的知识产权保障。',
    repo: '知识专利',
    tags: [
      { text: '知识专利', type: 'primary' },
      { text: '法律', type: 'success' }
    ]
  }
]

// Mock文件数据 - 作为接口请求失败的备用数据
const mockFiles = [
  {
    id: 1,
    name: '项目需求文档.docx',
    type: 'file',
    uploadTime: '2025-12-30 12:56'
  },
  {
    id: 2,
    name: '会议录音.mp3',
    type: 'audio',
    uploadTime: '2025-12-30 12:56'
  },
  {
    id: 3,
    name: '产品设计图.png',
    type: 'image',
    uploadTime: '2025-12-30 12:56'
  }
]

// 从接口获取笔记数据
function getNotesData() {
  // 从本地存储获取token和用户信息，添加错误处理
  const token = uni.getStorageSync('token');
  const userInfo = uni.getStorageSync('userInfo') || {};
  const userId = userInfo.knowledge_user_id ? String(userInfo.knowledge_user_id) : '';
  const params = {
    token: token,
    liveKnowledge_user_id: userId,
    dataset_id: options.dataset_id || ''
  }
  // 调用接口获取笔记列表
  http.post("/livehands/note/list", params).then(result => {
    // 检查响应状态
    if (result.code === 200 && result.data && Array.isArray(result.data)) {
      // 处理接口返回的数据，转换为需要的格式
      const formattedNotes = result.data.map((item, index) => ({
        id: item.info.id || index + 1,
        title: item.info.note_title || '未命名笔记',
        time: item.info.note_created_datetime || new Date().toLocaleString(),
        content: item.info.note_description || '',
        handmould: item.content.note_content || '',
        summary: item.content.note_summary || '',
        repo: item.info.dataset_name || '暂无知识库分类',
        musice: item.musice || false,
        // 确保tags格式正确，转换为NoteCard组件期望的格式
        tags: formatTags(item.info.note_tags)
      }))
      
      notes.value = formattedNotes 
    } else {
      // 如果接口返回的数据格式不正确，使用mock数据
      uni.showToast({ title: '获取笔记数据失败，使用本地数据', icon: 'none' })
      notes.value = mockNotes
    }
  }).catch(error => {
    // 请求失败时使用mock数据
    console.error('获取笔记数据出错:', error)
    uni.showToast({ title: '网络错误，使用本地数据', icon: 'error' })
    notes.value = mockNotes
  })
}

// 从接口获取文件数据
function getFilesData() {
  // 从本地存储获取token
  const token = uni.getStorageSync('token');
  const params = {
    token: token,
    dataset_id: itemId.value || ''
  }
  
  // 调用接口获取文件列表
  http.post("/livehands/dataset/search", params).then(result => {
    // 检查响应状态
    if (result.code === 200 && result.data && Array.isArray(result.data)) {
      // 处理接口返回的数据，转换为需要的格式
      const formattedFiles = result.data.map((item, index) => ({
        id: item.id || index + 1,
        name: item.name || '未命名文件',
        type: getItemType(item.type || 'file'), // 转换为我们需要的类型
        uploadTime: item.uploadTime || formatDate(new Date())
      }))
      
      files.value = formattedFiles
    } else {
      // 如果接口返回的数据格式不正确，使用mock数据
      // uni.showToast({ title: '获取文件数据失败，使用本地数据', icon: 'none' })
      files.value = mockFiles
    }
  }).catch(error => {
    // 请求失败时使用mock数据
    // uni.showToast({ title: '网络错误，使用本地数据', icon: 'error' })
    files.value = mockFiles
  })
}

// 获取文件图标路径
function getFileIconPath(type) {
  switch (type) {
    case 'file':
      return '/static/folder.png';
    case 'audio':
      return '/static/notes/audio.png';
    case 'image':
      return '/static/notes/picture.png';
    default:
      return '/static/folder.png';
  }
}

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

// 转换文件类型
function getItemType(originalType) {
  if (!originalType) return 'file';
  
  const type = originalType.toLowerCase();
  if (type.includes('audio') || type.includes('video') || type.includes('sound')) {
    return 'audio';
  } else if (type.includes('image') || type.includes('photo') || type.includes('picture')) {
    return 'image';
  } else {
    return 'file';
  }
}

// 根据文件标签过滤文件
const filteredFilesList = computed(() => {
  if (activeFileTab.value === 'all') {
    return files.value;
  } else {
    return files.value.filter(file => file.type === activeFileTab.value);
  }
})

// 格式化标签数据，确保符合NoteCard组件期望的格式
function formatTags(tagData) {
  // 如果标签数据为空或不是数组，返回空数组
  if (!tagData || !Array.isArray(tagData)) {
    return []
  }
  
  // 处理标签数据
  return tagData.map(tag => {
    // 如果标签是字符串，转换为对象格式
    if (typeof tag === 'string') {
      return {
        text: tag,
        type: 'warning' // 默认使用warning类型
      }
    }
    // 如果标签是对象但没有text属性，使用空字符串
    else if (typeof tag === 'object' && !tag.text) {
      return {
        text: '',
        type: 'warning'
      }
    }
    // 标签已经是正确的格式
    return tag
  }).filter(tag => tag.text) // 过滤掉空标签
}

const itemId = ref('')
const avatar = ref('')
const name = ref('')
const time = ref('')
const repo = ref('')
const user = ref('')
const tags = ref([])
const prompt = ref([])

// 定义options变量用于存储页面参数
let options = {}

onLoad((pageOptions) => {
  options = pageOptions
	console.log(options)
  itemId.value = decodeURIComponent(options.id || '')
  avatar.value = decodeURIComponent(options.avatar || '')
  name.value = decodeURIComponent(options.name || '')
  time.value = options.time || ''
  // repo.value = decodeURIComponent(options.repo || '')
  // user.value = decodeURIComponent(options.user || '')
  prompt.value = decodeURIComponent(options.prompt || '') // 新增prompt绑定
  try {
    tags.value = JSON.parse(decodeURIComponent(options.tags || '[]'))
  } catch (e) {
    tags.value = []
  }
  
  // 页面加载时获取数据
  getNotesData()
  getFilesData()
})

function onTalkWithAI() {
  console.log('功能暂未开放')
}

function handleCloseChat() {
  chatPopupVisible.value = false
  console.log('用户点击了关闭按钮')
}

function goBack() {
  uni.navigateBack()
}
function onShare() {
  uni.showToast({ title: '点击分享', icon: 'none' })
}

// AI提问按钮点击事件
function showAiChat() {
  chatPopupVisible.value = true
  console.log('打开AI聊天面板')
}

// 文件标签切换方法
function handleFileTabChange(tabType) {
  activeFileTab.value = tabType
  console.log('切换到文件标签：', tabType)
  // 这里可以根据不同的标签类型过滤显示不同的文件
}

function handleTabChange(tab) {
  lastTab.value = activeTab.value
  activeTab.value = tab.index
}

function onSwiperChange(e) {
  lastTab.value = activeTab.value
  activeTab.value = e.detail.current
}

function getFileIcon(type) {
  switch (type) {
    case 'pdf':
      return 'file-text' // uView 内置图标名
    case 'image':
      return 'photo'
    case 'excel':
      return 'file-excel'
    default:
      return 'file'
  }
}

function confirmDelete(id) {
  uni.showModal({
    title: '确认删除',
    content: '是否要删除该文件？',
    confirmColor: '#f56c6c',
    success(res) {
      if (res.confirm) {
        deleteFile(id)
      }
    }
  })
}

function deleteFile(id) {
  files.value = files.value.filter(file => file.id !== id)
}

const searchKeyword = ref('')

// 计算属性：根据关键词过滤文件
const filteredFiles = computed(() => {
  if (!searchKeyword.value.trim()) {
    return files.value
  }
  return files.value.filter(file =>
    file.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 监听输入变化（可选）
function onSearchChange(val) {
  searchKeyword.value = val
}

// 手势滑动控制退出与切换
let startX = 0
let startY = 0
let startTabIndex = 0

function onTouchStart(e) {
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  startTabIndex = activeTab.value
}
function onTouchEnd(e) {
  const endX = e.changedTouches[0].clientX
  const endY = e.changedTouches[0].clientY
  const deltaX = endX - startX
  const deltaY = Math.abs(endY - startY)

  if (startTabIndex === 0 && activeTab.value === 0 && deltaX > 50 && deltaY < 30) {
    goBack()
  }
}
</script>

<style scoped>
.note-details-page {
  background: linear-gradient( 180deg, #FFFFFF 0%, #F5F5F5 31%);
  min-height: 100vh;
  box-sizing: border-box;
  position: relative;
  padding-top: 2vh;
}

/* 固定顶部 */
.top-fixed-header {
  /* position: fixed;
  top: 3vh;
  left: 0; */
  width: 100vw;
  z-index: 999;
  padding: 12px 16px 8px;
  box-sizing: border-box;
}

/* 顶部图标 */
.top-icon-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.right-icons {
  display: flex;
  gap: 15px;
}

/* folder-icon尺寸设置 */
.folder-icon {
  width: 40rpx;
  height: 40rpx;
}

/* 知识库图片样式 */
.knowledge-img {
  width: 88rpx;
  height: 88rpx;
  border-radius: 16rpx 16rpx 16rpx 16rpx;
  margin-right: 20rpx;
}

/* Header 卡片 */
.note-header-card {
  border-radius: 12px;
  padding: 10px 16px 16px 16px;
  margin-bottom: 10px;
  margin-top: 1vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
}

.note-title-row {
   display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.note-title {
  font-size: 18px; /* 文字小一点 */
  font-weight: 700;
  line-height: 1.2;
  color: #222;
  margin-right: 10rpx;
}
.note-meta {
  margin-top: 4px;
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: #666;
}
/* prompt 文本 */
.note-prompt {
  margin-top: 8px;
  font-size: 14px;
  color: #444;
  line-height: 1.4;
}

/* 底部一行，水平排列 */
.note-footer-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #666;
  gap: 8px;
  flex-wrap: nowrap;
}

.note-tags {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  overflow: hidden;
  flex-shrink: 0;
}

.note-footer-separator {
  color: #999;
  user-select: none;
}

.note-time,
.note-user {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

/* 内容区域 - 顶部区域高度约220px */
.tab-content-wrapper {
  height: calc(100vh - 270px);
}
.tab-swiper {
  height: 100%;
}
.tab-inner-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 10px 14px;
  box-sizing: border-box;
}

/* 文件列表样式 */
.file-list {
  margin-top: 1vh;
}

.file-search-bar {
  margin-top: 10px;
  padding: 0 14px;
  margin: 0 14px 10px;
}

.file-list-scroll {
  height: calc(100vh - 270px);
  box-sizing: border-box;
}

.file-item {
  display: flex;
  align-items: flex-start;
  padding: 14px;
  background-color: #f8f8f8;
  border-radius: 16rpx;
  margin-bottom: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  gap: 12px;
  min-height: 80px;
  box-sizing: border-box;
}

.file-preview {
  width: 72px;
  height: 72px;
  border-radius: 12rpx;
  flex-shrink: 0;
  background-color: #ddd;
  object-fit: cover;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 72px;
  box-sizing: border-box;
}

.file-name {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: #333;
  max-height: 3.9em;
  overflow: hidden;
  word-break: break-word;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-top: 6px;
}

.file-meta-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-type-text {
  text-transform: uppercase;
}

/* 底部聊天栏 */
.chatbar {
  position: fixed;
  bottom: 5px;
  left: 0;
  width: 95vw;
  display: flex;
  padding: 10px 14px;
  border-radius: 15px;
  margin: 2.5vw;
  background: #ddd;
  z-index: 999;
  box-sizing: border-box;
  gap: 10px;
}
.fake-input {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 14px;
  box-sizing: border-box;
}
.fake-input-text {
  color: #999;
  font-size: 14px;
}

.note-detail-live-chat {
  border-top-left-radius: 16rpx;
  border-top-right-radius: 16rpx;
  overflow: hidden;
}

/* 笔记列表容器 */
.notes-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4vw;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  padding: 20rpx;
}

/* AI提问按钮 - 公用组件 */
.ai-question-button {
  position: fixed;
  bottom: 130rpx;
  right: 5rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  border: 1px solid #4d8fff;
  border-radius: 25px;
  padding: 12px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 999;
}

.ai-icon-wrapper {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.question-text {
  font-size: 14px;
  color: #4d8fff;
  font-weight: 500;
}
.ai-icon{
   width: 56px;
   height: 56px;
 }

/* 文件标签页样式 */
.file-tabs {
  display: flex;
  margin: 20rpx 0;
  padding: 0 20rpx;
  border-bottom: 1rpx solid #eee;
}

.file-tab {
  width: 152rpx;
  height: 52rpx;
  border-radius: 8rpx 8rpx 8rpx 8rpx;
  text-align: center;
  line-height: 54rpx;
  border: 2rpx solid #565656;
  margin-right: 20rpx;
  color: #666;
  font-size: 28rpx;
  position: relative;
}

.file-tab.active {
  color: #007aff;
  font-weight: 600;
  background: rgba(46,92,231,0.05);
  border-radius: 8rpx 8rpx 8rpx 8rpx;
  border: 2rpx solid #2E5CE7;
}


/* 文件图标样式 */
.file-icon {
  width: 80rpx;
  height: 80rpx;
  flex-shrink: 0;
}

/* 文件项信息样式 */
.file-item-info {
  flex: 1;
  overflow: hidden;
}

.file-item-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-item-meta {
  font-size: 24rpx;
  color: #999;
}

/* 文件项更多按钮样式 */
.file-item-more {
  margin-top: 30rpx;
  color: #ccc;
}

/* 文件项容器样式 */
.file-items {
  padding: 0 20rpx;
}

/* u-tabs 样式 */
.u-tabs {
  margin-top: 10px;
}

/* u-tabs 标签容器 */
.u-tabs__wrapper {
  height: 34px;
}

/* u-tabs 标签项 */
.u-tabs__wrapper .u-tabs__item {
  padding-left: 15px;
  padding-right: 15px;
  height: 34px;
  color: #606266;
  font-size: 30rpx;
  transform: scale(1);
}

/* u-tabs 激活的标签项 */
.u-tabs__wrapper .u-tabs__item-active {
  color: #303133;
  font-weight: bold;
  font-size: 30rpx;
  transform: scale(1.05);
}
::v-deep .u-tabs__wrapper__nav__item__text {
  font-size: 30rpx;
}
</style>
