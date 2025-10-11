<template>
  <view class="tag-wrapper">
    <view class="tag-header">
      <text class="tag-title">{{ title }}</text>
      <u-icon name="edit-pen" size="20" @click="onEditClick" />
    </view>
    <view class="tag-list">
      <u-tag
        v-for="(item, index) in tags"
        :key="index"
        :text="item"
        plain
        size="mini"
        type="primary"
        @click="$emit('search', item)"
      />
    </view>
  </view>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: '标签'
  }
})

function onEditClick() {
  console.log('搜索界面编辑标签icon被点击')
}
</script>

<style scoped>
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
</style>
