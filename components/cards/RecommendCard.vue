<template>
  <div class="recommend_card">
    <!-- 1. 标题栏 -->
    <div class="recommend_card_title_area">
      <span class="recommend_card_title_span">{{ title }}</span>
      <u-icon name="more-dot-fill" size="20"></u-icon>
    </div>

    <!-- 2. 主体：左文字 + 右封面 -->
    <div class="recommend_card_body">
      <div class="recommend_card_body_text">
        <p class="summary">{{ summarize }}</p>
      </div>
      <img class="recommend_card_body_image" :src="cover_image" mode="aspectFill" />
    </div>

    <!-- 3. 底部：作者 + 互动 -->
    <div class="recommend_card_footer">
      <img class="owner_logo" :src="owner_logo" />
      <span class="owner_name">{{ owner_name }}</span>
      <div class="stats">
        <span>{{ cite }} 引用</span>
        <span>{{ like }} 赞同</span>
        <span>{{ reply }} 回复</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title:        String,
  owner_logo:   String,
  owner_name:   String,
  summarize:    String,
  cover_image:  String,
  cite:         String,
  like:         String,
  reply:        String
});
</script>

<style scoped>
.recommend_card{
  height: 200px;
  background: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* 标题栏 */
.recommend_card_title_area{
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.recommend_card_title_span{
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #131313;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
}

/* 主体 */
.recommend_card_body{
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 8px 0;
}
.recommend_card_body_text{
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
}
.summary{
  display: -webkit-box;
  /* -webkit-line-clamp: 3; */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: #555;
  line-height: 1.5;
}
.recommend_card_body_image{
  width: 100px;
  height: 140px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

/* 底部 */
.recommend_card_footer{
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
}
.owner_logo{
  width: 20px;
  height: 20px;
  border-radius: 50%;
}
.owner_name{
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stats{
  display: flex;
  gap: 8px;
}
</style>