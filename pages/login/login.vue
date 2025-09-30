<template>
  <view class="login-page">
    <!-- 顶部 Logo -->
    <view class="top-logo-row">
      <image class="logo" src="/static/logo-group.png" mode="widthFix" />
    </view>

    <!-- 标题 -->
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
      {{ countdown > 0 ? `${countdown}s后重新获取` : '验证码登录' }}
    </button>

    <!-- 协议勾选 -->
    <view class="agreement-row">
      <u-checkbox-group v-model="agreeList">
        <u-checkbox :name="'agree'" shape="circle" activeColor="#007AFF" />
      </u-checkbox-group>
      <text class="agreement-text">
          未注册号码将自动注册，勾选即代表您阅读并同意
          <text class="link" @click="openUser">《用户协议》</text>
          和
          <text class="link" @click="openPrivacy">《隐私政策》</text>
        </text>
    </view>
	
	<!-- 微信登录快捷按钮 -->
	<view class="wechat-login-area">
	  <image class="wechat-login-button" src="/static/weichat-icon.png" mode="widthFix" @click="loginWithWechat" />

	</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
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
  http.post("/user/getCaptcha", {
	  phonenumber: phone.value
  }).then(result=>{
	  if(result.code === 200 && result.data.isSuccess === 1){
	  	  uni.navigateTo({
	  	      url: `/pages/login/verify?phone=${encodeURIComponent(phone.value)}`
	  	  	  })
	  }else{
		  return uni.showToast({ title: '获取验证码失败，请稍后再试！', icon: 'error' })
	  }
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


function openUser() {
  uni.navigateTo({
    url: '/pages/static/User',
    success: () => {
      console.log('跳转成功')
    },
    fail: (err) => {
      console.error('跳转失败', err)
      uni.showToast({ title: '跳转失败', icon: 'none' })
    }
  })
}
function openPrivacy() {
  uni.navigateTo({
    url: '/pages/static/Privacy',
    success: () => {
      console.log('跳转成功')
    },
    fail: (err) => {
      console.error('跳转失败', err)
      uni.showToast({ title: '跳转失败', icon: 'none' })
    }
  })
}

// 微信登录授权方法
function loginWithWechat() {
  // 显示加载提示
  uni.showLoading({
    title: '正在连接微信',
    mask: true
  })
  
  // 调用微信登录接口
  uni.login({
    provider: 'weixin',
    success: (loginRes) => {
      if (loginRes.code) {
        // 获取到微信登录的code，可以用于后端换取openid和session_key
        console.log('微信登录code:', loginRes.code)
        
        // 获取用户信息（需要用户授权）
        uni.getUserProfile({
          desc: '用于完善用户资料',
          success: (userRes) => {
            console.log('用户信息:', userRes)
            
            // 这里可以调用后端API，将微信登录信息发送到服务器进行处理
            // 例如：http.post('/user/loginWithWechat', { code: loginRes.code, userInfo: userRes.userInfo })
            
            // 模拟登录成功
            setTimeout(() => {
              uni.hideLoading()
              uni.showToast({ title: '微信登录授权成功', icon: 'success' })
              
              // 登录成功后跳转到首页
              setTimeout(() => {
                uni.reLaunch({ url: '/pages/index/layout' })
              }, 1500)
            }, 1000)
          },
          fail: (err) => {
            console.error('获取用户信息失败:', err)
            uni.hideLoading()
            uni.showToast({ title: '授权失败，请重试', icon: 'error' })
          }
        })
      }
    },
    fail: (err) => {
      console.error('微信登录失败:', err)
      uni.hideLoading()
      uni.showToast({ title: '登录失败，请检查微信状态', icon: 'error' })
    }
  })
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
  align-items: center;
  background-image: url('../../static/background-login.png');
  background-size: cover;
  background-position: center;
  width: 84%;
}

/* .top-logo-row {
  width: 100%;
  display: flex;
  justify-content:  center;
} */

.logo {
  width: 250px;
  margin-top: 38px;
}

.title {
 margin-top: 40rpx;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  display: flex;
  justify-content: center;
}

.subtitle {
  font-size: 16px;
  color: #999;
  margin-top: 10rpx;
  margin-bottom: 47px;
}

/* 统一输入框行高度 */
.phone-input-row {
  height: 55px;            /* 固定高度 */
  display: flex;
  align-items: center;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 34px;
  width: 100%;
}

.area-code {
  height: 55px;
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
  height: 55px;
  font-size: 30rpx;
  border: none;
  padding: 0 20rpx;
  outline: none;
  line-height: 80rpx;       /* 文字垂直居中 */
  background-color: #F7F7F7;
}

/* 按钮高度和输入框行高度一致 */
.verify-btn {
  width: 100%;
  height: 55px;            /* 和输入框高度一致 */
  font-size: 30rpx;
  border-radius: 10rpx;
  background-color: #007aff;
  color: white;
  text-align: center;
  line-height: 80rpx;       /* 文字垂直居中 */
  margin-bottom: 30rpx;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
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

.wechat-login-button {
	cursor: pointer;
	margin-top: 170px;
	width: 60px;
}
</style>
