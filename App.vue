<script>
import { useUserStore } from './store/user'
import { createPinia } from 'pinia'

export default {
  onLaunch() {
    // 初始化Pinia以访问store
    const pinia = createPinia()
    const userStore = useUserStore(pinia)
 
    // 监听TabBar中间按钮点击事件
    uni.onTabBarMidButtonTap(() => {
      // 获取当前页面栈
      const pages = getCurrentPages();
      if (pages.length > 0) {
        // 获取当前页面路径
        const currentPath = pages[pages.length - 1].route;
        
        // 根据当前页面路径发送对应的事件
        if (currentPath.includes('explore')) {
          uni.$emit('showExploreModal');
        } else if (currentPath.includes('knowledge')) {
          uni.$emit('showKnowledgeModal');
        } else if (currentPath.includes('agents')) {
          uni.$emit('showAgentsModal');
        } else if (currentPath.includes('mine')) {
          uni.$emit('showMineModal');
        }
      }
    });
    
    // 监听页面显示事件，在页面切换时通知所有页面关闭弹框
    uni.onAppShow(() => {
      // 只在应用从后台返回前台时检查登录状态
      // 避免与onLaunch和login.vue中的登录检查冲突
      const token = uni.getStorageSync('token') || ''
      const pages = getCurrentPages();
      
      // 只有当用户不在登录页且没有token时才跳转到登录页
      // 这样在退出登录后首次打开应用时不会重复跳转
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
