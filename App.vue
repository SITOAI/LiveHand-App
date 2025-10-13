<script>
export default {
  onLaunch() {
    // 全局监听TabBar中间按钮点击事件
    uni.onTabBarMidButtonTap(() => {
      // 不触发全局事件，而是让当前显示的页面自己处理
      // 这样可以避免所有页面的弹框都被触发
    });
  }
}
</script>

<style>
	/*每个页面公共css */
</style>
