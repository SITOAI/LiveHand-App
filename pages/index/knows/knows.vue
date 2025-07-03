<template>
  <div class="knows-container">
    <KnowCard v-for="n in 30" :key="n"
	  name="法律知识库"
	  user="lihua"
	  prompt="'西安视途科技有限公司致力于通过本运营方案，明确公司在文化传媒领域的发展方向和战略目标。本方案涵盖《大国典藏》文创项目、《长安梦华录》文创项目、《长安梦华录》动画电影项目，以及旨在培养新兴导演人才的雏鹰计划。《大国典藏》文创项目，旨在记录和传播非物质文化遗产，强化民族文化自信。《长安梦华录》文创项目，将深入挖掘长安的历史文化资源，通过视频形式讲述长安的故事。《长安梦华录》动画电影项目，通过动画电影这一创新载体，吸引年轻观众，拓宽文化影响力。雏鹰计划为年轻导演提供技术、资金支持，以及创作平台，旨在发掘和培养具有潜力的导演人才，共同创作出有深度、有影响力的作品。通过这一计划，公司将促进内部创新，同时为行业输送新鲜血液。'"
	  :count="123"
	  :users="48"
	  time="2025-06-26"
	  >
      知识库卡片 {{ n }}
    </KnowCard>
  </div>
</template>

<script setup>
import KnowCard from '@/components/cards/KnowCard.vue' // 按需调整路径
</script>

<style scoped>
.knows-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4vw;
}
</style>
