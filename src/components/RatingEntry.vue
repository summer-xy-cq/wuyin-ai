<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star, ChevronRight, Music, Clock } from 'lucide-vue-next'
import { storage } from '../utils/storage.js'

const router = useRouter()

// 获取所有反馈数据
const feedbacks = computed(() => {
  return storage.get('FEEDBACK') || []
})

// 获取历史记录中的播放数据
const history = computed(() => {
  return storage.get('HISTORY') || []
})

// 统计已评价和未评价的曲目
const stats = computed(() => {
  const ratedTracks = new Set(feedbacks.value.map(f => f.trackTitle))
  const playedTracks = []

  history.value.forEach(record => {
    if (record.playback?.trackTitle) {
      playedTracks.push({
        title: record.playback.trackTitle,
        constitution: record.constitutionName,
        toneName: record.toneName,
        rated: ratedTracks.has(record.playback.trackTitle),
        rating: feedbacks.value.find(f => f.trackTitle === record.playback.trackTitle)?.rating || 0
      })
    }
  })

  const rated = playedTracks.filter(t => t.rated)
  const unrated = playedTracks.filter(t => !t.rated)

  return { total: playedTracks.length, rated, unrated }
})

// 获取科研状态
const researchData = computed(() => {
  return storage.get('RESEARCH') || null
})

const isResearchActive = computed(() => {
  return researchData.value?.status === 'active'
})

// 今日是否已评价
const todayRating = computed(() => {
  const today = new Date().toDateString()
  return feedbacks.value.some(f => {
    const fDate = new Date(f.timestamp).toDateString()
    return fDate === today
  })
})

const goToRate = () => {
  // 跳转到曲库页面进行评价
  router.push('/music-library')
}
</script>

<template>
  <!-- 评价入口卡片 -->
  <div class="card p-4 mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <Star class="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 class="font-bold text-ink text-sm">曲目评价</h3>
          <p class="text-xs text-ink-light">
            已评价 {{ stats.rated.length }} 首
            <span v-if="isResearchActive" class="ml-2" :class="todayRating ? 'text-jade' : 'text-cinnabar'">
              {{ todayRating ? '✓ 今日已完成' : '○ 今日待评价' }}
            </span>
          </p>
        </div>
      </div>
      <button
        @click="goToRate"
        class="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg font-medium hover:bg-amber-600 transition-colors"
      >
        {{ stats.unrated.length > 0 ? '去评价' : '查看全部' }}
        <ChevronRight class="w-3 h-3" />
      </button>
    </div>

    <!-- 未评价曲目列表（最多显示3首） -->
    <div v-if="stats.unrated.length > 0" class="mt-3 pt-3 border-t border-amber-100">
      <p class="text-xs text-amber-700 mb-2">待评价曲目：</p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="track in stats.unrated.slice(0, 3)"
          :key="track.title"
          class="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs text-ink"
        >
          <Music class="w-3 h-3 text-amber-500" />
          {{ track.title }}
        </span>
        <span v-if="stats.unrated.length > 3" class="text-xs text-amber-600">
          +{{ stats.unrated.length - 3 }} 首
        </span>
      </div>
    </div>

    <!-- 已全部评价 -->
    <div v-else-if="stats.total > 0" class="mt-3 pt-3 border-t border-amber-100">
      <div class="flex items-center gap-2 text-xs text-jade">
        <span class="w-2 h-2 bg-jade rounded-full"></span>
        所有曲目已评价，感谢您的参与！
      </div>
    </div>
  </div>
</template>