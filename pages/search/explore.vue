<template>
  <view class="search-explore-container">
    <!-- 搜索栏 -->
    <view class="search-header">
      <u-icon name="arrow-left" size="28" @click="onBack" />
      <view class="search-box">
        <u-icon name="search" size="18" />
        <input
          class="input"
          placeholder="把问题和任务告诉我"
          v-model="keyword"
          @input="handleInput"
          @focus="handleFocus"
          ref="searchInput"
        />
        <u-icon
          v-if="keyword"
          name="close-circle" 
          size="18"
          @click="clearInput"
        />
      </view>
      <text class="search-btn" @click="onSearch">搜索</text>
    </view>

    <!-- 主体内容区域 -->
    <view class="search-content">
      <!-- 未搜索状态 -->
      <template v-if="!isSearched && !isFocused">
        <view class="recommend-section">
          <view class="section-header">
            <text class="section-title">人工智能</text>
            <text class="more-btn" @click="navigateToMore('accounts')">更多</text>
          </view>
          <view class="account-card" @click="navigateToAccount">
            <view class="account-info">
              <image class="account-avatar" src="../../static/AI.png" mode="aspectFill"></image>
              <view class="account-text">
                <text class="account-name">中国人工智能学会</text>
                <text class="account-subtitle">公众号</text>
              </view>
              <u-icon name="checkmark-circle" size="20" color="#007aff" />
            </view>
            <view class="account-stats">
              <text class="stats-text">416篇原创内容 15小时前更新</text>
            </view>
            <view class="follow-buttons">
              <button class="follow-btn">加入学会</button>
              <button class="follow-btn primary">加入学会</button>
            </view>
          </view>
        </view>

        <view class="recommend-section">
          <view class="section-header">
            <text class="section-title">最近读过</text>
          </view>
          <view class="recent-item" v-for="(item, index) in recentItems" :key="index" @click="navigateToItem(item)">
            <view class="item-content">
              <text class="item-title">{{ item.title }}</text>
              <text class="item-source">{{ item.source }}</text>
            </view>
          </view>
        </view>

        <view class="recommend-section">
          <view class="section-header">
            <text class="section-title">看过的视频</text>
            <text class="more-btn" @click="navigateToMore('videos')">更多</text>
          </view>
          <view class="video-grid">
            <view class="video-card" v-for="(video, index) in videos" :key="index" @click="playVideo(video)">
              <view class="video-thumbnail">
                <image :src="video.thumbnail" mode="aspectFill"></image>
                <view class="play-icon">
                  <u-icon name="play-circle" size="40" color="#fff" />
                </view>
                <text class="video-duration">{{ video.duration }}</text>
              </view>
              <text class="video-title">{{ video.title }}</text>
              <text class="video-source">{{ video.source }} {{ video.time }}</text>
            </view>
          </view>
        </view>
      </template>

      <!-- 聚焦状态（显示搜索历史和推荐标签） -->
      <template v-else-if="isFocused && !isSearched">
        <view class="history-wrapper">
          <view class="history-header">
            <text class="history-title">历史记录</text>
            <u-icon name="trash" size=18 @click="clearHistory"></u-icon>
          </view>

          <view class="history-list" v-if="searchHistory.length > 0">
            <view
              v-for="(item, index) in searchHistory"
              :key="index"
              class="history-item"
              @click="onSearch(item)"
            >
              {{ item }}
            </view>
          </view>

          <view v-else class="no-history">
            <text>暂无历史记录</text>
          </view>
        </view>
        
        <view class="tag-wrapper">
          <view class="tag-header">
            <text class="tag-title">热门搜索</text>
            <u-icon name="edit-pen" size="20" @click="onEditClick" />
          </view>
          <view class="tag-list">
            <u-tag
              v-for="(item, index) in recommendTags"
              :key="index"
              :text="item"
              plain
              size="mini"
              type="primary"
              @click="onSearch(item)"
            />
          </view>
        </view>
      </template>

      <!-- 搜索结果状态 -->
      <template v-else>
        <view class="result-tabs">
          <text 
            v-for="tab in tabs" 
            :key="tab.value"
            :class="['tab-item', { active: activeTab === tab.value }]"
            @click="switchTab(tab.value)"
          >
            {{ tab.label }}
          </text>
        </view>
        <scroll-view scroll-y class="result-list">
          <template v-if="filteredResults.length > 0">
            <view 
              v-for="(item, index) in filteredResults" 
              :key="index"
              class="item-card"
              @click="navigateToDetail(item)"
            >
              <text class="title">{{ item.title }}</text>
              <text class="desc">{{ item.desc }}</text>
            </view>
          </template>
          <view v-else class="no-results">
            <text>暂无搜索结果</text>
          </view>
        </scroll-view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'

// 搜索相关状态
const keyword = ref('')
const isSearched = ref(false)
const isFocused = ref(false)
const searchInput = ref(null)
const activeTab = ref('all')

// 模拟数据
const searchHistory = ref(['人工智能', '机器学习', '深度学习', 'Vue3'])
const recommendTags = ref(['AI', '机器学习', '大模型', 'Vue3', '前端开发', 'JavaScript'])
const recentItems = ref([
  {
    id: 1,
    title: '极氪007gt100度电池多少钱，去掉折扣后大约的...',
    source: '科技学院 48分钟'
  }
])
const videos = ref([
  {
    id: 1,
    thumbnail: '../../static/test/test0.png',
    duration: '12:26',
    title: '极氪007GT是极氪品牌基于SEA浩瀚架构打造的第二款纯电...',
    source: '科技学院',
    time: '48分钟'
  },
  {
    id: 2,
    thumbnail: '../../static/test/test1.png',
    duration: '02:36',
    title: '极氪007GT是极氪品牌基于SEA浩瀚架构打造的第二款纯电...',
    source: '科技学院',
    time: '48分钟'
  }
])

// 搜索结果数据
const searchResults = ref([
  { id: 1, title: '人工智能入门指南', desc: '从零开始学习人工智能的基础知识和应用技巧', type: 'article' },
  { id: 2, title: '机器学习算法详解', desc: '深入解析常用机器学习算法的原理和实现', type: 'article' },
  { id: 3, title: 'Vue3组件开发实战', desc: '使用Vue3开发高质量组件的实战经验分享', type: 'article' },
  { id: 4, title: '前端开发最佳实践', desc: '现代前端开发的最佳实践和规范指南', type: 'article' },
  { id: 5, title: '人工智能应用案例分析', desc: '人工智能在各个行业的应用案例深度剖析', type: 'article' },
  { id: 6, title: '大模型训练与部署', desc: '大语言模型的训练、微调与部署全流程指南', type: 'article' }
])

const tabs = ref([
  { label: '全部', value: 'all' },
  { label: '账号', value: 'account' },
  { label: '划线', value: 'mark' },
  { label: '文章', value: 'article' },
  { label: '问一问', value: 'qa' },
  { label: '视频', value: 'video' }
])

// 计算过滤后的搜索结果
const filteredResults = computed(() => {
  if (!keyword.value) return []
  
  // 模糊搜索逻辑
  return searchResults.value.filter(item => 
    item.title.toLowerCase().includes(keyword.value.toLowerCase()) ||
    item.desc.toLowerCase().includes(keyword.value.toLowerCase())
  )
})

// 生命周期
onMounted(() => {
  nextTick(() => {
    // 自动聚焦搜索框
    if (searchInput.value) {
      searchInput.value.focus()
    }
  })
})

// 方法
function onBack() {
  uni.navigateBack()
}

function handleInput() {
  isSearched.value = false
}

function handleFocus() {
  isFocused.value = true
}

function clearInput() {
  keyword.value = ''
  isSearched.value = false
}

function onSearch(val) {
  if (typeof val === 'string') {
    keyword.value = val
  }
  
  // 添加到搜索历史
  if (keyword.value && !searchHistory.value.includes(keyword.value)) {
    searchHistory.value.unshift(keyword.value)
    if (searchHistory.value.length > 10) {
      searchHistory.value.pop()
    }
  }
  
  isSearched.value = true
  isFocused.value = false
}

function clearHistory() {
  searchHistory.value = []
}

function onEditClick() {
  console.log('搜索界面编辑标签icon被点击')
}

function switchTab(tabValue) {
  activeTab.value = tabValue
  // 这里可以根据tab切换过滤不同类型的搜索结果
}

function navigateToAccount() {
  // 跳转到账号详情页
  console.log('跳转到账号详情页')
}

function navigateToItem(item) {
  // 跳转到内容详情页
  console.log('跳转到内容详情页:', item)
}

function playVideo(video) {
  // 播放视频
  console.log('播放视频:', video)
}

function navigateToMore(type) {
  // 跳转到更多页面
  console.log('跳转到更多页面:', type)
}

function navigateToDetail(item) {
  // 跳转到详情页
  console.log('跳转到详情页:', item)
}
</script>

<style scoped>
.search-explore-container {
  height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  padding-top: 6vh;
}

/* 搜索栏样式 */
.search-header {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 10px 16px;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 16px;
  gap: 8px;
}

.input {
  flex: 1;
  padding: 4px 0;
  font-size: 15px;
  border: none;
  background-color: transparent;
}

.search-btn {
  color: #007aff;
  font-size: 16px;
}

/* 主体内容样式 */
.search-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 推荐区域样式 */
.recommend-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.more-btn {
  font-size: 14px;
  color: #007aff;
}

/* 账号卡片样式 */
.account-card {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 16px;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.account-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.account-text {
  flex: 1;
}

.account-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: block;
}

.account-subtitle {
  font-size: 14px;
  color: #666;
  display: block;
  margin-top: 4px;
}

.account-stats {
  margin-bottom: 12px;
}

.stats-text {
  font-size: 14px;
  color: #666;
}

.follow-buttons {
  display: flex;
  gap: 12px;
}

.follow-btn {
  flex: 1;
  padding: 8px 16px;
  border: 1px solid #007aff;
  border-radius: 16px;
  background: transparent;
  color: #007aff;
  font-size: 14px;
}

.follow-btn.primary {
  background: #007aff;
  color: #fff;
}

/* 最近读过样式 */
.recent-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.recent-item:last-child {
  border-bottom: none;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-title {
  font-size: 15px;
  color: #333;
  line-height: 1.4;
}

.item-source {
  font-size: 13px;
  color: #999;
}

/* 视频网格样式 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.video-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  border-radius: 8px;
}

.video-thumbnail image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.video-title {
  font-size: 14px;
  color: #333;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-source {
  font-size: 12px;
  color: #999;
}

/* 搜索结果标签样式 */
.result-tabs {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 12px;
  margin-bottom: 16px;
  gap: 16px;
}

.tab-item {
  font-size: 15px;
  color: #666;
  padding: 4px 0;
  position: relative;
}

.tab-item.active {
  color: #007aff;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #007aff;
}

/* 无结果样式 */
.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 15px;
}

/* 结果列表样式 */
.result-list {
  height: calc(100vh - 200px);
}

/* 搜索历史样式 */
.history-wrapper {
  padding: 16px 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-title {
  font-size: 16px;
  font-weight: bold;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-item {
  padding: 6px 12px;
  background: #cccccc30;
  border-radius: 16px;
  font-size: 16px;
  color: #333;
}

.no-history {
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 20px 0;
}

/* 搜索标签样式 */
.tag-wrapper {
  padding: 16px 0;
}

.tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tag-title {
  font-size: 16px;
  font-weight: bold;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 搜索结果项样式 */
.item-card {
  background: #f9f9f9;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}

.title {
  font-weight: bold;
  font-size: 16px;
}

.desc {
  font-size: 14px;
  color: #666;
  margin-top: 6px;
}
</style>