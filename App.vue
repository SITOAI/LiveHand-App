<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		// 监听中间按钮点击事件
		onTabBarMidButtonTap: function() {
			console.log('中间加号按钮被点击')
			// 跳转到创建功能页面，这里假设创建功能页面是通过弹窗或新页面实现的
			// 可以根据实际需求进行调整
			uni.navigateTo({
				url: '/pages/index/knowledge/notes/notes',
				success: () => {
					console.log('成功跳转到创建页面')
				},
				fail: (err) => {
					console.error('跳转到创建页面失败:', err)
				}
			})
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
