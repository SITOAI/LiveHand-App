<template>
  <view class="know-details">
    <view class="details-header">
      <u-icon name="arrow-left" size="24" @click="goBack" />
      <text class="details-title">{{ name }}</text>
    </view>
    <view class="details-body">
      <text>这里是知识库详情页，目前仅展示基础信息。</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const name = ref('')
const user = ref('')
const prompt = ref('')
const count = ref(0)
const users = ref(0)
const time = ref('')
const tags = ref([])

onLoad((options) => {
  name.value = decodeURIComponent(options.name || '')
  user.value = decodeURIComponent(options.user || '')
  prompt.value = decodeURIComponent(options.prompt || '')
  count.value = Number(options.count || 0)
  users.value = Number(options.users || 0)
  time.value = options.time || ''
  try {
    tags.value = JSON.parse(decodeURIComponent(options.tags || '[]'))
  } catch (e) {
    tags.value = []
  }
})

function goBack() {
  uni.navigateBack()
}
</script>

<style scoped>
.know-details {
  padding: 16px;
  background-color: #fff;
  min-height: 100vh;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.details-title {
  font-size: 18px;
  font-weight: bold;
}

.details-body {
  font-size: 15px;
  color: #333;
}
</style>
