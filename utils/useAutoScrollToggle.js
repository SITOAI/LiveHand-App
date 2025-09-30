// useAutoScrollToggle.js
import { ref, nextTick } from 'vue'

export function useAutoScrollToggle(contentSelector, containerSelector) {
  const scrollEnabled = ref(false)

  function checkScrollable() {
    nextTick(() => {
      const query = uni.createSelectorQuery().in(uni)
      query.select(contentSelector).boundingClientRect()
      query.select(containerSelector).boundingClientRect()
      query.exec(res => {
        const contentHeight = res[0]?.height || 0
        const containerHeight = res[1]?.height || 0
        scrollEnabled.value = contentHeight > containerHeight
      })
    })
  }

  return {
    scrollEnabled,
    checkScrollable,
  }
}
