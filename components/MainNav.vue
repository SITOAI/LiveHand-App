<template>
	<view class="main-bottom-bar">
		<view class="main-bottom-bar-icon-area" @click="handleClick(1)">
			<image v-if="label == 1" class="main-bottom-bar-icon" src="../static/expolre_selected.png" mode="widthFix"></image>
			<image v-else class="main-bottom-bar-icon" src="../static/expolre.png" mode="widthFix"></image>
			<span class="main-bottom-bar-span">
				探索
			</span>
		</view>
		<view class="main-bottom-bar-icon-area" @click="handleClick(2)">
			<image v-if="label == 2" class="main-bottom-bar-icon" src="../static/knowledge_selected.png" mode="widthFix"></image>
			<image v-else class="main-bottom-bar-icon" src="../static/knowledge.png" mode="widthFix"></image>
			<span class="main-bottom-bar-span">
				知识
			</span>
		</view>
		  <view class="main-bottom-bar-icon-area" @click="handleClick(0)">
			<image class="main-bottom-bar-create-icon" src="../static/main_create.png" mode="widthFix"></image>
		</view>
		  <view class="main-bottom-bar-icon-area" @click="handleClick(3)">
			<image v-if="label == 3" class="main-bottom-bar-icon" src="../static/agents_selected.png" mode="widthFix"></image>
			<image v-else class="main-bottom-bar-icon" src="../static/agents.png" mode="widthFix"></image>
			<span class="main-bottom-bar-span">
				智能体
			</span>
		</view>
		  <view class="main-bottom-bar-icon-area" @click="handleClick(4)">
			<image v-if="label == 4" class="main-bottom-bar-icon" src="../static/mine_selected.png" mode="widthFix"></image>
			<image v-else class="main-bottom-bar-icon" src="../static/mine.png" mode="widthFix"></image>
			<span class="main-bottom-bar-span">
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
	height: 90px;
	background-color: #ffffff;
	display: flex;
    align-items: center;
	padding-left: 30px;
	padding-right: 30px;
	gap: 50px;
}

.main-bottom-bar-icon-area {
	display: flex;
  flex-direction: column;
  align-items: center;
}

.main-bottom-bar-icon {
	width: 35px;
}

.main-bottom-bar-span {
	font-size: 14px;
}

.main-bottom-bar-create-icon {
	width: 40px;
	bottom: 5px;
}
</style>
