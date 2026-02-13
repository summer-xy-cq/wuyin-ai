<script setup>
import { computed } from 'vue'
import { storage } from '../utils/storage.js'
import { ClipboardCheck, CheckCircle, Circle, Award } from 'lucide-vue-next'

const props = defineProps({
  showDetail: { type: Boolean, default: false }
})

// 获取科研数据
const researchData = computed(() => {
  return storage.get('RESEARCH') || null
})

// 是否已加入科研计划
const isEnrolled = computed(() => {
  return researchData.value && researchData.value.status
})

// 当前状态
const status = computed(() => {
  if (!researchData.value) return 'not_enrolled'
  return researchData.value.status
})

// 已完成天数
const completedDays = computed(() => {
  if (!researchData.value?.logs) return 0
  return researchData.value.logs.length
})

// 进度百分比
const progressPercent = computed(() => {
  return Math.min(100, (completedDays.value / 7) * 100)
})

// 检查某天是否已打卡
const isDayChecked = (dayIndex) => {
  if (!researchData.value?.logs) return false
  return researchData.value.logs.some(log => log.day === dayIndex)
}

// 获取今日评价状态
const todayStatus = computed(() => {
  const today = new Date().toDateString()
  const feedbacks = storage.get('FEEDBACK') || []
  const todayFeedback = feedbacks.find(f => {
    const fDate = new Date(f.timestamp).toDateString()
    return fDate === today
  })
  return todayFeedback ? 'completed' : 'pending'
})
</script>

<template>
  <!-- 未加入科研计划 -->
  <div v-if="!isEnrolled" class="bg-indigo-50 rounded-xl p-4 mb-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
        <ClipboardCheck class="w-5 h-5 text-indigo-600" />
      </div>
      <div class="flex-1">
        <h3 class="font-bold text-ink text-sm">科研共建计划</h3>
        <p class="text-xs text-ink-light">参与7天体验研究，获赠VIP会员</p>
      </div>
      <button @click="$router.push('/research')" class="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg">
        了解详情
      </button>
    </div>
  </div>

  <!-- 已加入 - 显示进度 -->
  <div v-else-if="status === 'active'" class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-4 mb-4 text-white">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <Award class="w-5 h-5" />
        <span class="font-bold text-sm">科研计划进行中</span>
      </div>
      <span class="text-xs text-white/80">{{ completedDays }}/7 天</span>
    </div>

    <!-- 7天打卡格子 -->
    <div class="flex gap-1.5 mb-3">
      <div v-for="i in 7" :key="i"
           class="flex-1 h-8 rounded flex items-center justify-center text-xs font-bold transition-all"
           :class="isDayChecked(i) ? 'bg-white text-indigo-600' : 'bg-white/20 text-white/60'">
        <CheckCircle v-if="isDayChecked(i)" class="w-4 h-4" />
        <span v-else>{{ i }}</span>
      </div>
    </div>

    <!-- 今日状态 -->
    <div class="flex items-center justify-between bg-white/10 rounded-lg p-2">
      <span class="text-xs">今日音乐评价</span>
      <span class="text-xs flex items-center gap-1"
            :class="todayStatus === 'completed' ? 'text-green-300' : 'text-yellow-300'">
        <CheckCircle v-if="todayStatus === 'completed'" class="w-3.5 h-3.5" />
        <Circle v-else class="w-3.5 h-3.5" />
        {{ todayStatus === 'completed' ? '已完成' : '待完成' }}
      </span>
    </div>

    <!-- 进度条 -->
    <div class="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
      <div class="h-full bg-white rounded-full transition-all"
           :style="{ width: progressPercent + '%' }"></div>
    </div>
  </div>

  <!-- 已完成 -->
  <div v-else-if="status === 'completed'" class="bg-gradient-to-br from-gold/20 to-orange-100 rounded-xl p-4 mb-4 border border-gold/30">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
        <Award class="w-5 h-5 text-white" />
      </div>
      <div class="flex-1">
        <h3 class="font-bold text-ink text-sm">科研计划已完成</h3>
        <p class="text-xs text-ink-light">恭喜获得VIP会员奖励！</p>
      </div>
      <span class="px-2 py-1 bg-gold/20 text-gold-dark text-xs rounded">✓ 已完成</span>
    </div>
  </div>
</template>