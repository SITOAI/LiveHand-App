<template>
  <div class="recommend_card">
    <!-- 1. 标题栏 -->
    <div class="recommend_card_title_area">
      <span class="recommend_card_title_span">{{ title }}</span>
      <image class="recommend_card_more" src="../../static/extra.png" mode="widthFix"/>
    </div>

    <!-- 2. 头像、昵称和内容 -->
    <div class="recommend_card_user_info">      
      <image class="owner_logo" :src="owner_logo" mode="widthFix" />
      <div class="owner_content">
        <p class="owner_name">{{ owner_name }}：<text class="summary">{{ summarize }}</text></p>
      </div>
    </div>

    <!-- 3. 图片区域 -->
    <div class="recommend_card_images_area">
      <image class="recommend_card_image" v-for="(img, index) in images" :key="index" :src="img" mode="aspectFill" />
    </div>

    <!-- 4. 互动数据 -->
    <div class="recommend_card_interaction">
      <span class="answer_count">{{ reply }}人回答</span>
      <div class="like_area">
        <span class="like_count">{{ like }}</span>
        <image class="like_icon" src="../../static/good.png" mode="widthFix" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title:        {
    type: String,
    default: 'AI(人工智能) 时代来了，我们应该如何应对?'
  },
  owner_logo:   {
    type: String,
    default: '../../static/owner_logo.png'
  },
  owner_name:   {
    type: String,
    default: '秀儿同学来了'
  },
  summarize:    {
    type: String,
    default: 'AI时代很多岗位被替代都是不可避免的,我们应该树立终身学习的理念，提升技能以适应新时代的发展需求。'
  },
  images:       {
    type: Array,
    default: () => [
      '../../static/test/test0.png',
      '../../static/test/test1.png',
      '../../static/test/test2.png'
    ]
  },
  like:         {
    type: String,
    default: '58'
  },
  reply:        {
    type: String,
    default: '1658'
  }
});
</script>

<style scoped>
.recommend_card{
  background: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 标题栏 */
.recommend_card_title_area{
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
}
.recommend_card_title_span{
  font-size: 32rpx;
  font-weight: 500;
  color: #131313;
  word-wrap: break-word;
  word-break: break-word;
  flex: 1;
  margin-right: 35rpx;
}
.recommend_card_more{
  width: 27rpx;
  height: 5rpx;
  display: block;
  position: absolute;
  right: 0;
  top: 16rpx; /* 垂直居中对齐标题的第一行 */
}

/* 用户信息和内容 */
.recommend_card_user_info{
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  height: auto;
  height: 96rpx;
}
.owner_logo{
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  flex-shrink: 0;
  display: block;
  margin-top: 5rpx;
}
.owner_content {
  height: 85rpx;
  overflow: hidden;
  text-overflow: ellipsis;
}
.owner_name{
  font-size: 27rpx;
  color: #ccc;
  font-family: Source Han Sans CN, Source Han Sans CN;
  font-weight: 400;
    overflow: hidden;
  text-overflow: ellipsis;
}
.summary{
  font-size: 27rpx;
  color: #222;
  font-family: Source Han Sans CN, Source Han Sans CN;
  font-weight: 400;
  margin: 0;
  padding-left: 4rpx;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 图片区域 */
.recommend_card_images_area{
  display: flex;
  flex-wrap: wrap;
  gap: 13rpx;
  margin-top: 10rpx;
  margin-bottom: 10rpx;
}
.recommend_card_image{
  width: 193rpx;
  height: 193rpx;
  border-radius: 20rpx;
  display: block;
  object-fit: cover;
  flex-shrink: 0;
}

/* 互动数据 */
.recommend_card_interaction{
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.answer_count{
  font-size: 26rpx;
  color: #999999;
}
.like_area{
  display: flex;
  align-items: center;
  gap: 5rpx;
  font-size: 26rpx;
  color: #999999;
}
.like_icon{
  width: 26rpx;
  height: 26rpx;
  display: block;
}
.like_count{
  font-size: 26rpx;
  color: #999999;
}

/* 互动数据 */
.recommend_card_interaction{
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.answer_count{
  font-size: 26rpx;
  color: #999999;
}
.like_area{
  display: flex;
  align-items: center;
  gap: 5rpx;
  font-size: 26rpx;
  color: #999999;
}
.like_icon{
  width: 26rpx;
  height: 26rpx;
}
.like_count{
  font-size: 26rpx;
  color: #999999;
}
</style>