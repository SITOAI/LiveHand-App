<script>
export default {
  onLaunch() {
    uni.onTabBarMidButtonTap(() => {
      uni.navigateTo({
        url: "/pages/midTabBar/midTabBar",
        animationType: "slide-in-bottom",
        animationDuration: 150
      });
    });
    
    uni.onAppShow(() => {
      // 避免与onLaunch和login.vue中的登录检查冲突
      const token = uni.getStorageSync('token') || ''
      const pages = getCurrentPages();
      // 只有当用户不在登录页且没有token时才跳转到登录页
      if (!token && pages.length > 0 && !pages[pages.length - 1].route.includes('login')) {
        uni.reLaunch({
          url: '/pages/login/login'
        })
      }
      uni.$emit('closeAllModals');
    });
  }
}
</script>
<style>
	/*每个页面公共css */
</style>
