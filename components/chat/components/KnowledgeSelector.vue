<template>
  <view class="knowledge-selector">
    <view class="label">关联知识库</view>

    <!-- 已选择的知识库 Tag 列表 -->
    <view class="selected-list">
      <view
        v-for="(item, index) in selected"
        :key="item.id"
        class="selected-tag"
      >
        <text class="tag-text">{{ item.name }}</text>
        <u-icon name="close" size="18" @click="removeItem(index)" />
      </view>

      <!-- 添加按钮 -->
      <view class="add-tag" @click="showPopup = true">
        <u-icon name="plus" size="18" />
      </view>
    </view>

    <!-- 弹出选择面板 -->
    <u-popup :show="showPopup" mode="bottom" @close="showPopup = false">
      <view class="popup-panel">
        <view class="popup-title">选择知识库</view>
        <scroll-view style="max-height: 60vh;" scroll-y>
          <view
            class="item"
            v-for="item in allOptions"
            :key="item.id"
            @click="toggleSelect(item)"
          >
            <u-checkbox :checked="isSelected(item)" :label="item.name" />
          </view>
        </scroll-view>
        <view class="popup-footer">
          <u-button type="primary" text="确定" @click="confirm" />
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  options: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const selected = ref([...props.modelValue])
const allOptions = ref([...props.options])
const showPopup = ref(false)

watch(() => props.modelValue, val => {
  selected.value = [...val]
})

function removeItem(index) {
  selected.value.splice(index, 1)
  emit('update:modelValue', selected.value)
}

function toggleSelect(item) {
  const exists = selected.value.find(i => i.id === item.id)
  if (exists) {
    selected.value = selected.value.filter(i => i.id !== item.id)
  } else {
    selected.value.push(item)
  }
}

function isSelected(item) {
  return selected.value.some(i => i.id === item.id)
}

function confirm() {
  showPopup.value = false
  emit('update:modelValue', selected.value)
}
</script>

<style scoped>
.knowledge-selector {
  margin-bottom: 20rpx;
}
.label {
  font-size: 28rpx;
  margin-bottom: 10rpx;
  color: #666;
}
.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.selected-tag {
  background-color: #e6f0ff;
  color: #333;
  border-radius: 20rpx;
  padding: 8rpx 16rpx;
  display: flex;
  align-items: center;
}
.tag-text {
  margin-right: 6rpx;
}
.add-tag {
  padding: 8rpx 16rpx;
  background-color: #f0f0f0;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
}

.popup-panel {
  padding: 20rpx;
  background: #fff;
  border-top-left-radius: 20rpx;
  border-top-right-radius: 20rpx;
}
.popup-title {
  font-size: 30rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}
.item {
  padding: 16rpx 0;
  border-bottom: 1px solid #eee;
}
.popup-footer {
  margin-top: 20rpx;
}
</style>
