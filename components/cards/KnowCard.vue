<template>
  <div class="know-card" @click="openDetails">
    <!-- 顶部信息 -->
    <div class="know-top">
      <div class="know-title-block">
        <div class="know-title">{{ name }}</div>
        <div class="know-icons">
          <u-icon name="share" size="20" color="#666" @click.stop="onShare" />
          <u-icon name="trash" size="20" color="#666" @click.stop="onDelete" />
        </div>
      </div>
      <div class="know-user">@{{ user }}</div>
    </div>

    <!-- 主体内容 + 底部区域 -->
    <div class="know-main">
      <div class="know-content">
        {{ prompt }}
      </div>

      <div class="know-bottom-divider"></div>

      <div class="know-footer">
        <div class="know-info">
          <span class="know-time">{{ time }}</span>
          <span class="know-separator">|</span>
          <span class="know-usage">{{ count }}个内容 · {{ users }}人在用</span>
        </div>
        <div class="know-tags">
          <u-tag
            v-for="(tag, index) in tags"
            :key="index"
            :text="tag.text"
            :type="tag.type"
            size="mini"
            plain
            class="tag-item"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  name: String,
  user: String,
  prompt: String,
  count: String,
  users: String,
  time: String,
  tags: {
    type: Array,
    default: () => [
      { text: '标签一', type: 'warning' },
      { text: '标签二', type: 'success' }
    ]
  }
})

const onShare = () => {
  console.log('点击了分享')
}

const onDelete = () => {
  console.log('点击了删除')
}

function openDetails() {
  uni.navigateTo({
    url: `/pages/details/KnowDetails/KnowDetails?name=${encodeURIComponent(props.name)}&user=${encodeURIComponent(props.user)}&prompt=${encodeURIComponent(props.prompt)}&count=${props.count}&users=${props.users}&time=${props.time}&tags=${encodeURIComponent(JSON.stringify(props.tags))}`
  })
}
</script>

<style scoped>
.know-card {
  width: 100vw;
  height: 20vh;
  background-color: #ffff;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  padding: 14px 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 顶部区域 */
.know-top {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.know-title-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.know-title {
  font-size: 16px;
  font-weight: 800;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.know-icons {
  display: flex;
  gap: 8px;
}

.know-user {
  font-size: 12px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 分割线 */
.know-divider {
  height: 1px;
  background-color: #ddd;
  margin: 4px 0;
}

/* 主体内容 */
.know-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.know-content {
  font-size: 14px;
  color: #444;
  line-height: 1.5;
  overflow: hidden;
  position: relative;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

/* 底部分割线 */
.know-bottom-divider {
  height: 1px;
  background-color: #ddd;
  margin: 4px 0;
}

/* 底部区域 */
.know-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 12px;
  color: #666;
  flex-wrap: nowrap;
}

.know-info {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.know-time {
  color: #888;
}

.know-separator {
  color: #bbb;
}

.know-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 45%;
  justify-content: flex-end;
  align-content: flex-start;
}

.tag-item {
  flex-shrink: 0;
}
</style>
