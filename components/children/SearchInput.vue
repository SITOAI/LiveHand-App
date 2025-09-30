<template>
  <view class="search-header">
    <u-icon name="arrow-left" size="28" @click="$emit('back')" />
    <view class="search-box">
      <u-icon name="search" size="18" />
      <input
        class="input"
        :placeholder="placeholder"
        v-model="inputValue"
        @input="handleInput"
      />
      <!-- 语音 or 清除按钮 -->
      <u-icon
        v-if="inputValue"
        name="close-circle"
        size="18"
        @click="clearInput"
      />
      <u-icon
        v-else
        name="mic"
        size="18"
        @click="onVoice"
      />
    </view>
    <text class="search-btn" @click="emit('search', inputValue)">搜索</text>
  </view>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: String,
  placeholder: String
})
const emit = defineEmits(['update:modelValue', 'search', 'back', 'change'])

const inputValue = ref(props.modelValue || '')

watch(() => props.modelValue, val => {
  inputValue.value = val
})

function handleInput() {
  emit('update:modelValue', inputValue.value)
  emit('change', inputValue.value)
}

function clearInput() {
  inputValue.value = ''
  emit('update:modelValue', '')
  emit('change', '')
}

function onVoice() {
  console.log('现在是在SearchPanel组件里面语音搜索')
}
</script>

<style scoped>
.search-header {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 10px 0;
  gap: 8px;
}
.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: #cccccc30;
  padding: 6px 10px;
  border-radius: 16px;
}
.input {
  flex: 1;
  padding: 4px 8px;
  font-size: 14px;
  border: none;
  background-color: transparent;
}
.search-btn {
  margin-left: 10px;
  color: #007aff;
  font-size: 14px;
}
</style>
