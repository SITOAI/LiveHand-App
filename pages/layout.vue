<template>
  <view>
    <Login v-if="!isLogin" />
    <IndexLayout class="index-layout" v-else />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../store/user.js'
import Login from './login/login.vue'
import IndexLayout from './index/layout.vue'

const userStore = useUserStore()
const isLogin = computed(() => userStore.isLogin)

console.log("isLogin", isLogin.value)
</script>

<style scoped>
.index-layout {
	background-color: #f5f5f5;
}
</style>