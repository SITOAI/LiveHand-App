<template>
  <div class="note-card" style="position: relative;">
    <!-- 顶部信息 -->
    <div class="note-top">
      <div class="note-title" @click.stop="openDetails">{{ title }}</div>
	  <div class="note-title-info">
		  <div class="repo-know" @click.stop>
		    <u-icon name="bag" size="18" color="#666" />
		    <span class="repo-name">{{ repo }}</span>
		  </div>
		  <div class="note-time">{{ time }}</div>
	  </div>
    </div>

    <!-- 分割线 -->
    <div class="note-divider"></div>

    <!-- 主体内容 + 底部区域 -->
    <div class="note-main">
      <div class="note-content" @click.stop="openDetails">
        {{ content }}
      </div>

      <div class="note-bottom-divider"></div>

      <div class="note-footer">
        <div class="note-repo">
          
          <view class="repo-tags" @click.stop>
            <u-tag
              v-for="(tag, index) in tags"
              :key="index"
              :text="tag.text"
              :type="tag.type"
              plain
              size="mini"
              class="note-tag"
            />
          </view>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { defineEmits } from 'vue'

const props = defineProps({
  title: { type: String, default: '无标题笔记' },
  time: { type: String, default: '2025-06-26' },
  content: { type: String, default: '这里是笔记的内容区域，超过部分会被省略显示，保持卡片整洁。' },
  repo: { type: String, default: '默认知识库' },
  tags: {
    type: Array,
    default: () => [
      { text: '标签一', type: 'warning' },
      { text: '标签二', type: 'success' },
      { text: '标签三', type: 'primary' }
    ]
  }
})

const emit = defineEmits(['delete'])

const showDelete = ref(false)

function openDetails() {
  console.log('打开详情页')
  uni.navigateTo({
    url: `/pages/details/NoteDetails/NoteDetails?title=${encodeURIComponent(props.title)}&time=${props.time}&content=${encodeURIComponent(props.content)}&repo=${encodeURIComponent(props.repo)}&tags=${encodeURIComponent(JSON.stringify(props.tags))}`
  })
}

function handleDeleteConfirm() {
  showDelete.value = false
  emit('delete')
}
</script>

<style scoped>
.modal-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  overflow: hidden;
}

.note-card {
  width: 45vw;
  height: 30vh;
  background-color: #ffff;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  padding: 14px 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}

/* 右上角删除按钮样式 */
.delete-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
  z-index: 10;
}
.delete-icon:hover {
  color: #f56c6c;
}

.note-top {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 10px;
}
.note-title {
  font-size: 16px;
  font-weight: 800;
  color: #222;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.note-title-info {
	display: flex;
	font-size: 12px;
	align-items: center;
	color: #888;
	gap: 10rpx;
}
.note-time {
  font-size: 12px;
  color: #888;
}
.note-divider {
  height: 1px;
  background-color: #ddd;
  margin-bottom: 10px;
}
.note-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.note-content {
  font-size: 14px;
  color: #444;
  line-height: 1.5;
  overflow: hidden;
  position: relative;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}
.note-bottom-divider {
  height: 1px;
  background-color: #ddd;
  margin-bottom: 10px;
}
.note-footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.note-repo {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
  justify-content: space-between;
}
.repo-know {
  display: flex;
}
.repo-tags {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  align-items: center;
}
.note-tag {
  flex-shrink: 0;
}
</style>
