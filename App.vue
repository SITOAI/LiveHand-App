<script>
export default {
  onLaunch() {
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
      uni.$emit('closeAllModals');
    });
  }
}
</script>
<style>
	/*每个页面公共css */
</style>
