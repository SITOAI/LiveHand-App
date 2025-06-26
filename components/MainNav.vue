<template>
  <button @click="handleClick">
    <span>
      <u-icon name="plus-circle" size="20" color="#fff" />
      创建{{ labelText }}
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  label: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['click'])

function handleClick() {
  emit('click', props.label)
}

const labelText = computed(() => {
  switch (props.label) {
    case 0:
      return '资料'
    case 1:
      return '知识库'
    default:
      return '内容'
  }
})
</script>

<style scoped>
button {
  border: 2px solid #24b4fb;
  background-color: #24b4fb;
  border-radius: 0.9em;
  cursor: pointer;
  padding: 0.8em 1.2em 0.8em 1em;
  transition: all ease-in-out 0.2s;
  font-size: 16px;
  outline: none;
  box-shadow: none;
}

button:focus,
button:active {
  outline: none;
  box-shadow: none;
}

button span {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 600;
}
</style>
