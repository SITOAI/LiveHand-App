<template>
  <view class="container">
		<!-- 固定部分：explore_input 区域以上内容 -->
		<view class="fixed_header">
			<view class="explore_header">
				<image class="explore_header_image" src="../../../static/more.png" mode="widthFix"></image>
				<!-- <image class="explore_header_image" src="../../../static/search_explore.png" mode="widthFix" @click="navigateToSearch"></image> -->
			</view>
			
			<view class="explore_logo_area">
				<image class="explore_logo" src="../../../static/logo-group.png" mode="widthFix"></image>
			</view>
			
			<view class="explore_input" @click="navigateToSearch">
				<input type="text" placeholder="把问题和任务告诉我" disabled/>
				<view class="explore_input_search_button">
					<image class="explore_input_search_image" src="../../../static/search_inner.png" mode="widthFix"></image>
				</view>
			</view>
		</view>
		
		<!-- 滚动部分 -->
		<view class="scroll_content">
			<view class="ask_question_area">
				<image src="../../../static/wen.png" class="ask_question_image" mode="widthFix"></image>
				<text class="ask_question_text">问一问</text>
			</view>
			
			<view class="explore_content">
			  <!-- 循环 -->
			  <template v-for="(item, idx) in data" :key="idx">
			    <RecommendCard
			      :title="item.title"
			      :owner_logo="item.owner_logo"
			      :owner_name="item.owner_name"
			      :summarize="item.summarize"
			      :cover_image="item.cover_image"
			      :cite="item.kol.cite"
			      :like="item.kol.like"
			      :reply="item.kol.reply"
			    />
			    <!-- 只要不是最后一项，就插分割线 -->
			    <u-divider
			      v-if="idx !== data.length - 1"
			      lineColor="#e0e0e0"
			      halfWidth="90%"
			      margin="12px 0"
			    ></u-divider>
			  </template>
			
			  <!-- 最后一个元素结束后的"收尾" divider -->
			  <u-divider text="分割线" :dot="true"></u-divider>
			</view>
		  </view>
  
  <!-- 引入SelectionPanel组件 - 移除items属性 -->
  <SelectionPanel v-model:show="showCenterModal" />
</view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import SelectionPanel from "../../../components/SelectionPanel.vue"
import RecommendCard from "../../../components/cards/RecommendCard.vue"

// 响应式数据 - 移除popupItems变量
const showCenterModal = ref(false)
const data = ref([
	{
		title: "C++中string如何实现字符串分割函数split()——4种方法",
		owner_logo: "../../static/owner_logo.png",
		owner_name: "秀儿同学来了",
		summarize: "本文介绍了在C++中实现字符串分割的四种方法，包括使用stringstream流、string类的find与substr方法、C库函数strtok以及regex_token_iterator(正则表达式)，并给出了各方法的函数原型、使用注意事项和测试用例。",
		cover_image: "../../static/test_cover.png",
		kol: {
			cite: "1000",
			like: "200",
			reply: "600"
		}
	},
	{
		title: "C++中string如何实现字符串分割函数split()——4种方法",
		owner_logo: "../../static/owner_logo.png",
		owner_name: "秀儿同学来了",
		summarize: "本文介绍了在C++中实现字符串分割的四种方法，包括使用stringstream流、string类的find与substr方法、C库函数strtok以及regex_token_iterator(正则表达式)，并给出了各方法的函数原型、使用注意事项和测试用例。",
		cover_image: "../../static/test_cover.png",
		kol: {
			cite: "1000",
			like: "200",
			reply: "600"
		}
	},
	{
		title: "C++中string如何实现字符串分割函数split()——4种方法",
		owner_logo: "../../static/owner_logo.png",
		owner_name: "秀儿同学来了",
		summarize: "本文介绍了在C++中实现字符串分割的四种方法，包括使用stringstream流、string类的find与substr方法、C库函数strtok以及regex_token_iterator(正则表达式)，并给出了各方法的函数原型、使用注意事项和测试用例。",
		cover_image: "../../static/test_cover.png",
		kol: {
			cite: "1000",
			like: "200",
			reply: "600"
		}
	},
	{
		title: "C++中string如何实现字符串分割函数split()——4种方法",
		owner_logo: "../../static/owner_logo.png",
		owner_name: "秀儿同学来了",
		summarize: "本文介绍了在C++中实现字符串分割的四种方法，包括使用stringstream流、string类的find与substr方法、C库函数strtok以及regex_token_iterator(正则表达式)，并给出了各方法的函数原型、使用注意事项和测试用例。",
		cover_image: "../../static/test_cover.png",
		kol: {
			cite: "1000",
			like: "200",
			reply: "600"
		}
	}
])

// 监听自定义事件
let modalListener = null

onMounted(() => {
  // 监听特定的自定义事件
  modalListener = uni.$on('showExploreModal', () => {
    showCenterModal.value = true
  })
  
  // 监听tabbar切换事件，关闭弹框
  uni.$on('closeAllModals', () => {
    showCenterModal.value = false
  })
})

onUnmounted(() => {
  // 移除事件监听并重置状态
  if (modalListener) {
    uni.$off('showExploreModal', modalListener)
  }
  showCenterModal.value = false
})



function navigateToSearch() {
  console.log('跳转搜索页面')
  uni.navigateTo({
    url: '/pages/search/explore'
  })
}
</script>

<style scoped>
.container {
  position: relative;
  min-height: 100vh;
  background: #f5f5f5;        /* 默认全部灰背景 */
  background-image: url('../../static/background-login.png');
  background-size: 100% 200px;
  background-repeat: no-repeat;
  background-position: top center;
}

/* 固定部分样式 */
.fixed_header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #f5f5f5;
  background-image: url('../../static/background-login.png');
  background-size: 100% auto;
  background-repeat: no-repeat;
  background-position: top center;
  padding: 40px 20px 0 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.01);
}

/* 滚动部分样式 */
.scroll_content {
  padding: calc(250px + 40px) 20px 20px 20px; /* 顶部固定高度 + 底部栏高度 + 边距 */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 原 explore_area 相关样式调整 */

.explore_header {
	display: flex;
	justify-content: space-between;
}

.explore_header_image {
	width: 25px;
}

.explore_logo_area {
  display: flex;
}

.explore_logo {
  width: 250px;
  margin: auto;
}

.explore_input {
	display: flex;
	background-color: #ffffff;
	align-items: center;
	justify-content: space-between;
	height: 25px;
	border-radius: 10px;
	margin-top: 50px;
	padding: 15px;
	margin-bottom: 20rpx;
}

.explore_input_search_button {
	background-color: rgba(75,116,239,0.3);
	display: flex;
	align-items: center;
	padding: 5px;
	width: 60px;
	height: 20px;
	border-radius: 25px;
	justify-content: center;
}

.explore_input_search_image {
	width: 15px;
}

.ask_question_area {
  display: flex;
  align-items: center;
  margin-top: 90rpx;
}

.ask_question_image {
  width: 38rpx;
  height: 34rpx;
  margin-right: 10rpx;
}

.ask_question_text {
  font-size: 28rpx;
  color: #333;
}

.explore_content {
  margin-top: 20rpx;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px;
  /* 让分割线能被看见：给 divider 上下留点空间 + 颜色加深 */
  --divider-margin: 12px 0;
  --divider-color: #e0e0e0;
}

::v-deep .uni-input-placeholder {
  color: #ccc;
  opacity: 1;
}
</style>