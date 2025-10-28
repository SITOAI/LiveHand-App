<script>
export default {
  onLaunch() {
    // 一次性检查登录状态，决定初始页面，避免多次跳转造成闪烁
    const token = uni.getStorageSync('token') || '';
    
    // 立即决定最终页面，避免中间页面的显示
    if (!token) {
      // 未登录状态：直接跳转到登录页
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/login/login'
        });
      }, 0);
    } else {
      // 已登录状态：直接跳转到首页（探索页面）
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/index/explore/layout'
        });
      }, 0);
    }
    
    uni.onTabBarMidButtonTap(() => {
      const token = uni.getStorageSync('token') || '';
      if (!token) {
        uni.reLaunch({
          url: '/pages/login/login'
        });
        return;
      }
      
      uni.navigateTo({
        url: "/pages/midTabBar/midTabBar",
        animationType: "slide-in-bottom",
        animationDuration: 150
      });
    });
    
    uni.onAppShow(() => {
      setTimeout(()=>{ 
        plus.navigator.closeSplashscreen() 
      }, 2000)
      
      // 这里只做必要的检查，避免重复跳转
      const token = uni.getStorageSync('token') || '';
      const pages = getCurrentPages();
      
      // 只在应用被切换回来时进行检查，避免与onLaunch的跳转冲突
      if (pages.length > 0) {
        const currentRoute = pages[pages.length - 1].route;
        const whiteList = ['pages/login/login', 'pages/login/verify'];
        
        // 只有在特定情况下才进行跳转，避免不必要的页面刷新
        if (!token && !whiteList.includes(currentRoute) && !currentRoute.includes('index/explore')) {
          uni.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
      
      uni.$emit('closeAllModals');
    });
    
    // 简化导航守卫，只在必要时进行拦截
    uni.addInterceptor('navigateTo', {
      invoke(e) {
        const token = uni.getStorageSync('token') || '';
        // 不直接reLaunch，而是通过事件机制处理，避免重复跳转
        if (!token && !e.url.includes('login')) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
            duration: 2000,
            success: () => {
              setTimeout(() => {
                uni.reLaunch({
                  url: '/pages/login/login'
                });
              }, 2000);
            }
          });
          return false;
        }
        return true;
      }
    });
  }
}
</script>
<style>
	/*每个页面公共css */
</style>
