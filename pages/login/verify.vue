<template>
  <view class="verify-page">
    <!-- 顶部返回按钮 -->
    <view class="top-bar">
      <u-icon name="arrow-left" size="32" @click="goBack" />
    </view>

    <!-- 顶部空白占位（原logo位置空出来） -->
    <view class="top-logo-placeholder"></view>

    <!-- 标题 -->
    <view class="title">请输入验证码</view>

    <!-- 提示手机号 -->
    <view class="subtitle">
      验证码已经通过短信发送至 {{ phone }}
    </view>

    <!-- 验证码输入框 -->
    <input
      class="code-input"
      v-model="code"
      maxlength="6"
      type="number"
      placeholder="请输入6位验证码"
      @input="onInput"
    />

    <!-- 重新获取按钮 -->
    <button
      class="resend-btn"
      :disabled="countdown > 0"
      @click="resendCode"
    >
      {{ countdown > 0 ? `${countdown}s后重新获取` : '重新获取验证码' }}
    </button>
  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import CryptoJS from 'crypto-js'
import http from '../../utils/http.js'

const phone = ref('')
const code = ref('')
const countdown = ref(0)
let timer = null

const userStore = useUserStore()

onLoad(options => {
  if (options.phone) {
    phone.value = decodeURIComponent(options.phone)
  }
})

function goBack() {
  uni.navigateBack()
}

function resendCode() {
  uni.showToast({ title: '正在重新获取验证码', icon: 'none' })
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
  // TODO: 这里调用接口重新发送验证码
}

async function onInput() {
  if (code.value.length === 6) {
	const encryptedCode = encryptCaptcha(code.value)
	// var result = await http.post("/user/loginByCaptcha", {
	var result = await http.post("/user/loginByCaptchaForKnowledge", {
		  phonenumber: phone.value,
		  captcha: encryptedCode
	})
	console.log("🚀 ~ onInput ~ result:", result)
	if(result.code === 200 && result.data.isSuccess === 1){
		const token = result.data.token
		userStore.login(token)
		// 存储token到本地
		uni.setStorageSync('token', token)
		// 存储其他用户信息
		const userInfo = { ...result.data }
		delete userInfo.token // 已单独存储token
		uni.setStorageSync('userInfo', userInfo)
		uni.showToast({ title: '登录成功', icon: 'none' })
		uni.reLaunch({ url: '/pages/index/layout' })
	}else{
		uni.showToast({ title: result.data.msg || '验证码错误', icon: 'error' })
	}
  }
}


function encryptCaptcha(code) {
  const key = CryptoJS.enc.Utf8.parse('7e677bfa07e11a8f')
  const iv = CryptoJS.enc.Utf8.parse('30ff0efcb957087f')
  const srcs = CryptoJS.enc.Utf8.parse(code)
  const encrypted = CryptoJS.AES.encrypt(srcs, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.ciphertext.toString().toUpperCase()
}

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.verify-page {
  padding: 100rpx 60rpx;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 100vh;
  box-sizing: border-box;
}

.top-bar {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20rpx;
}

.top-logo-placeholder {
  height: 120rpx; /* 和登录页 logo 高度保持一致 */
  width: 120rpx;
  margin-bottom: 40rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
  line-height: 36rpx;
  word-break: break-word;
}

/* 验证码输入框样式 */
.code-input {
  width: 100%;
  height: 80rpx;
  font-size: 30rpx;
  border: 1px solid #ddd;
  border-radius: 10rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
  outline: none;
  margin-bottom: 30rpx;
  text-align: center;
  letter-spacing: 15px;
}

/* 重新获取按钮 */
.resend-btn {
  width: 100%;
  height: 80rpx;
  font-size: 30rpx;
  border-radius: 10rpx;
  background-color: #007aff;
  color: white;
  border: none;
  cursor: pointer;
  line-height: 80rpx;
  text-align: center;
}

.resend-btn:disabled {
  background-color: #ccc;
  color: #fff;
}
</style>
