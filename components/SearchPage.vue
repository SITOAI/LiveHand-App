<template>
  <view class="search-page">
    <!-- 搜索头部 -->
    <view class="search-header">
      <u-icon name="arrow-left" size="28" @click="handleBack" />
      <view class="search-box">
        <u-icon name="search" size="18" />
        <input
          class="input"
          placeholder="搜索内容"
          v-model="searchText"
          @input="handleInput"
          @confirm="handleSearch"
        />
        <!-- 清除按钮 -->
        <u-icon
          v-if="searchText"
          name="close-circle" 
          size="18" 
          @click="clearSearch"
        />
      </view>
      <text class="search-btn" @click="handleSearch">搜索</text>
    </view>
    
    <!-- 搜索历史和推荐 -->
    <view v-if="!isSearching" class="search-content">
      <!-- 搜索历史 -->
      <view class="history-wrapper">
        <view class="history-header">
          <text class="history-title">搜索历史</text>
          <u-icon name="trash" size="18" @click="clearHistory" v-if="searchHistory.length > 0"></u-icon>
        </view>

        <view class="history-list" v-if="searchHistory.length > 0">
          <view
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-item"
            @click="searchByHistory(item)"
          >
            {{ item }}
          </view>
        </view>

        <view v-else class="no-history">
          <text>暂无搜索历史</text>
        </view>
      </view>
      
      <!-- 推荐搜索 -->
      <view class="recommend-wrapper">
        <view class="recommend-header">
          <text class="recommend-title">推荐搜索</text>
        </view>
        
        <view class="recommend-list">
          <view
            v-for="(item, index) in recommendList"
            :key="index"
            class="recommend-item"
            @click="searchByRecommend(item)"
          >
            <text class="index">{{ index + 1 }}</text>
            <text class="content">{{ item }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 搜索结果 -->
    <view v-else class="search-results">
      <view class="results-header">
        <text class="results-title">搜索结果</text>
      </view>
      
      <view class="results-list" v-if="searchResults.length > 0">
        <view
          v-for="(item, index) in searchResults"
          :key="index"
          class="result-item"
          @click="handleItemClick(item)"
        >
          <text class="result-title">{{ item.title }}</text>
          <text class="result-desc">{{ item.desc }}</text>
        </view>
      </view>
      
      <view v-else class="no-results">
        <text>暂无搜索结果</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// 搜索文本
const searchText = ref('')

// 是否正在搜索中
const isSearching = ref(false)

// 搜索历史
const searchHistory = ref([
  'AI越来越强大，我们该怎么办',
  '人工智能发展趋势'
])

// 推荐搜索列表
const recommendList = ref([
  'AI越来越强大，我们该怎么办',
  '人工智能发展趋势',
  '科技改变世界',
  'AI时代的职业规划'
])

// 搜索结果
const searchResults = ref([])

// 处理返回
function handleBack() {
  uni.navigateBack()
}

// 处理输入
function handleInput() {
  // 可以在这里添加实时搜索逻辑
}

// 清除搜索
function clearSearch() {
  searchText.value = ''
}

// 处理搜索
function handleSearch() {
  if (!searchText.value.trim()) return
  
  // 保存到搜索历史
  saveToHistory(searchText.value.trim())
  
  // 模拟搜索结果
  simulateSearch(searchText.value.trim())
  
  isSearching.value = true
}

// 根据历史记录搜索
function searchByHistory(text) {
  searchText.value = text
  simulateSearch(text)
  isSearching.value = true
}

// 根据推荐搜索
function searchByRecommend(text) {
  searchText.value = text
  saveToHistory(text)
  simulateSearch(text)
  isSearching.value = true
}

// 保存到搜索历史
function saveToHistory(text) {
  // 如果已存在则移除，添加到开头
  const index = searchHistory.value.indexOf(text)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
  }
  searchHistory.value.unshift(text)
  
  // 限制历史记录数量
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10)
  }
}

// 清除搜索历史
function clearHistory() {
  searchHistory.value = []
}

// 模拟搜索
function simulateSearch(keyword) {
  // 这里应该是实际的搜索逻辑，现在用模拟数据代替
  searchResults.value = [
    {
      title: `关于"${keyword}"的讨论`,
      desc: `${keyword}是当前热门话题，引发了广泛的讨论...`
    },
    {
      title: `${keyword}的最新研究进展`,
      desc: `最新研究显示，${keyword}在多个领域有重要应用...`
    },
    {
      title: `${keyword}对未来的影响分析`,
      desc: `${keyword}将如何改变我们的生活和工作方式...`
    }
  ]
}

// 处理结果项点击
function handleItemClick(item) {
  // 这里应该是跳转到详情页的逻辑
  console.log('点击了搜索结果:', item)
}
</script>

<style scoped>
.search-page {
  padding-top: 50rpx;
  min-height: 100vh;
  background-color: #fff;
}

/* 搜索头部样式 */
.search-header {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 10px 16px;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 20px;
}

.input {
  flex: 1;
  padding: 0 8px;
  font-size: 14px;
  border: none;
  background-color: transparent;
  outline: none;
}

.search-btn {
  color: #007aff;
  font-size: 14px;
  padding: 4px 0;
}

/* 搜索内容样式 */
.search-content {
  padding: 16px;
}

/* 历史记录样式 */
.history-wrapper {
  margin-bottom: 24px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.history-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.history-item {
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 14px;
  color: #333;
}

.no-history {
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 20px 0;
}

/* 推荐搜索样式 */
.recommend-wrapper {
  margin-bottom: 24px;
}

.recommend-header {
  margin-bottom: 12px;
}

.recommend-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommend-item {
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.recommend-item .index {
  width: 20px;
  height: 20px;
  background-color: #ff6b6b;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 12px;
}

.recommend-item:nth-child(2) .index {
  background-color: #ff9e42;
}

.recommend-item:nth-child(3) .index {
  background-color: #ffc15e;
}

.recommend-item .content {
  font-size: 15px;
  color: #333;
}

/* 搜索结果样式 */
.search-results {
  padding: 16px;
}

.results-header {
  margin-bottom: 16px;
}

.results-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.result-title {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.result-desc {
  font-size: 14px;
  color: #666;
  margin-top: 6px;
  display: block;
}

.no-results {
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 40px 0;
}
</style>