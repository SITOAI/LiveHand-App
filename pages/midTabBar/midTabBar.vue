<template>
  <view class="mid-tab-bar-container">
    <!-- 半透明蒙层 -->
    
    <!-- 引入SelectionPanel组件 -->
    <SelectionPanel 
      v-model:show="showPanel"
      title="创建内容"
      @select="handleSelect"
      @update:show="handleClose"
    />
  </view>
</template>

<script>
import SelectionPanel from '../../components/SelectionPanel.vue'

export default {
  components: {
    SelectionPanel
  },
  data() {
    return {
      showPanel: true // 默认显示面板
    }
  },
  methods: {
    // 处理选项选择
    handleSelect(item) {
      console.log('选择了选项:', item)
      // SelectionPanel组件内部已经处理了跳转逻辑
    },
    // 处理关闭
    handleClose(show) {
      this.showPanel = show
      if (!show) {
        // 当面板关闭时，返回上一页
        uni.navigateBack()
      }
    },
    // 点击遮罩层关闭
    handleOverlayClick() {
      this.showPanel = false
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.mid-tab-bar-container {
  position: relative;
  height: 100vh;
  width: 100vw;
}

/* .overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 999;
} */
</style>