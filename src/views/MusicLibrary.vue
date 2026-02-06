<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Play, Pause, Music } from 'lucide-vue-next'
import { CONSTITUTIONS, FIVE_TONES } from '../data/constitutions.js'

const router = useRouter()

// 当前播放
const currentTrack = ref(null)
const isPlaying = ref(false)
const audioPlayer = ref(null)

// 按五音分类音乐
const musicByTone = computed(() => {
  const result = {}
  
  Object.values(FIVE_TONES).forEach(tone => {
    result[tone.name] = {
      ...tone,
      tracks: []
    }
  })
  
  // 收集所有曲目并去重
  const trackSet = new Set()
  Object.values(CONSTITUTIONS).forEach(c => {
    c.tracks.forEach(track => {
      const key = track.title
      if (!trackSet.has(key)) {
        trackSet.add(key)
        const toneName = FIVE_TONES[c.tone]?.name || '宫'
        if (result[toneName]) {
          result[toneName].tracks.push({
            ...track,
            constitution: c.name,
            toneKey: c.tone
          })
        }
      }
    })
  })
  
  return Object.values(result).filter(t => t.tracks.length > 0)
})

// 播放控制
const playTrack = (track) => {
  if (currentTrack.value?.title === track.title && isPlaying.value) {
    audioPlayer.value?.pause()
    isPlaying.value = false
  } else {
    currentTrack.value = track
    setTimeout(() => {
      audioPlayer.value?.play().catch(e => console.error('Playback failed', e))
      isPlaying.value = true
    }, 100)
  }
}

const onAudioEnded = () => {
  isPlaying.value = false
}
</script>

<template>
  <div class="min-h-screen bg-paper pb-24">
    <!-- 头部导航 -->
    <header class="sticky top-0 z-50 bg-paper/80 backdrop-blur-lg border-b border-ink/5">
      <div class="max-w-lg mx-auto px-6 py-4 flex items-center gap-4">
        <button @click="router.back()" class="p-2 rounded-full hover:bg-ink/5 transition-colors">
          <ArrowLeft class="w-5 h-5 text-ink" />
        </button>
        <h1 class="font-serif font-bold text-lg text-ink">五音曲库</h1>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-6 py-6 space-y-8">
      <!-- 按五音分类 -->
      <section 
        v-for="(toneGroup, index) in musicByTone" 
        :key="toneGroup.name"
        class="animate-fade-in-up"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <!-- 五音标题 -->
        <div class="flex items-center gap-3 mb-4">
          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-serif font-bold shadow-lg"
            :style="{ background: `linear-gradient(135deg, ${toneGroup.color}, ${toneGroup.color}dd)` }"
          >
            {{ toneGroup.name }}
          </div>
          <div>
            <h2 class="font-serif font-bold text-ink">{{ toneGroup.name }}调音乐</h2>
            <p class="text-xs text-ink-light">{{ toneGroup.element }}行 · {{ toneGroup.organ }}脏 · {{ toneGroup.feature }}</p>
          </div>
        </div>

        <!-- 曲目列表 -->
        <div class="space-y-2">
          <button
            v-for="track in toneGroup.tracks"
            :key="track.title"
            @click="playTrack(track)"
            class="w-full card p-4 flex items-center gap-4 text-left transition-all"
            :class="currentTrack?.title === track.title && isPlaying ? 'ring-2 ring-cinnabar bg-cinnabar/5' : 'hover:bg-white'"
          >
            <div 
              class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-all"
              :class="currentTrack?.title === track.title && isPlaying 
                ? 'bg-cinnabar text-white animate-pulse-glow' 
                : 'bg-ink/5 text-ink'"
            >
              <Pause v-if="currentTrack?.title === track.title && isPlaying" class="w-5 h-5" />
              <Play v-else class="w-5 h-5 ml-0.5" />
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="font-medium text-ink truncate">{{ track.title }}</div>
              <div class="text-xs text-ink-light">适合：{{ track.constitution }}</div>
            </div>
            
            <Music class="w-4 h-4 text-ink-light flex-shrink-0" />
          </button>
        </div>
      </section>
    </main>

    <!-- 底部播放条 -->
    <div 
      v-if="currentTrack"
      class="fixed bottom-0 left-0 right-0 bg-ink text-paper p-4 shadow-2xl animate-fade-in-up"
    >
      <div class="max-w-lg mx-auto flex items-center gap-4">
        <button 
          @click="playTrack(currentTrack)"
          class="w-12 h-12 rounded-full bg-paper text-ink flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Pause v-if="isPlaying" class="w-5 h-5" />
          <Play v-else class="w-5 h-5 ml-0.5" />
        </button>
        
        <div class="flex-1 min-w-0">
          <div class="font-bold truncate">{{ currentTrack.title }}</div>
          <div class="text-xs opacity-60">传统古曲 · 疗愈</div>
        </div>
      </div>
    </div>

    <!-- 隐藏的音频元素 -->
    <audio 
      ref="audioPlayer" 
      :src="currentTrack?.src"
      @ended="onAudioEnded"
      preload="auto"
    ></audio>
  </div>
</template>
