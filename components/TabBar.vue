<template>
  <view class="tabbar">
    <view
      v-for="(tab, i) in ['笔记', '知识库']"
      :key="i"
      class="tab"
      :class="{ active: activeIndex === i }"
      @click="onTabClick(i)"
    >
      {{ tab }}
      <view v-if="activeIndex === i" class="active-line"></view>
    </view>
  </view>
</template>

<script setup>
import { computed, defineEmits, defineProps } from 'vue'

const props = defineProps({
  modelValue: Number
})
const emit = defineEmits(['update:modelValue', 'change'])

const activeIndex = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
    emit('change', val)
  }
})

function onTabClick(index) {
  activeIndex.value = index
}
</script>

<style scoped>
.tabbar {
  display: flex;
  gap: 20px;           /* 固定间距 */
  justify-content: center;
  padding: 0 10px;
}

.tab {
  white-space: nowrap;
  font-size: 16px;
  text-align: center;
  padding: 10px 8px;
  position: relative;
  cursor: pointer;
  color: #333;
  user-select: none;
}

.tab.active {
  font-weight: bold;   /* 激活后加粗 */
}

.active-line {
  position: absolute;
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 2px;
  background: red;
  border-radius: 1px;
}
</style>
