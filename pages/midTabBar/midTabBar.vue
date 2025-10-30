<template>
  <view class="mid-tab-bar-container">
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

<style>
page {
  background: transparent;
    }
.mid-tab-bar-container {
  position: relative;
  height: 100vh;
  width: 100vw;
}
</style>