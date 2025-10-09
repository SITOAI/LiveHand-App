<template>
  <div class="note-card">
    <!-- 顶部信息 -->
    <div class="note-top">
      <div class="note-title" @click.stop="openDetails">{{ title }}</div>
      <div class="note-title-info">
        <view class="repo-tags" @click.stop>
          <u-tag
            v-for="(tag, index) in tags"
            :key="index"
            :text="tag.text"
            type="warning"
            plain
            size="mini"
            class="note-tag"
          />
        </view>
      </div>
    </div>
    <!-- 主体内容 + 底部区域 -->
      <!-- 音频上传图标 -->
    <div class="audio-icon-wrapper" v-show="musice" >
      <div class="audio-icon">
        <image  src="../../static/musice.png" class="folder-icon" mode="aspectFit"></image>
        <span class="audio-name">{{ audioName }}</span>
      </div>
    </div>
    <div class="note-main">
      <div class="note-content" @click.stop="openDetails">
        {{ content }}
      </div>

      <div class="note-bottom-divider"></div>

      <div class="note-footer">
        <div class="note-repo">
          <div class="note-time">{{ time }}</div>
          <div class="repo-info" @click.stop>
					  <image  src="../../static/folder@2x.png" class="folder-icon" mode="aspectFit"></image>
            <span class="repo-name">{{ repo }}</span>
          </div>
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
  handmould: { type: String, default: '这里是笔记的手抄区域，超过部分会被省略显示，保持卡片整洁。' },
  summary: { type: String, default: '这里是笔记的总结区域，超过部分会被省略显示，保持卡片整洁。' },
  repo: { type: String, default: '默认知识库' },
  musice: { type: Boolean, default: false },
  audioName: { type: String, default: '音频文件' },
  tags: {
    type: Array,
    default: () => [
      { text: '标签一', type: 'warning' },
      { text: '标签二', type: 'success' },
      { text: '标签三', type: 'primary' }
    ]
  },
  showAudioIcon: { type: Boolean, default: false }
})

const emit = defineEmits(['delete'])

const showDelete = ref(false)

function openDetails() {
  console.log('打开详情页')
  uni.navigateTo({
    url: `/pages/details/NoteDetails/NoteDetails?title=${encodeURIComponent(props.title)}&time=${props.time}&handmould=${encodeURIComponent(props.handmould)}&summary=${encodeURIComponent(props.summary
)}&repo=${encodeURIComponent(props.repo)}&tags=${encodeURIComponent(JSON.stringify(props.tags))}`
  })
}

function handleDeleteConfirm() {
  showDelete.value = false
  emit('delete')
}
</script>

<style scoped>
.note-card {
  width: 100%;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
  box-sizing: border-box;
  margin-bottom: 4vw;
}

.note-top {
  margin-bottom: 12px;
}

.note-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #222222;
  margin-bottom: 6px;
  line-height: 1.3;
}

.note-title-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #888888;
}

.repo-know {
  display: flex;
  align-items: center;
  gap: 4px;
}

.folder-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

.repo-name {
  font-family: Source Han Sans CN, Source Han Sans CN;
  font-weight: 500;
  font-size: 24rpx;
  color: #2E5CE7;
}

.note-time {
  font-size: 12px;
  color: #888888;
}

.note-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin-bottom: 12px;
}

.note-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-content {
  font-size: 14px;
  color: #444444;
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

.audio-icon-wrapper {
  background-color: #f8f9fc;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
}

.audio-icon {
  display: flex;
  align-items: center;
  gap: 10px;
  }

.audio-icon image{
  width: 70rpx;
  height: 70rpx;
  vertical-align: middle;
}

.audio-icon span {
  font-size: 12px;
  color: #888888;
  vertical-align: middle;
}

.audio-name {
  font-size: 14px;
  color: #333;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-bottom-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin-bottom: 2px;
}

.note-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.note-repo {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
}

.repo-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #4d8fff;
}

.repo-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.note-tag {
  font-size: 12px;
  padding: 2px 2px;
}

.iconfont {
  font-size: 16px;
}

.icon-yuyin {
  width: 24px;
  height: 24px;
  background-color: #4d8fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
</style>
