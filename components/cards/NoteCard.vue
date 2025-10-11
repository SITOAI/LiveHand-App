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
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  padding: 32rpx;
  box-sizing: border-box;
  margin-bottom: 4vw;
}

.note-top {
  margin-bottom: 24rpx;
}

.note-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #222222;
  margin-bottom: 12rpx;
  line-height: 1.3;
}

.note-title-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: 24rpx;
  color: #888888;
}

.repo-know {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.folder-icon {
  width: 32rpx;
  height: 32rpx;
  vertical-align: middle;
}

.repo-name {
  font-family: Source Han Sans CN, Source Han Sans CN;
  font-weight: 500;
  font-size: 24rpx;
  color: #2E5CE7;
}

.note-time {
  font-size: 24rpx;
  color: #888888;
}

.note-divider {
  height: 2rpx;
  background-color: #f0f0f0;
  margin-bottom: 24rpx;
}

.note-main {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.note-content {
  font-size: 28rpx;
  color: #444444;
  line-height: 1.6;
  overflow: hidden;
  /* 修改为标准CSS属性确保文本占满整行后再换行 */
  display: block;
  max-height: calc(1.6em * 5); /* 保持最多显示5行 */
  text-align: justify;
  word-wrap: break-word;
  word-break: break-word;
}

.audio-icon-wrapper {
  background-color: #f8f9fc;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.audio-icon {
  display: flex;
  align-items: center;
  gap: 20rpx;
  }

.audio-icon image{
  width: 70rpx;
  height: 70rpx;
  vertical-align: middle;
}

.audio-icon span {
  font-size: 24rpx;
  color: #888888;
  vertical-align: middle;
}

.audio-name {
  font-size: 28rpx;
  color: #333;
  max-width: 400rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-bottom-divider {
  height: 2rpx;
  background-color: #f0f0f0;
  margin-bottom: 4rpx;
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
  gap: 8rpx;
  color: #4d8fff;
}

.repo-tags {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.note-tag {
  font-size: 24rpx;
  padding: 4rpx 4rpx;
}

.iconfont {
  font-size: 32rpx;
}

.icon-yuyin {
  width: 48rpx;
  height: 48rpx;
  background-color: #4d8fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
</style>
