<template>
  <view class="container">
		<!-- 顶部不固定的部分 -->
		<view class="header_section">
			<view class="explore_logo_area">
				<view class="logo_container">
					<image class="explore_logo" src="../../../static/logoIcon/64x64.png" mode="widthFix"></image>
				</view>
			</view>
		</view>
		<!-- 滚动到顶部时固定的搜索框 -->
		<view  class="sticky_box"@click="navigateToSearch">
			<input class="sticky_search" type="text" placeholder="把问题和任务告诉我" disabled/>
			<view class="explore_input_search_button">
				<image class="explore_input_search_image" src="../../../static/search_inner.png" mode="widthFix"></image>
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
	</view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import RecommendCard from "../../../components/cards/RecommendCard.vue"
import { mockExploreData } from "../../../utils/mock/exploreData.js"

// 从mock数据文件导入推荐内容
const data = ref(mockExploreData)

onMounted(() => {
})

onUnmounted(() => {
  // 移除事件监听并重置状态
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

/* 顶部不固定的部分 */
.header_section {
  padding: 160rpx 20rpx 0 20rpx;
  background-image: url('../../static/background-login.png');
  background-size: 100% auto;
  background-repeat: no-repeat;
  background-position: top center;
}

/* 滚动到顶部时固定的搜索框 */
.sticky_box{
  background-color: #f5f5f5;
  z-index: 10000;
  position: sticky;
  top: 0; 
  padding-top: 70rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sticky_search {
  width: 100%;
  background-color: #ffffff;
  height: 46px;
  border-radius: 10px;
  margin: 0 20px 20px 20px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

/* 滚动部分样式 */
.scroll_content {
  padding: 0 20px 20px 20px;
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
  justify-content: center;
  align-items: center;
}

.logo_container {
  width: 128rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.explore_logo {
  width: 100%;
  height: auto;
  border-radius: 20rpx;
}



.explore_input_search_button {
	position: absolute;
	right: 50rpx;
	top: 55rpx;
  transform: translateY(50%);
	background-color: rgba(22, 73, 224, 0.854);
	display: flex;
	align-items: center;
	padding: 5px;
	width: 60px;
	height: 20px;
	border-radius: 25px;
	justify-content: center;
    z-index: 100000;
}

.explore_input_search_image {
	width: 15px;

}

.ask_question_area {
  display: flex;
  align-items: center;
  margin-top: 40rpx;
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