<template>
  <view class="main-bottom-bar">
	<view class="main-bottom-bar-icon-area" @click="handleClick(1)">
		<image v-if="label == 1" class="main-bottom-bar-icon" src="../static/expolre_selected.png" mode="aspectFit"></image>
		<image v-else class="main-bottom-bar-icon" src="../static/expolre.png" mode="aspectFit"></image>
		<span class="main-bottom-bar-span" :class="{ 'active-span': label == 1 }">
			探索
		</span>
	</view>
		<view class="main-bottom-bar-icon-area" @click="handleClick(2)">
		<image v-if="label == 2" class="main-bottom-bar-icon" src="../static/knowledge_selected.png" mode="aspectFit"></image>
		<image v-else class="main-bottom-bar-icon" src="../static/knowledge.png" mode="aspectFit"></image>
		<span class="main-bottom-bar-span" :class="{ 'active-span': label == 2 }">
			知识
		</span>
	</view>
	<view class="main-bottom-bar-icon-area" @click="handleClick(0)">
		<image class="main-bottom-bar-create-icon" src="../static/main_create.png" mode="aspectFit"></image>
	</view>
	<view class="main-bottom-bar-icon-area" @click="handleClick(3)">
		<image v-if="label == 3" class="main-bottom-bar-icon" src="../static/agents_selected.png" mode="aspectFit"></image>
		<image v-else class="main-bottom-bar-icon" src="../static/agents.png" mode="aspectFit"></image>
		<span class="main-bottom-bar-span" :class="{ 'active-span': label == 3 }">
			智能体
		</span>
	</view>
	<view class="main-bottom-bar-icon-area" @click="handleClick(4)">
		<image v-if="label == 4" class="main-bottom-bar-icon" src="../static/mine_selected.png" mode="aspectFit"></image>
		<image v-else class="main-bottom-bar-icon" src="../static/mine.png" mode="aspectFit"></image>
		<span class="main-bottom-bar-span" :class="{ 'active-span': label == 4 }">
			我的
		</span>
	</view>
	</view>
</template>

<script setup>
import { computed, ref } from 'vue'

const current_label = ref(0)

const props = defineProps({
  label: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['click'])

function handleClick(current_label) {
    emit('click', current_label)
}
</script>

<style scoped>
.main-bottom-bar {
	width: 100vw;
	height: 150rpx;
	/* padding-top: 16rpx; */
	background-color: #ffffff;
	display: flex;
    align-items: center;
	justify-content: space-around;
	box-sizing: border-box;
	/* 添加上边框阴影效果 */
	box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

/* 确保在小屏幕上也能完全显示 */
@media screen and (max-width: 360px) {
	.main-bottom-bar {
		height: 80rpx;
	}
}

.main-bottom-bar-icon-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1; /* 每个区域均等分配宽度 */
  height: 100%;
  /* margin-bottom: 50rpx; */
}

.main-bottom-bar-icon {
	width: 50rpx;
	height: 50rpx;
	margin-bottom: 8rpx;
}

.main-bottom-bar-span {
	font-size: 22rpx;
	color: #666666;
	font-weight: 500;
}

/* 选中状态的样式 */
.active-span {
	color:#2E5CE7 !important;
	font-weight: 500;
}

.main-bottom-bar-create-icon {
	width: 70rpx;
	height: 70rpx;
	/* 使用负值margin让创建按钮突出显示 */
	margin-bottom: 10rpx;
}
</style>
