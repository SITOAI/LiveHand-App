<template>
  <view class="login-page">
    <!-- 顶部 Logo -->
    <view class="top-logo-row">
      <image class="logo" src="/static/logo.png" mode="widthFix" />
    </view>

    <!-- 标题 -->
    <view class="title">手机号验证码登录</view>
    <view class="subtitle">未注册手机号验证后即自动注册账号</view>

    <!-- 手机号输入区域 -->
    <view class="phone-input-row">
      <picker mode="selector" :range="areaCodes" @change="onAreaChange">
        <view class="area-code">+{{ selectedAreaCode }}</view>
      </picker>
      <input
        class="phone-input"
        v-model="phone"
        type="number"
        maxlength="11"
        placeholder="请输入手机号"
      />
    </view>

    <!-- 获取验证码按钮 -->
    <button
      class="verify-btn"
      :disabled="countdown > 0"
      @click="getVerifyCode"
    >
      {{ countdown > 0 ? `${countdown}s后重新获取` : '获取短信验证码' }}
    </button>

    <!-- 协议勾选 -->
    <view class="agreement-row">
      <u-checkbox-group v-model="agreeList">
        <u-checkbox :name="'agree'" shape="circle" activeColor="#007AFF" />
      </u-checkbox-group>
      <text class="agreement-text">
        我已阅读并同意
        <text class="link" @click="openAgreement">《用户协议》</text>
        和
        <text class="link" @click="openPrivacy">《隐私政策》</text>
      </text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onUnmounted } from 'vue'
import http from '../../utils/http.js'

const phone = ref('')
const agree = ref(false)
const countdown = ref(0)
const selectedAreaCode = ref('86')
const areaCodes = ['86', '852', '853', '886']
const agreeList = ref([])

let timer = null

function isAgreed() {
  return agreeList.value.includes('agree')
}

function onAreaChange(e) {
  selectedAreaCode.value = areaCodes[e.detail.value]
}

function getVerifyCode() {
  if (!phone.value) {
    return uni.showToast({ title: '请输入手机号', icon: 'none' })
  }
  if (!isAgreed()) {
    return uni.showToast({ title: '请先同意协议', icon: 'none' })
  }

  // 拼接完整手机号带区号
  const fullPhone = `+${selectedAreaCode.value} ${phone.value}`

  // 模拟请求验证码成功，跳转到验证码输入页，并传递手机号
  // uni.showToast({ title: '正在获取验证码', icon: 'none' })
  var result = http.post("/user/getCaptcha", {
	  phonenumber: phone.value
  })
  
  console.log(result)

  // 跳转并传参
  uni.navigateTo({
      url: `/pages/login/verify?phone=${encodeURIComponent(fullPhone)}`
	  })

  // 你也可以在这里开始倒计时，或者放到验证码页处理
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}


function openAgreement() {
  uni.navigateTo({ url: '/pages/agreement/user' })
}
function openPrivacy() {
  uni.navigateTo({ url: '/pages/agreement/privacy' })
}

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.login-page {
  padding: 100rpx 60rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: #ffffff;
}

.top-logo-row {
  width: 100%;
  display: flex;
  justify-content: flex-start;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 20rpx;
}

.title {
  margin-top: 40rpx;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.subtitle {
  font-size: 26rpx;
  color: #999;
  margin-top: 10rpx;
  margin-bottom: 40rpx;
}

/* 统一输入框行高度 */
.phone-input-row {
  height: 80rpx;            /* 固定高度 */
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 10rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  width: 100%;
}

.area-code {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f6f6f6;
  color: #333;
  font-size: 30rpx;
  min-width: 100rpx;
  text-align: center;
  padding: 1rem 20rpx;
}

.phone-input {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  border: none;
  padding: 0 20rpx;
  outline: none;
  line-height: 80rpx;       /* 文字垂直居中 */
}

/* 按钮高度和输入框行高度一致 */
.verify-btn {
  width: 100%;
  height: 80rpx;            /* 和输入框高度一致 */
  font-size: 30rpx;
  border-radius: 10rpx;
  background-color: #007aff;
  color: white;
  text-align: center;
  line-height: 80rpx;       /* 文字垂直居中 */
  margin-bottom: 30rpx;
  border: none;
  cursor: pointer;
}

.verify-btn:disabled {
  background-color: #ccc;
  color: #fff;
}

.agreement-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: #999;
      line-height: 1.6;
}

.agreement-text {
  flex: 1;
  font-size: 24rpx;
  color: #666;
}

.link {
  color: #007aff;
  text-decoration: underline;
}
</style>
