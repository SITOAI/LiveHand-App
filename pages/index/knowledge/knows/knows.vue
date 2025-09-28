<template>
  <div class="knows-container">
	<KnowCard
	  v-for="know in knows"
	  :key="know.id"
	  :name="know.name"
	  :user="know.user"
	  :prompt="know.prompt"
	  :count="know.count"
	  :users="know.users"
	  :tags="know.tags"
	>
	</KnowCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import KnowCard from '@/components/cards/KnowCard.vue' // 按需调整路径
const knows = ref([
  {
    id: 1,
    name: '法律知识库',
	user: 'lihua',
    time: '2025-06-26',
    prompt: '西安视途科技有限公司致力于通过本运营方案，明确公司在文化传媒领域的发展方向和战略目标。本方案涵盖《大国典藏》文创项目、《长安梦华录》文创项目、《长安梦华录》动画电影项目，以及旨在培养新兴导演人才的雏鹰计划。《大国典藏》文创项目，旨在记录和传播非物质文化遗产，强化民族文化自信。《长安梦华录》文创项目，将深入挖掘长安的历史文化资源，通过视频形式讲述长安的故事。《长安梦华录》动画电影项目，通过动画电影这一创新载体，吸引年轻观众，拓宽文化影响力。雏鹰计划为年轻导演提供技术、资金支持，以及创作平台，旨在发掘和培养具有潜力的导演人才，共同创作出有深度、有影响力的作品。通过这一计划，公司将促进内部创新，同时为行业输送新鲜血液。',
    count: '123',
	users: '8',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '法律', type: 'success' }
    ]
  },
  {
    id: 2,
    name: '政务知识库',
  	user: 'lihua',
    time: '2025-06-27',
    prompt: '政务知识库汇聚政策法规、办事指南等权威信息，助力高效政务服务与智能决策。',
    count: '234',
  	users: '10',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '政务', type: 'success' }
    ]
  },
  {
    id: 3,
    name: '医疗知识库',
  	user: 'lihua',
    time: '2025-07-01',
    prompt: '医疗知识库是集成医学文献、临床指南、疾病诊疗方案、药品信息等多维度内容的智能平台，旨在为医务人员提供科学、权威、实时的知识支持。通过结构化整理和智能检索，医生可快速获取所需医学信息，提升诊疗效率和决策质量；患者也能通过知识库获取通俗易懂的健康知识，增强健康意识与自我管理能力。医疗知识库是推动医疗信息化、精准医疗和智慧医疗建设的重要基础设施。',
    count: '901',
  	users: '16',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '医疗', type: 'success' }
    ]
  },
  {
    id: 4,
    name: 'AI知识库',
  	user: 'lihua',
    time: '2025-07-02',
    prompt: 'AI知识库是集成人工智能领域前沿研究成果、算法模型、应用案例及技术文档的综合性平台，涵盖机器学习、深度学习、自然语言处理、计算机视觉等多个方向。通过结构化组织与智能检索，帮助开发者、研究人员和企业快速获取所需知识，提升研发效率与创新能力。AI知识库不仅支持技术共享与协同发展，还可结合具体业务场景，提供定制化的智能解决方案，是推动人工智能技术落地和普及的重要支撑工具。',
    count: '762',
  	users: '21',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '技术', type: 'success' }
    ]
  },
  {
    id: 5,
    name: '高考知识库',
  	user: 'lihua',
    time: '2025-06-22',
    prompt: '汇总历年高考信息，获取各大高校录取信息，根据分科排名推荐名校专业。',
    count: '142',
  	users: '7',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '教育', type: 'success' }
    ]
  },
  {
    id: 7,
    name: '新闻知识库',
  	user: 'lihua',
    time: '2025-06-06',
    prompt: '关注国际热点新闻。',
    count: '65',
  	users: '3',
    tags: [
      { text: 'AI', type: 'warning' },
      { text: '新闻', type: 'success' }
    ]
  }
])


</script>

<style scoped>
.knows-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4vw;
}
</style>
