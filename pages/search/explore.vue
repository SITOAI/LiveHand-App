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
          <view v-if="searchSuggestions.length === 0 && !isSuggestionLoading" class="no-suggestions">
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
          <!-- 搜索中状态 -->
          <view v-if="isSearchLoading" class="loading-state">
            <text>正在搜索中...</text>
          </view>
          
          <!-- 搜索错误状态 -->
          <view v-else-if="searchError" class="error-state">
            <text>{{ searchError }}</text>
          </view>
          
          <!-- 有搜索结果 -->
          <template v-else-if="searchResults.length > 0">
            <view class="result-section" v-for="(item, index) in searchResults" :key="item.id || index" @click="navigateToDetail(item)">
              <view class="section-header" >
                <rich-text class="section-title" :nodes="highlightText(item.title, keyword)"></rich-text>
                <!-- <rich-text class="section-title" :nodes="highlightText(keyword, keyword) + ' - 划线'"</rich-text> -->
                <!-- <text class="more-btn">更多></text> -->
              </view>
              <view class="item-card">
                <rich-text class="desc" :nodes="highlightText(item.desc, keyword) + '<span style=\'font-weight: bold; font-size: 24rpx; color: #2D5DE4;\'>展开</span>'"></rich-text>
                <view class="item-footer">
                  <text class="source">{{ item.knowledgeBase }}</text>
                  <text v-if="item.url" class="time time-link" @click="openUrl(item.url)">{{ item.url }}</text>
                  <text v-else class="time">{{ item.time }}</text>
                </view>
                <view class="divider" ></view>
              </view>
            </view>
          </template>
          <view v-else-if="keyword" class="no-results">
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
import http from '../../utils/http.js'

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

// 响应式数据
const searchHistory = ref([])
const recommendTags = ref(['AI', '机器学习', '大模型', 'Vue3', '前端开发', 'JavaScript'])
const loading = ref(false)
const error = ref('')
const isSuggestionLoading = ref(false)
// 定时器变量
let searchSuggestionTimer = null

// 搜索建议数据
const searchSuggestions = ref([])

// 真实搜索结果数据
const searchResults = ref([])
const isSearchLoading = ref(false)
const searchError = ref('')

// 搜索结果接口调用
const fetchSearchResults = async (searchKeyword) => {
  if (!searchKeyword) {
    searchResults.value = []
    return
  }
  
  const userId = getUserId()
  if (!userId) {
    console.warn('用户ID不存在')
    searchError.value = '用户未登录，请先登录'
    return
  }
  
  try {
    isSearchLoading.value = true
    searchError.value = ''
    const res = await http.post('/livehands/home/search', {
      user_id: userId,
      question: searchKeyword,
      token: uni.getStorageSync('token') || ''
    })
    
    if (res.data && Array.isArray(res.data)) {
      // 确保每个结果都有必要的字段，兼容可能的空值
      searchResults.value = res.data.map(item => {
        // 根据是否有app_id字段决定desc的来源
        let descValue = ''
        if (item.app_id) {
          descValue = item.answer || '无回答'
        } else {
          descValue = item.snippet || item.desc || item.content || '无描述'
        }
        
        return {
          id: item.id || '',
          title: item.title || '无标题',
          desc: descValue,
          knowledgeBase: item.knowledgeBase || item.name || '未知来源',
          appId: item.app_id || '',
          agentApiKey: item.api_key || '',
          chatId: item.chatId || '',
          // 获取并格式化时间字段，兼容多种可能的字段名
          time: formatTime(item.createTime || item.date || item.time),
          // 获取url链接，取第一项或默认空字符串
          url: Array.isArray(item.url) && item.url.length > 0 ? item.url[0] : (item.url || '')
        }
      })
    } else {
      // 兼容不同的数据结构
      searchResults.value = Array.isArray(res) ? res : []
    }
    
    // 如果搜索结果为空，添加知识库类型的假数据，不含URL
    if (searchResults.value.length === 0) {
      searchResults.value = [
        {
          id: 'fake_1',
          title: '知识库：系统架构设计指南',
          desc: '本知识库详细介绍了系统架构设计的基本原则、常用模式和最佳实践。包括前端架构、后端架构、数据库设计和微服务架构等方面的内容。通过学习本指南，您将能够设计出高性能、可扩展、易维护的系统架构。',
          knowledgeBase: '技术文档库',
          time: '2天前',
          url: ''
        },
        {
          id: 'fake_2',
          title: '知识库：机器学习模型训练指南',
          desc: '本指南提供了机器学习模型训练的完整流程，包括数据准备、特征工程、模型选择、训练方法、评估指标和模型部署等关键步骤。适用于机器学习初学者和希望提高模型效果的开发者。',
          knowledgeBase: 'AI知识库',
          time: '3天前',
          url: ''
        },
        {
          id: 'fake_3',
          title: '知识库：前端性能优化实践',
          desc: '本文档汇总了前端性能优化的各种技巧和方法，包括资源加载优化、代码分割、缓存策略、渲染性能优化等。通过实施这些优化措施，可以显著提升网站和应用的加载速度和响应性能。',
          knowledgeBase: '前端开发库',
          time: '1周前',
          url: ''
        },
        {
          id: 'fake_4',
          title: '知识库：数据库索引优化技巧',
          desc: '本知识库详细介绍了数据库索引的工作原理、设计原则和优化技巧。包括索引类型选择、复合索引设计、索引维护等内容。合理的索引设计可以大幅提高数据库查询性能。',
          knowledgeBase: '数据库技术库',
          time: '2周前',
          url: ''
        },
        {
          id: 'fake_5',
          title: '知识库：安全编码最佳实践',
          desc: '本指南汇总了安全编码的最佳实践，涵盖了常见的安全漏洞防范、密码存储、数据加密、权限控制等方面的内容。遵循这些实践可以有效降低应用的安全风险。',
          knowledgeBase: '安全开发库',
          time: '1个月前',
          url: ''
        }
      ]
    }
  } catch (e) {
    console.error('搜索失败:', e)
    searchError.value = e.message || '搜索失败，请稍后重试'
    searchResults.value = []
    
    // 错误情况下也可以添加假数据
    searchResults.value = [
      {
        id: 'error_fake_1',
        title: '知识库：系统架构设计指南',
        desc: '本知识库详细介绍了系统架构设计的基本原则、常用模式和最佳实践。',
        knowledgeBase: '技术文档库',
        time: '2天前',
        url: ''
      },
      {
        id: 'error_fake_2',
        title: '知识库：机器学习模型训练指南',
        desc: '本指南提供了机器学习模型训练的完整流程，包括数据准备、特征工程、模型选择等。',
        knowledgeBase: 'AI知识库',
        time: '3天前',
        url: ''
      }
    ]
    // 清除错误信息，显示假数据
    searchError.value = ''
  } finally {
    isSearchLoading.value = false
  }
}

// 添加时间格式化函数 - 将时间转换为相对时间显示
function formatTime(timeStr) {
  if (!timeStr) return '刚刚'
  
  // 尝试将输入转换为Date对象
  const date = typeof timeStr === 'string' ? new Date(timeStr) : timeStr
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) return '刚刚'
  
  const now = new Date()
  const diff = now - date
  
  // 转换为秒
  const seconds = Math.floor(diff / 1000)
  // 转换为分钟
  const minutes = Math.floor(seconds / 60)
  // 转换为小时
  const hours = Math.floor(minutes / 60)
  // 转换为天
  const days = Math.floor(hours / 24)
  
  // 根据不同的时间差返回不同的显示格式
  if (seconds < 60) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    // 超过7天显示具体日期
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

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

// 添加打开URL函数
function openUrl(url) {
  if (url) {
    // 添加时间戳参数，确保每次跳转都带上当前时间
    const timestamp = Date.now()
    // 格式化时间为可读格式
    const now = new Date(timestamp)
    const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    uni.navigateTo({
      url: `/pages/static/FileBrowser.vue?url=${encodeURIComponent(url)}`
    })
  }
}

// 添加导航到详情页函数
function navigateToDetail(item) {
  console.log("🚀 ~ navigateToDetail ~ item:", item)
  // 添加时间戳参数，确保每次跳转都带上当前时间
  const timestamp = Date.now()
  // 格式化时间为可读格式
  const now = new Date(timestamp)
  const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  uni.navigateTo({
    url: `/pages/search/detail?id=${item.id}&title=${encodeURIComponent(item.title)}&desc=${encodeURIComponent(item.desc)}&repo=${encodeURIComponent(item.knowledgeBase)}&url=${encodeURIComponent(item.url || '')}&appId=${encodeURIComponent(item.appId || '')}&agentApiKey=${encodeURIComponent(item.agentApiKey || '')}&time=${encodeURIComponent(formattedTime)}&chatId=${encodeURIComponent(item.chatId || '')}`
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

// 获取用户ID
const getUserId = () => {
  try {
    const userInfo = uni.getStorageSync('userInfo') || {}
    return userInfo.knowledge_user_id || ''
  } catch (e) {
    console.warn('获取用户信息失败:', e)
    return ''
  }
}

// 获取搜索历史
const fetchSearchHistory = async () => {
  const userId = getUserId()
  if (!userId) {
    console.warn('用户ID不存在')
    return
  }
  
  try {
    loading.value = true
    const res = await http.post('/livehands/home/search/recent', {
      user_id: userId
    })
    // 假设返回的数据结构为 { data: [{ content: '历史记录1' }, ...] }
    if (res.data && Array.isArray(res.data)) {
      searchHistory.value = res.data.map(item => item.content || item)
    } else {
      // 兼容不同的数据结构
      searchHistory.value = Array.isArray(res) ? res : []
    }
  } catch (e) {
    console.error('获取搜索历史失败:', e)
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// 获取搜索建议
const fetchSearchSuggestions = async (keywordValue) => {
  if (!keywordValue) {
    searchSuggestions.value = []
    isSuggestionLoading.value = false
    return
  }
  
  const userId = getUserId()
  if (!userId) {
    console.warn('用户ID不存在')
    isSuggestionLoading.value = false
    return
  }
  
  try {
    isSuggestionLoading.value = true
    const res = await http.post('/livehands/home/search/related', {
      user_id: userId,
      keyword: keywordValue
    })
    // 假设返回的数据结构为 { data: [{ content: '建议1' }, ...] }
    if (res.data && Array.isArray(res.data)) {
      searchSuggestions.value = res.data.map(item => item.content || item)
    } else {
      // 兼容不同的数据结构
      searchSuggestions.value = Array.isArray(res) ? res : []
    }
  } catch (e) {
    console.error('获取搜索建议失败:', e)
    // 失败时不显示错误，保持为空
    searchSuggestions.value = []
  } finally {
    isSuggestionLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    // 默认显示聚焦状态
    isFocused.value = true
    // 获取搜索历史
    fetchSearchHistory()
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
  
  // 获取搜索建议
  if (keyword.value) {
    // 添加防抖
    clearTimeout(searchSuggestionTimer)
    // 只有在新的请求开始时才设置加载状态
    isSuggestionLoading.value = true
    searchSuggestionTimer = setTimeout(() => {
      fetchSearchSuggestions(keyword.value)
    }, 300)
  } else {
    searchSuggestions.value = []
    isSuggestionLoading.value = false
  }
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
  
  // 调用搜索接口获取真实结果
  if (keyword.value) {
    fetchSearchResults(keyword.value)
  }
}

function clearHistory() {
  // 确认清空历史记录
  uni.showModal({
    title: '提示',
    content: '确定要清空搜索历史吗？',
    success: function(res) {
      if (res.confirm) {
        searchHistory.value = []
        // 这里可以添加调用清空历史记录的API
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
  height: 100vh;
  box-sizing: border-box;
}

/* 搜索栏样式 */
.search-header {
  position: relative;
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
  width: 80%;
  margin-left: 8vw;
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
.loading-state,
.error-state,
.no-results {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}

.error-state {
  color: #e64340;
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

.time-link {
  color: #2D5DE4;
  text-decoration: underline;
  cursor: pointer;
  width: 280rpx;
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  position: relative;
  padding-right: 10rpx;
}

.time-link::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 20rpx;
  height: 100%;
  background: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1));
  pointer-events: none;
}

.time-link:active {
  opacity: 0.8;
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
.search-icon{
  height: 45rpx;
  width: 45rpx;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0rpx;
}
</style>