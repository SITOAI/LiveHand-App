<template>
  <view class="history-wrapper">
    <view class="history-header">
      <text class="history-title">历史记录</text>
	  <u-icon name="trash" size=18 @click="$emit('clear')"></u-icon>
    </view>

    <view class="history-list" v-if="history.length > 0">
      <view
        v-for="(item, index) in history"
        :key="index"
        class="history-item"
        @click="$emit('search', item)"
      >
        {{ item }}
      </view>
    </view>

    <view v-else class="no-history">
      <text>暂无历史记录</text>
    </view>
  </view>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
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

.clear-btn {
  font-size: 14px;
  color: #999;
  padding: 4px 8px;
  border-radius: 4px;
}

.clear-btn:active {
  background-color: #eee;
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
</style>
