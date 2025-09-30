<template>
  <view class="menu-item" @click="$emit('click')">
    <u-icon :name="icon" size="20" class="menu-icon" />
    <text class="menu-text">{{ title }}</text>
    <u-icon v-if="isOk" name="arrow-right" size="16" class="arrow-icon" />
	<text v-else class="wait-later">敬请期待</text>
  </view>
</template>

<script setup>
defineProps({
  title: String,
  icon: String,
  isOk: Boolean
})
</script>

<style scoped>
.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  /* width: 60%; */
  /* border-bottom: 1px solid #eee; */
}
.menu-icon {
  margin-right: 12px;
}
.menu-text {
  flex: 1;
  font-size: 15px;
  color: #333;
}
.arrow-icon {
  color: #999;
}
.wait-later {
	font-size: 13px;
}
</style>
