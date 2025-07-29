<template>
  <div class="notes-container">
    <NoteCard
      v-for="note in notes"
      :key="note.id"
      :title="note.title"
      :time="note.time"
      :description="note.description"
      :repo="note.repo"
      :tags="note.tags"
	  :summary="note.summary"
	  :content="note.content"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import NoteCard from '@/components/cards/NoteCard.vue'
import http from '../../../utils/http.js'

const notes = ref([])
const userStore = useUserStore()
console.log('userStore', userStore)
const fetchNotes = async () => {
  try {
    var res = await http.post("/livehands/note/list", {
    	  liveKnowledge_user_id: userStore.knowledge_user_id
    })

    const result = res.data

    // 如果是数组返回：遍历处理
    const rawList = Array.isArray(result) ? result : [result]

    notes.value = rawList.map(item => {
      const info = item.info || {}
      const content = item.content || {}

    return {
        id: info.note_id,
        title: info.note_title,
        time: info.note_created_datetime?.split(' ')[0] || '',
        description: info.note_description || '',
        repo: "默认库",
        tags: Array.isArray(info.note_tags)
          ? info.note_tags.map(tag => ({
              text: tag,
              type: 'primary'
            }))
          : [],
		summary: content.note_summary,
		content: content.note_content
      }
    })
	console.log('✅ 最终 notes 列表:', notes.value)
  } catch (error) {
    console.error('获取笔记失败:', error)
  }
}

onLoad(() => {
  fetchNotes()
})


</script>

<style scoped>
.notes-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4vw;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.delete-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
}
</style>
