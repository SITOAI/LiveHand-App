<template>
  <div class="card">
    <slot>这是智能体的卡片内容</slot>
  </div>
</template>

<script setup>
// 暂时无逻辑，仅展示样式
</script>

<style scoped>
.card {
  width: 35vw;
  height: 40vh;
  background-color: #f5f5f5;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  color: #333;
}
</style>
