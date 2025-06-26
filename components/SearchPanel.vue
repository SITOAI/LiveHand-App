<template>
  <u-popup
    :show="show"
    mode="right"
    :overlay="true"
    :closeable="false"
    :duration="300"
    @close="closePopup"
    @update:show="val => emit('update:show', val)"
  >
    <view
      class="panel-wrapper"
      @touchstart.stop="onTouchStart"
	  @touchend.stop="onTouchEnd"
    >
      <!-- 搜索栏 -->
      <SearchInput
        v-model="modelValue"
        :placeholder="placeholder"
        @back="closePopup"
        @search="onSearch"
        @change="onInputChange"
      />

      <!-- 主体区域 -->
      <view class="search-body">
        <!-- 未搜索状态 -->
        <template v-if="!isSearched">
          <SearchTag :tags="tagList" @search="onSearch" />
          <SearchHistory
            :history="searchHistory"
            @search="onSearch"
            @clear="clearHistory"
          />
        </template>

        <!-- 搜索结果区域 -->
        <template v-else>
          <SearchResultItem
            v-for="(item, index) in searchResults"
            :key="index"
            :title="item.title"
            :desc="item.desc"
          />
        </template>
      </view>
    </view>
  </u-popup>
</template>

<script setup>
import { ref } from 'vue'
import SearchInput from './children/SearchInput.vue'
import SearchTag from './children/SearchTag.vue'
import SearchHistory from './children/SearchHistory.vue'
import SearchResultItem from './children/SearchResultItem.vue'

const props = defineProps({
  show: Boolean,
  placeholder: { type: String, default: '请输入搜索内容' }
})
const emit = defineEmits(['update:show'])

const isSearched = ref(false)
const keyword = ref('')
const modelValue = ref('')

function closePopup() {
  emit('update:show', false)
  keyword.value = ''
  isSearched.value = false
}

function onSearch(val) {
  keyword.value = val
  modelValue.value = val
  isSearched.value = val.trim().length > 0
  console.log('搜索内容：', val)
}

function clearHistory() {
  searchHistory.value = []
}

function onInputChange(val) {
  isSearched.value = val.trim().length > 0
}

// 搜索结果模拟数据
const searchResults = ref([
  { title: '搜索结果一', desc: '这是第一个结果的描述' },
  { title: '搜索结果二', desc: '这是第二个结果的描述' },
  { title: '搜索结果三', desc: '这是第三个结果的描述' }
])

const searchHistory = ref(['AI智能', 'Vue3组件', '笔记标签', '语音识别'])

const tagList = ref(['AIGC', 'Agent', 'LLM', 'VLM'])

// 手势关闭逻辑
let startX = 0
let startY = 0

function onTouchStart(e) {
	console.log(e)
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
}

function onTouchEnd(e) {
	console.log(e)
  const endX = e.changedTouches[0].clientX
  const endY = e.changedTouches[0].clientY
  const deltaX = endX - startX
  const deltaY = Math.abs(endY - startY)
  console.log(deltaX)
  console.log(deltaY)

  if (deltaX > -60 && deltaY < 30) {
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

.search-body {
  flex: 1;
  overflow-y: auto;
  padding-left: 3vw;
  padding-right: 3vw;
  padding-top: 4vh;
  padding-bottom: 1vh;
}
</style>
