<template>
  <view class="search-explore-container">
    <!-- 搜索栏 -->
    <view class="search-header">
      <u-icon class="search-icon" name="arrow-left" size="28" @click="onBack" />
      <view class="search-box">
        <input
          id="searchInput"
          class="input"
          placeholder="搜索"
          v-model="keyword"
          @input="handleInput"
          @focus="handleFocus"
          ref="searchInput"
          auto-focus
        />
        <u-icon
          v-if="keyword"
          name="close-circle" 
          size="18"
          @click="clearInput"
        />
        <text class="search-btn" @click="onSearch">
          <u-icon name="search" color="#ffffff" size="22" />
        </text>
      </view>
    </view>

    <!-- 主体内容区域 -->
    <view class="search-content">
      <!-- 聚焦状态（只显示搜索历史） -->
      <template v-if="isFocused && !isSearched && !keyword">
        <!-- 搜索历史 -->
        <view v-if="searchHistory.length > 0" class="history-wrapper">
          <view class="history-header">
            <text class="history-title">搜索历史</text>
          </view>
          <view class="history-list">
            <view
              v-for="(item, index) in searchHistory"
              :key="index"
              class="history-item"
            >
              <image  src="../../static/time.png" class="folder-icon" mode="aspectFit"></image>
              <text class="history-text" @click="onSearch(item)">{{ item }}</text>
              <u-icon name="close" size="16" color="#999" @click="removeHistory(index)" />
            </view>
          </view>
          <view class="clear-history-btn" @click="clearHistory">
            <u-icon name="trash" size="18" color="#999" style="display: inline-block; margin-right: 10rpx; vertical-align: middle;" />
            <text style="display: inline-block; vertical-align: middle;">清除历史</text>
          </view>
        </view>
      </template>

      <!-- 输入时的搜索建议 -->
      <template v-if="keyword && !isSearched">
        <view class="suggestion-list">
          <view 
            v-for="(item, index) in searchSuggestions" 
            :key="index"
            class="suggestion-item"
            @click="onSearch(item)"
          >
            <u-icon name="search" size="24" color="#999" style="margin-right: 10rpx;" />
            <text class="suggestion-text">{{ item }}</text>
          </view>
          <view v-if="searchSuggestions.length === 0" class="no-suggestions">
            <text>暂无搜索建议</text>
          </view>
        </view>
      </template>

      <!-- 搜索结果状态 -->
      <template v-else-if="isSearched">
        <!-- <view class="result-tabs">
          <text 
            v-for="tab in tabs" 
            :key="tab.value"
            :class="['tab-item', { active: activeTab === tab.value }]"
            @click="switchTab(tab.value)"
          >
            {{ tab.label }}
          </text>
        </view> -->
        <scroll-view scroll-y class="result-list">
          <template v-if="filteredResults.length > 0">
            <view class="result-section" v-for="(item, index) in filteredResults" :key="index" @click="navigateToDetail(item)">
              <view class="section-header" >
                <rich-text class="section-title" :nodes="highlightText(item.title, keyword)"></rich-text>
                <!-- <rich-text class="section-title" :nodes="highlightText(keyword, keyword) + ' - 划线'"</rich-text> -->
                <!-- <text class="more-btn">更多></text> -->
              </view>
              <view class="item-card">
                <rich-text class="desc" :nodes="highlightText(item.desc, keyword) + '<span style=\'font-weight: bold; font-size: 24rpx; color: #2D5DE4;\'>展开</span>'"></rich-text>
                <view class="item-footer">
                  <text class="source">{{ item.knowledgeBase }}</text>
                  <text class="time">48分钟</text>
                </view>
                <view class="divider" ></view>
              </view>
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
import { onReady } from '@dcloudio/uni-app'

// 搜索相关状态
const keyword = ref('')
const isSearched = ref(false)
const isFocused = ref(false)
const searchInput = ref(null)
const activeTab = ref('all')

// 添加tabs数据定义
const tabs = [
  { label: '全部', value: 'all' },
  { label: '划线', value: 'underline' },
  { label: '笔记', value: 'note' },
  { label: '收藏', value: 'favorite' }
]

// 模拟数据
const searchHistory = ref(['人工智能', '机器学习', '深度学习', 'Vue3'])
const recommendTags = ref(['AI', '机器学习', '大模型', 'Vue3', '前端开发', 'JavaScript'])

// 模拟搜索结果数据
const mockResults = [
  { id: 1, 
    title: '人工智能发展历程',
    desc: '人工智能技术从诞生到现在的发展历程概述人工智能技术从诞生到现在的发展历程概述人工智能技术从诞生到现在的发展历程概述人工智能技术从诞生到现在的发展历程概述人工智能技术从诞生到现在的发展历程概述',
    knowledgeBase: '科技学院'
  },
  { id: 2, 
    title: '人工智能发展历程',
    desc: '人工智能技术从诞生到现在的发展历程概述人工智能技术从诞生到现在的发展历程概述人工智能技术从诞生到现在的发展历程概述人工智能技术从诞生到现在的发展历程概述人工智能技术从诞生到现在的发展历程概述',
    knowledgeBase: '计算机科学系'
  },
  { id: 3, 
    title: '人工智能发展历程',
    desc: '人工智能技术从诞生到现在的发展历程概述人工智能技术从诞生到现在的发展历程概述人工智能技术从诞生到现在的发展历程概述人工智能技术从诞生到现在的发展历程概述人工智能技术从诞生到现在的发展历程概述',
    knowledgeBase: '数据研究中心'
  },
]

// 搜索建议数据
const searchSuggestions = computed(() => {
  if (!keyword.value) return []
  
  // 模拟搜索建议
  const suggestions = [
    `${keyword.value}`,
    `${keyword.value}应用场景`,
    `${keyword.value}制作ppt`,
    `${keyword.value}大模型`,
    `${keyword.value}电影`,
    `${keyword.value}+创新创业大赛`,
    `${keyword.value}训练师`,
    `${keyword.value}应用`,
    `${keyword.value}技术`,
    `${keyword.value}学习`
  ]
  
  return suggestions
})

// 添加过滤结果计算属性
const filteredResults = computed(() => {
  if (!keyword.value) return []
  return mockResults.filter(item => 
    item.title.includes(keyword.value) || item.desc.includes(keyword.value)
  )
})

// 添加高亮函数
function highlightText(text, keyword) {
  if (!text || !keyword) return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

// 添加切换标签函数
function switchTab(tabValue) {
  activeTab.value = tabValue
}

// 添加导航到详情页函数
function navigateToDetail(item) {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${item.id}`
  })
}

// 添加返回函数
function onBack() {
  uni.navigateBack()
}

// 添加删除单条历史记录函数
function removeHistory(index) {
  searchHistory.value.splice(index, 1)
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    // 默认显示聚焦状态
    isFocused.value = true
    // 自动聚焦搜索框 - 移除不支持的uni.setFocus
  })
})

// 在页面准备好后强制打开键盘
onReady(() => {
  // 移除不支持的聚焦方式，使用auto-focus属性即可
})

// 方法修改
function handleInput() {
  isSearched.value = false
  // 保持聚焦状态
  isFocused.value = true
}

function handleFocus() {
  isFocused.value = true
  // 确保不处于搜索状态
  isSearched.value = false
}

function clearInput() {
  keyword.value = ''
  isSearched.value = false
  // 清除后保持聚焦状态，但不直接操作DOM
  isFocused.value = true
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
  
  // 进入搜索结果状态，关闭键盘
  isSearched.value = true
  isFocused.value = false
  // 失焦关闭键盘
  uni.hideKeyboard()
}

function clearHistory() {
  // 确认清空历史记录
  uni.showModal({
    title: '提示',
    content: '确定要清空搜索历史吗？',
    success: function(res) {
      if (res.confirm) {
        searchHistory.value = []
      }
    }
  })
}

</script>
<style scoped>
/* 基础样式 */
.search-explore-container {
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  padding-top: 6vh;
  padding: 6vh 30rpx 0;
  height: 94vh;
}

/* 搜索栏样式 */
.search-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 86rpx;
  padding: 0 12rpx;
  gap: 10rpx;
  box-shadow: 0rpx 0rpx 23rpx 0rpx rgba(204,204,204,0.18);
  border-radius: 16rpx;
  box-sizing: border-box;
}

.search-box {
  background-color: #fff;
  border-radius: 16rpx;
  flex: 1;
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
  box-sizing: border-box;
}

.input {
  flex: 1;
  padding: 8rpx 0;
  font-size: 30rpx;
  border: none;
  background-color: transparent;
  margin-right: 30rpx;
  color: #333;
}

/* 设置placeholder颜色更淡 */
::v-deep .uni-input-placeholder {
  color: #ccc;
  opacity: 1;
}

.search-btn {
  width: 122rpx;
  height: 50rpx;
  background: linear-gradient(140deg, #D8C1FF, #9FE2FC);
  box-shadow: 0rpx 0rpx 23rpx 0rpx rgba(204,204,204,0.18);
  border-radius: 25rpx;
  color: #fff;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  margin-left: 20rpx;
}

/* 主体内容样式 */
.search-content {
  flex: 1;
  overflow-y: auto;
  padding: 20rpx 0 0;
}

/* 搜索历史样式 - 使用列表形式 */
.history-wrapper {
  padding: 20rpx 30rpx;
  background: #fff;
  margin: 0 10rpx;
  margin-bottom: 10rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.history-title {
  font-size: 28rpx;
  color: #999;
}

.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 30rpx;
  color: #333;
}

.history-item:last-child {
  border-bottom: none;
}

.history-text {
  flex: 1;
  padding: 0 20rpx;
}

/* 清除历史按钮样式 */
.clear-history-btn {
  margin-top: 30rpx;
  padding: 15rpx;
  text-align: center;
  font-size: 28rpx;
  color: #999;
  border-top: 1rpx solid #f0f0f0;
  margin-top: 10rpx;
}

.no-history {
  font-size: 28rpx;
  color: #999;
  text-align: center;
  padding: 40rpx 0;
}

/* 搜索建议样式 */
.suggestion-list {
  background: #fff;
  padding: 0 30rpx;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 30rpx;
  color: #333;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-text {
  flex: 1;
}

.no-suggestions {
  padding: 40rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

/* 搜索结果标签样式 */
.result-tabs {
  display: flex;
  justify-content: space-around;
  padding-bottom: 24rpx;
  margin-bottom: 16px;
}

.tab-item {
  flex: 1;
  font-size: 15px;
  color: #666;
  padding: 8rpx 0;
  position: relative;
  text-align: center;
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
  height: 4rpx;
  background: #007aff;
}

/* 高亮样式 */
:deep(.highlight) {
  color: #2D5DE4;
  font-weight: 600;
}

/* 无结果样式 */
.no-results {
  text-align: center;
  padding: 120rpx 40rpx;
  color: #999;
  font-size: 15px;
}

/* 结果列表样式 */
.result-list {
  height: calc(100vh - 400rpx);
}

/* 搜索结果项样式 */
.item-card {
  padding: 20rpx 0;
  background-color: #fff;
}

.result-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 16px;
}

.section-header {
  height: 80rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.item-footer {
  padding-right: 10rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
}

.source {
  font-size: 24rpx;
  color: #8E929D;
}

.time {
  font-size: 24rpx;
  color: #8E929D;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.like-count {
  font-size: 28rpx;
  color: #999;
}

.expand-link {
  display: block;
  font-size: 20rpx;
  color: #8E929D;
  margin-top: 8rpx;
}

.divider {
  height: 2rpx;
  background-color: #f0f0f0;
  margin-top: 20rpx;
  width: 100%;
}

.title {
  font-weight: bold;
  font-size: 16px;
}

.desc {
  font-size: 14px;
  color: #666;
  line-height: 50rpx;
  margin-bottom: 5rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
}
.folder-icon{
  height: 45rpx;
  width: 45rpx;
}
</style>