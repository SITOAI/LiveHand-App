<template>
  <view class="item-card">
    <text class="title">{{ title }}</text>
    <text class="desc">{{ desc }}</text>
  </view>
</template>

<script setup>
defineProps({
  title: String,
  desc: String
})
</script>

<style scoped>
.item-card {
  background: #f9f9f9;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.title {
  font-weight: bold;
  font-size: 16px;
}
.desc {
  font-size: 14px;
  color: #666;
  margin-top: 6px;
}
</style>
