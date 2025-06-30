<template>
  <view class="subtabbar" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view
      v-for="(tab, i) in ['新闻', '调研', '简历']"
      :key="i"
      class="subtab"
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
  modelValue: Number,
  statusBarHeight: {
      type: Number,
      default: 20
    }
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
.subtabbar {
  display: flex;
  gap: 20px;           /* 固定间距 */
  justify-content: center;
  padding: 0 10px;
  margin-top: -10px;
}

.subtab {
  white-space: nowrap;
  font-size: 13px;
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
