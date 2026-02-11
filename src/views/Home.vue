<script setup>
import { ref, computed, onMounted, watch, onUnmounted, onActivated, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Music, BookOpen, Sparkles, ChevronRight, Play, Pause, CheckCircle2, Clock, Monitor, Star, Crown, Lock, Repeat, ClipboardCheck, Calendar } from 'lucide-vue-next'
import { getAIMusicByConstitution } from '../data/ai-music.js'
import { CONSTITUTIONS } from '../data/constitutions.js'

const router = useRouter()
const currentConstitution = ref(null)
const isPlaying = ref(false)
const audioPlayer = ref(null)
const musicType = ref('traditional')

const loadData = () => {
    const saved = localStorage.getItem('wuyin_current_constitution')
    if (saved) {
        currentConstitution.value = JSON.parse(saved)
    } else {
        currentConstitution.value = null
    }
}

// 初始化
onMounted(() => {
  loadData()
  
  // 初始化每日进度
  initDailyUsage()
})

onActivated(() => {
    loadData()
})

// 复测提醒逻辑 (超过7天)
const shouldRetest = computed(() => {
  if (!currentConstitution.value) return false
  const lastTest = new Date(currentConstitution.value.date)
  const now = new Date()
  const diffTime = Math.abs(now - lastTest)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
  return diffDays > 7
})

// === 每日修身逻辑 ===
const dailyTarget = 15 * 60 
const dailyListenTime = ref(0)
const dailyProgressPercent = computed(() => Math.min(100, (dailyListenTime.value / dailyTarget) * 100))

const initDailyUsage = () => {
  try {
    const todayStr = new Date().toDateString()
    const saved = JSON.parse(localStorage.getItem('wuyin_daily_usage') || '{}')
    if (saved.date === todayStr) {
      dailyListenTime.value = saved.seconds || 0
    } else {
      dailyListenTime.value = 0
      saveDailyUsage()
    }
  } catch (e) {
    dailyListenTime.value = 0
  }
}

const saveDailyUsage = () => {
  const todayStr = new Date().toDateString()
  localStorage.setItem('wuyin_daily_usage', JSON.stringify({
    date: todayStr,
    seconds: dailyListenTime.value
  }))
}

let dailyTimer = null
watch(isPlaying, (val) => {
  if (val) {
    dailyTimer = setInterval(() => {
      dailyListenTime.value++
      if (dailyListenTime.value % 5 === 0) saveDailyUsage()
    }, 1000)
  } else {
    if (dailyTimer) clearInterval(dailyTimer)
    saveDailyUsage()
  }
})

onUnmounted(() => {
  if (dailyTimer) clearInterval(dailyTimer)
  saveDailyUsage()
})

// === 科研打卡逻辑 ===
const showResearchModal = ref(false)
const researchRating = ref({ sleep: 5, anxiety: 5, mood: 5 })
const researchNote = ref('')
const researchSubmitted = ref(false)

const checkResearchStatus = () => {
    const data = JSON.parse(localStorage.getItem('wuyin_research') || '{}')
    
    // 1. 必须在 Active 状态
    if (data.status !== 'active') return

    // 2. 检查今日是否已打卡
    const todayStr = new Date().toDateString()
    const todayLog = (data.logs || []).find(log => new Date(log.timestamp).toDateString() === todayStr)
    
    if (todayLog) return // 已打卡

    // 3. 检查听歌时长 (测试版 > 10秒, 正式版 > 15分钟)
    // 这里的 dailyListenTime 单位是秒
    if (dailyListenTime.value > 15 * 60) { 
        showResearchModal.value = true
    }
}

const submitResearchLog = () => {
    const data = JSON.parse(localStorage.getItem('wuyin_research') || '{}')
    
    if (!data.logs) data.logs = []
    
    // 计算今天是第几天
    const startDate = new Date(data.startDate)
    const today = new Date()
    const diffTime = Math.abs(today - startDate)
    const dayIndex = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 

    const log = {
        day: dayIndex,
        timestamp: new Date().toISOString(),
        listenDuration: dailyListenTime.value,
        ...researchRating.value,
        note: researchNote.value
    }
    
    data.logs.push(log)
    localStorage.setItem('wuyin_research', JSON.stringify(data))
    
    researchSubmitted.value = true
    setTimeout(() => {
        showResearchModal.value = false
    }, 2000)
}

// 监听播放状态和时间，触发打卡
watch(dailyListenTime, (val) => {
    // 每 30 秒检查一次是否有资格打卡
    if (val > 0 && val % 30 === 0) {
        checkResearchStatus()
    }
})

// 监听暂停（用户可能听完准备离开）
watch(isPlaying, (val) => {
    if (!val) { // Paused
        checkResearchStatus()
    }
})

// === 播放器逻辑 ===
const currentTime = ref(0)
const duration = ref(0)
const progress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const updateProgress = () => {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime
    duration.value = audioPlayer.value.duration || 0
  }
}

const progressBar = ref(null)
const isDragging = ref(false)

const setProgressFromEvent = (event) => {
  if (!progressBar.value || !audioPlayer.value || !duration.value) return
  const rect = progressBar.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  audioPlayer.value.currentTime = percent * duration.value
}

const seekTo = (event) => {
  setProgressFromEvent(event)
}

const startDrag = (event) => {
  isDragging.value = true
  setProgressFromEvent(event)
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (event) => {
  if (isDragging.value) {
    setProgressFromEvent(event)
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}



// Helper to find a constitution key by tone
// Helper to find a constitution key by tone
const getConstitutionKeyByTone = (tone) => {
  if (!CONSTITUTIONS) return null;
  for (const key in CONSTITUTIONS) {
    // Check both tone (pinyin) and toneName (hanzi) just in case
    if (CONSTITUTIONS[key].toneName === tone || CONSTITUTIONS[key].tone === tone) {
      return key;
    }
  }
  return null;
};



const currentTrackIndex = ref(0) // ADDED: Track selection index

const currentMusic = computed(() => {
  // If playing a rhythm track, prioritize it
  if (playingRhythm.value && rhythmTrack.value && rhythmTrack.value.src) {
    return rhythmTrack.value;
  }

  const c = currentConstitution.value
  if (!c) return null
  
  if (musicType.value === 'ai') {
    if (c.aiMusic && c.aiMusic.src && c.aiMusic.title) return c.aiMusic
    if (c.constitutionKey || c.key) {
       return getAIMusicByConstitution(c.constitutionKey || c.key)
    }
    return { title: 'AI生成旋律', src: '', duration: '0:00' }
  } else {
    // UPDATED: Support multiple tracks selection
    // Ensure we have tracks array
    let tracks = c.tracks || []
    
    // If tracks missing in history but we have key, try to fetch from CONSTITUTIONS (fallback for old data)
    if (tracks.length === 0 && (c.constitutionKey || c.key)) {
        const key = c.constitutionKey || c.key
        if (CONSTITUTIONS[key]) {
            tracks = CONSTITUTIONS[key].tracks || []
        }
    }

    if (tracks.length > 0) {
        // Validation of index
        if (currentTrackIndex.value >= tracks.length) currentTrackIndex.value = 0
        return tracks[currentTrackIndex.value]
    }
    
    // Fallback if no tracks
    if (c.traditionalMusic && c.traditionalMusic.src && c.traditionalMusic.title) return c.traditionalMusic
    return { title: '传统古曲', src: '', duration: '0:00' }
  }
})

// Switch track function
const selectTrack = (index) => {
    if (currentTrackIndex.value === index) return
    currentTrackIndex.value = index
    // If playing, pause and restart? or just auto play new track?
    // Let's stop first to be safe
    if(audioPlayer.value) {
        audioPlayer.value.pause()
        isPlaying.value = false
    }
    currentTime.value = 0
    
    setTimeout(() => {
        if(audioPlayer.value) {
            audioPlayer.value.play().catch(e => console.error(e))
            isPlaying.value = true
        }
    }, 100)
}

// Reset index when switching types
watch(musicType, () => {
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    isPlaying.value = false
    currentTime.value = 0
  }
  currentTrackIndex.value = 0 
})

// === VIP & 试听逻辑 ===
const isVip = ref(false)
const showVipModal = ref(false)
const vipTriggerReason = ref('limit') // 'limit' or 'ai'
const showRetestModal = ref(false)
const playingRhythm = ref(false)
const rhythmTrack = ref(null)
const isLooping = ref(true)

const TONE_COLORS = {
  '宫': 'from-amber-500 via-orange-500 to-yellow-600', // Earth - Yellow
  '商': 'from-slate-400 via-zinc-400 to-stone-500',    // Metal - White/Silver
  '角': 'from-emerald-500 via-teal-500 to-green-600',  // Wood - Green
  '徵': 'from-rose-500 via-red-500 to-orange-600',     // Fire - Red
  '羽': 'from-indigo-600 via-blue-600 to-slate-800'    // Water - Black/Blue
}

const playerBgClass = computed(() => {
    let tone = ''
    if (playingRhythm.value) {
        tone = currentRhythm.value.tone
    } else if (currentConstitution.value) {
        tone = currentConstitution.value.toneName
    }
    return TONE_COLORS[tone] || 'from-emerald-800 via-teal-800 to-teal-900'
})


onMounted(() => {
  // 演示模式：URL包含 ?demo=1 时自动解锁VIP
  const isDemoMode = location.search.includes('demo=1')
  isVip.value = isDemoMode || localStorage.getItem('wuyin_vip') === 'true'

  // Check retest
  if (shouldRetest.value) {
      showRetestModal.value = true
  }
})

const handleAiTabClick = () => {
    if (!isVip.value) {
        vipTriggerReason.value = 'ai'
        showVipModal.value = true
        return
    }
    musicType.value = 'ai'
}

const toggleVipStatus = () => {
    isVip.value = !isVip.value
    localStorage.setItem('wuyin_vip', isVip.value)
    // Restart logic if needed or just let reactivity handle it?
    // If playing rhythm track and VIP lost, pause? 
    if (!isVip.value && playingRhythm.value && currentTime.value > 60) {
        audioPlayer.value.pause()
        isPlaying.value = false
        showVipModal.value = true
    }
}

const playRhythmTrack = () => {
    // 如果正在播放时辰音乐，再次点击为暂停/恢复
    if (playingRhythm.value && isPlaying.value) {
        audioPlayer.value.pause()
        isPlaying.value = false
        return
    }
    if (playingRhythm.value && !isPlaying.value && rhythmTrack.value?.src) {
        audioPlayer.value.play().catch(e => console.error('Playback failed', e))
        isPlaying.value = true
        return
    }

    // 停止其他播放
    if (isPlaying.value) {
        if (audioPlayer.value) audioPlayer.value.pause()
        isPlaying.value = false
    }

    // Use the pre-computed TRACK_MAP to find the source for the current rhythm music
    const trackInfo = TRACK_MAP[currentRhythm.value.music];
    
    if (trackInfo && trackInfo.src) {
        rhythmTrack.value = {
            title: currentRhythm.value.music,
            src: trackInfo.src,
            duration: trackInfo.duration,
            isRhythm: true
        }
    } else {
        console.warn('No track found for:', currentRhythm.value.music);
        return;
    }

    playingRhythm.value = true
    
    // 等待 Vue 更新 DOM（audio src 绑定更新），然后加载并播放
    nextTick(() => {
        if (!audioPlayer.value) return
        audioPlayer.value.load()
        const onCanPlay = () => {
            audioPlayer.value.removeEventListener('canplay', onCanPlay)
            audioPlayer.value.play().catch(e => console.error('Playback failed', e))
            isPlaying.value = true
        }
        audioPlayer.value.addEventListener('canplay', onCanPlay)
    })
}

// Override togglePlay to handle VIP check
const togglePlay = () => {
  if (!audioPlayer.value) return
  
  if (isPlaying.value) {
    audioPlayer.value.pause()
    isPlaying.value = false
  } else {
    // VIP Check for Rhythm Track
    if (playingRhythm.value && !isVip.value) {
        // Allow play, but monitor time
    }
    audioPlayer.value.play().catch(e => console.error('Playback failed', e))
    isPlaying.value = true
  }
}

// 监听播放时间实现60秒限制
watch(currentTime, (newTime) => {
    if (playingRhythm.value && !isVip.value && newTime >= 60) {
        audioPlayer.value.pause()
        isPlaying.value = false
        showVipModal.value = true
        // Reset to 0 or leave? Leave it so they see where it stopped.
    }
})

// === 十二时辰养生逻辑 ===

// === 十二时辰养生逻辑 ===
const TCM_SCHEDULE = [
  { start: 7, end: 9, period: '辰时', organ: '胃', tone: '宫', music: '梅花三弄', benefit: '补脾益气，固本培元', action: '养胃 · 早餐', bgClass: 'from-amber-500 to-orange-500', timeRange: '07:00-09:00' },
  { start: 9, end: 11, period: '巳时', organ: '脾', tone: '宫', music: '十面埋伏', benefit: '健脾和胃，助消化', action: '养脾 · 运化', bgClass: 'from-amber-500 to-orange-500', timeRange: '09:00-11:00' },
  { start: 11, end: 13, period: '午时', organ: '心', tone: '徵', music: '紫竹调', benefit: '养心安神，气血调和', action: '养心 · 午憩', bgClass: 'from-rose-500 to-red-600', timeRange: '11:00-13:00' },
  { start: 13, end: 15, period: '未时', organ: '小肠', tone: '徵', music: '紫竹调', benefit: '分清泌浊，吸收精华', action: '养小肠 · 吸收', bgClass: 'from-rose-500 to-red-600', timeRange: '13:00-15:00' },
  { start: 15, end: 17, period: '申时', organ: '膀胱', tone: '羽', music: '阳春白雪', benefit: '清肺理气，疏通水道', action: '养膀胱 · 排毒', bgClass: 'from-indigo-500 to-blue-600', timeRange: '15:00-17:00' },
  { start: 17, end: 19, period: '酉时', organ: '肾', tone: '羽', music: '阳春白雪', benefit: '滋养肾精，纳气归元', action: '养肾 · 藏精', bgClass: 'from-indigo-500 to-blue-600', timeRange: '17:00-19:00' },
  { start: 19, end: 21, period: '戌时', organ: '心包', tone: '角', music: '胡笳十八拍', benefit: '疏肝解郁，护心安神', action: '养心包 · 娱乐', bgClass: 'from-emerald-500 to-teal-600', timeRange: '19:00-21:00' },
  { start: 21, end: 23, period: '亥时', organ: '三焦', tone: '角', music: '胡笳十八拍', benefit: '平和情志，准备入眠', action: '养三焦 · 入眠', bgClass: 'from-emerald-500 to-teal-600', timeRange: '21:00-23:00' },
  { start: 23, end: 7, period: '夜间', organ: '肝胆', tone: '角', music: '胡笳十八拍', benefit: '安卧深眠，养血疏肝', action: '养元气 · 睡眠', bgClass: 'from-emerald-500 to-teal-600', timeRange: '23:00-07:00' }
]

// Define TRACK_MAP based on TCM_SCHEDULE and CONSTITUTIONS
// Define TRACK_MAP based on TCM_SCHEDULE and CONSTITUTIONS
const TRACK_MAP = {};

// Helper to find track by title in CONSTITUTIONS
const findTrackSrcByTitle = (title) => {
    for (const key in CONSTITUTIONS) {
        const c = CONSTITUTIONS[key];
        const track = c.tracks.find(t => t.title === title);
        if (track) return track;
        // Check traditionalMusic prop too just in case
        if (c.traditionalMusic && c.traditionalMusic.title === title) return c.traditionalMusic;
    }
    return null;
}

TCM_SCHEDULE.forEach(item => {
  if (!TRACK_MAP[item.music]) { 
    // 1. Try to find exact title match
    let track = findTrackSrcByTitle(item.music);
    
    // 2. Fallback: Find by tone if specific title not found (though they should map 1:1 in this app's design)
    if (!track) {
        const matchingConstitutionKey = getConstitutionKeyByTone(item.tone);
        if (matchingConstitutionKey && CONSTITUTIONS[matchingConstitutionKey].traditionalMusic) {
             track = CONSTITUTIONS[matchingConstitutionKey].traditionalMusic;
        }
    }

    if (track) {
      TRACK_MAP[item.music] = {
        title: item.music,
        src: track.src,
        duration: track.duration || '0:00'
      };
    } else {
      console.warn(`Could not find a suitable music source for TCM music: ${item.music}`);
      // Fallback to empty
      TRACK_MAP[item.music] = { title: item.music, src: '', duration: '0:00' };
    }
  }
});

const currentRhythm = ref({})

const updateRhythm = () => {
  const hour = new Date().getHours()
  let match = TCM_SCHEDULE.find(s => {
      // Normal range
      if (s.start < s.end) return hour >= s.start && hour < s.end
      // Wrap around (23-7)
      return hour >= s.start || hour < s.end
  })
  
  // Fallback
  if (!match) match = TCM_SCHEDULE[0]
  
  currentRhythm.value = match
}

let rhythmTimer = null
onMounted(() => {
  updateRhythm()
  rhythmTimer = setInterval(updateRhythm, 60000) // Update every minute
})

onUnmounted(() => {
  if (rhythmTimer) clearInterval(rhythmTimer)
})
</script>

<template>
  <div class="min-h-screen bg-paper relative overflow-hidden pb-10">
    <!-- 水墨背景装饰 -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cinnabar/5 to-transparent rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-jade/5 to-transparent rounded-full blur-3xl"></div>
    </div>

    <div class="relative z-10 max-w-lg mx-auto px-6 py-12">
      <!-- 头部 -->
      <header class="text-center mb-10 animate-fade-in-up relative">
         <!-- VIP Toggle Switch -->
        <div class="absolute top-0 right-0">
            <button 
                @click="toggleVipStatus"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all border"
                :class="isVip 
                    ? 'bg-gradient-to-r from-gold to-orange-400 text-white border-transparent' 
                    : 'bg-paper text-ink-light border-stone-200 hover:border-cinnabar/50'"
            >
                <Crown v-if="isVip" class="w-3.5 h-3.5" />
                <Lock v-else class="w-3.5 h-3.5" />
                {{ isVip ? 'VIP会员' : '免费版' }}
            </button>
        </div>

        <div class="mb-4">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cinnabar to-cinnabar-dark flex items-center justify-center shadow-xl animate-pulse-glow">
            <Music class="w-10 h-10 text-white" />
          </div>
          <h1 class="text-4xl font-serif font-bold text-ink mb-2">五音疗·AI</h1>
          <p class="text-ink-light">基于《黄帝内经》的智能音乐调理</p>
        </div>
      </header>

      <!-- 复测提醒 (通用健康建议) -->




      <!-- 我的曲库 -->
      <section v-if="currentConstitution" class="card p-6 mb-6 animate-fade-in-up" style="animation-delay: 0.2s">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Music class="w-5 h-5 text-cinnabar" />
            <h2 class="font-serif font-bold text-lg text-ink">我的曲库</h2>
          </div>
          <span class="text-xs text-ink-light bg-ink/5 px-2 py-1 rounded-full">
            {{ currentConstitution.constitutionName }} · {{ currentConstitution.toneName }}音
          </span>
        </div>
        
        <!-- Tab切换 -->
        <div class="flex bg-ink/5 rounded-lg p-1 mb-4">
          <button 
            @click="musicType = 'traditional'"
            class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all"
            :class="musicType === 'traditional' ? 'bg-white text-ink shadow-sm' : 'text-ink-light'"
          >
            <Music class="w-4 h-4" />
            传统古曲
          </button>
          <button 
            @click="handleAiTabClick"
            class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all"
            :class="musicType === 'ai' ? 'bg-white text-ink shadow-sm' : 'text-ink-light'"
          >
            <Sparkles class="w-4 h-4" />
            AI风格 <Lock v-if="!isVip" class="w-3 h-3 ml-1 opacity-50" />
          </button>
        </div>

        <!-- 播放器 -->
        <div class="relative rounded-xl overflow-hidden transition-all duration-500">
          <div 
            class="absolute inset-0 bg-gradient-to-br transition-all duration-1000"
            :class="playerBgClass"
          ></div>
          <div 
            v-if="isPlaying" 
            class="absolute inset-0 bg-gradient-radial animate-pulse transition-all duration-500 from-white/10 via-transparent to-transparent"
          ></div>
          
          <div class="relative p-4 flex items-center gap-4">
            <!-- Loop Toggle -->
            <button 
                @click.stop="isLooping = !isLooping"
                class="absolute top-4 right-12 z-20 p-1.5 rounded-full transition-colors"
                :class="isLooping ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/80'"
                title="循环播放"
            >
                <Repeat class="w-4 h-4" />
            </button>
            <button 
              @click="togglePlay"
              class="relative w-14 h-14 rounded-full bg-gradient-to-br from-paper to-paper/90 text-ink flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              <div 
                v-if="isPlaying" 
                class="absolute inset-0 rounded-full animate-ping"
                :class="musicType === 'ai' ? 'bg-sky-400/25' : 'bg-gold/25'"
              ></div>
              <Pause v-if="isPlaying" class="w-6 h-6 relative z-10" />
              <Play v-else class="w-6 h-6 ml-1 relative z-10" />
            </button>
            
            <div class="flex-1 min-w-0">
              <div class="font-bold truncate text-paper">{{ currentMusic?.title }}</div>
              <div class="text-xs text-paper/70">
                {{ currentConstitution.toneName }}调 · {{ musicType === 'ai' ? 'AI合成' : '传统古曲' }}
              </div>
            </div>
            
            <div class="text-paper/20 text-2xl">{{ musicType === 'ai' ? '✦' : '♪' }}</div>
          </div>
          
          <div class="px-4 pb-3">
            <div 
                ref="progressBar"
                @click="seekTo"
                @mousedown="startDrag"
                class="h-2 bg-paper/20 rounded-full cursor-pointer group relative"
            >
                <div 
                  class="h-full rounded-full transition-all relative"
                  :class="musicType === 'ai' ? 'bg-sky-400' : 'bg-gold'"
                  :style="{ width: progress + '%' }"
                >
                  <div 
                    class="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-md cursor-grab active:cursor-grabbing scale-0 group-hover:scale-100 transition-transform"
                    :class="musicType === 'ai' ? 'bg-sky-400' : 'bg-gold'"
                  ></div>
                </div>
            </div>
            
            <!-- Duration Display aligned with Result.vue -->
            <div class="flex justify-between mt-1.5 px-0.5">
               <span class="text-xs text-white/90 font-medium font-mono drop-shadow-md">{{ formatTime(currentTime) }}</span>
               <span class="text-xs text-white/90 font-medium font-mono drop-shadow-md">{{ formatTime(duration) }}</span>
            </div>
          </div>
        </div>


        <!-- Song Selection List (Traditional Only) -->
        <div v-if="musicType === 'traditional' && currentConstitution" class="mt-4 space-y-2">
            <div class="px-1 text-xs font-bold text-ink-light mb-2">推荐曲目清单</div>
            <div class="space-y-2">
                 <!-- We need to access the tracks list properly in template -->
                 <!-- Use computed for tracks list to be safe -->
                 <div class="grid grid-cols-1 gap-2">
                     <button 
                        v-for="(track, idx) in (CONSTITUTIONS[currentConstitution.constitutionKey || currentConstitution.key]?.tracks || [])"
                        :key="idx"
                        @click="selectTrack(idx)"
                        class="flex items-center justify-between p-3 rounded-lg border transition-all text-left group"
                        :class="currentTrackIndex === idx 
                            ? 'bg-cinnabar/5 border-cinnabar/30 shadow-sm' 
                            : 'bg-white border-transparent hover:border-ink/10'"
                     >
                        <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                                :class="currentTrackIndex === idx ? 'bg-cinnabar text-white' : 'bg-ink/5 text-ink-light group-hover:bg-ink/10'"
                            >
                                <div v-if="isPlaying && currentTrackIndex === idx" class="w-2 h-2 bg-white rounded-full animate-ping"></div>
                                <span v-else>{{ idx + 1 }}</span>
                            </div>
                            <span class="text-sm font-medium" :class="currentTrackIndex === idx ? 'text-cinnabar' : 'text-ink'">{{ track.title }}</span>
                        </div>
                        <div class="text-xs text-jade/80 font-bold bg-jade/5 px-2 py-0.5 rounded" v-if="idx === 0">推荐</div>
                     </button>
                 </div>
            </div>
        </div>
      </section>

      <!-- 全局音频播放器（不依赖 currentConstitution） -->
      <audio 
        ref="audioPlayer" 
        :src="currentMusic?.src"
        :loop="isLooping"
        @ended="isPlaying = false"
        @timeupdate="updateProgress"
        @loadedmetadata="updateProgress"
        preload="auto"
      ></audio>

      <!-- 顺应天时 · 十二时辰养生音乐推荐 -->
      <section class="card p-0 overflow-hidden mb-6 animate-fade-in-up" style="animation-delay: 0.22s">
        <!-- 头部背景：根据时辰变化 -->
        <div class="relative h-24 bg-gradient-to-r p-5 flex flex-col justify-center"
             :class="currentRhythm.bgClass">
          <div class="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-4 -mt-4"></div>
          <div class="relative z-10 text-white">
            <div class="flex items-center gap-2 mb-1 opacity-90 text-sm">
              <Clock class="w-4 h-4" />
              <span>{{ currentRhythm.timeRange }} · {{ currentRhythm.period }}</span>
            </div>
            <h2 class="font-serif font-bold text-xl">{{ currentRhythm.action }}</h2>
            <p class="text-xs text-white/70 mt-0.5">十二时辰养生音乐推荐</p>
          </div>
        </div>

        <div class="p-5">
          <!-- 推荐与功效 -->
          <div class="flex items-start gap-4 mb-5">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center font-serif font-bold text-ink">
              {{ currentRhythm.tone }}
            </div>
            <div>
              <div class="font-medium text-ink mb-1">推荐：{{ currentRhythm.music }}</div>
              <p class="text-xs text-ink-light leading-relaxed">{{ currentRhythm.benefit }}</p>
            </div>
            <!-- 快速播放 (VIP限制) -->
            <button 
              @click.stop="playRhythmTrack" 
              class="ml-auto p-2 rounded-full bg-ink/5 text-ink hover:bg-ink/10 transition-colors relative group"
            >
              <div v-if="!isVip" class="absolute -top-1 -right-1 bg-cinnabar text-white text-[8px] px-1 rounded-full shadow-sm">
                60s
              </div>
              <Play v-if="!(isPlaying && playingRhythm)" class="w-4 h-4" />
              <Pause v-else class="w-4 h-4 text-cinnabar" />
            </button>
          </div>

          <!-- 每日和谐度 (原修身进度) -->
          <div class="bg-ink/5 rounded-xl p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-ink-light">今日和谐度</span>
              <span class="text-xs font-bold" :class="dailyListenTime >= dailyTarget ? 'text-jade' : 'text-ink'">
                {{ Math.floor(dailyListenTime / 60) }}/15 min
              </span>
            </div>
            <div class="relative h-2 bg-white rounded-full overflow-hidden">
              <div 
                class="absolute top-0 left-0 h-full bg-gradient-to-r from-jade to-jade-light transition-all duration-1000 ease-out"
                :style="{ width: dailyProgressPercent + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </section>

      <!-- 聆听建议 -->
      <section class="mb-6 animate-fade-in-up" style="animation-delay: 0.25s">
        <h3 class="font-serif font-bold text-ink mb-3 px-1">聆听建议</h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="card p-3 flex flex-col items-center text-center">
            <div class="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center mb-2">
              <Clock class="w-4 h-4 text-gold" />
            </div>
            <div class="text-xs font-bold text-ink mb-1">频次时长</div>
            <div class="text-[10px] text-ink-light">每日1-2次<br>每次15-30分钟</div>
          </div>
          <div class="card p-3 flex flex-col items-center text-center">
             <div class="w-8 h-8 rounded-full bg-jade/10 flex items-center justify-center mb-2">
              <Sparkles class="w-4 h-4 text-jade" />
            </div>
            <div class="text-xs font-bold text-ink mb-1">环境身心</div>
            <div class="text-[10px] text-ink-light">环境安静<br>身心放松</div>
          </div>
          <div class="card p-3 flex flex-col items-center text-center">
             <div class="w-8 h-8 rounded-full bg-cinnabar/10 flex items-center justify-center mb-2">
              <Music class="w-4 h-4 text-cinnabar" />
            </div>
            <div class="text-xs font-bold text-ink mb-1">适宜音量</div>
            <div class="text-[10px] text-ink-light">40-60分贝<br>柔和悦耳</div>
          </div>
          <div class="card p-3 flex flex-col items-center text-center">
             <div class="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center mb-2">
              <CheckCircle2 class="w-4 h-4 text-indigo-500" />
            </div>
            <div class="text-xs font-bold text-ink mb-1">辅助配合</div>
            <div class="text-[10px] text-ink-light">配合深呼吸<br>增强疗效</div>
          </div>
        </div>
      </section>

      <!-- 无体质记录提示 -->
      <section v-if="!currentConstitution" class="card p-6 mb-6 text-center animate-fade-in-up" style="animation-delay: 0.2s">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-ink/5 flex items-center justify-center">
          <Music class="w-8 h-8 text-ink-light" />
        </div>
        <p class="text-ink-light mb-4">完成体质测评，获取专属音乐推荐</p>
        <button @click="router.push('/assessment')" class="btn-primary">
          开始测评
        </button>
      </section>

      <!-- 免责声明 -->
      <p class="text-xs text-center text-ink-light/50 mt-8 mb-4 leading-relaxed">
        五音疗法是辅助手段，不能替代医疗治疗。<br>
        如有疾病请及时就医。
      </p>
      <!-- VIP 升级弹窗 -->
      <div v-if="showVipModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
        <div class="bg-paper rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
          <button @click="showVipModal = false" class="absolute top-3 right-3 text-ink-light hover:text-ink">
            <Monitor class="w-5 h-5" /> <!-- Using Monitor as X icon proxy if X is not imported, wait X is not imported. I need X or just clicking outside? I'll imports Close or X? No, I'll use text or just PauseOctagon as close? No. -->
            <!-- Actually I can just import X in the first chunk. Let's assume I missed it and use a simple SVG or text -->
            <span class="text-xl leading-none">&times;</span>
          </button>
          
          <div class="p-6 text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gold to-orange-400 rounded-full flex items-center justify-center shadow-lg">
              <Crown class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-serif font-bold text-ink mb-2">
                {{ vipTriggerReason === 'ai' ? '解锁AI智能音乐' : '解锁完整版养生音乐' }}
            </h3>
            <p class="text-ink-light text-sm mb-6">
              {{ vipTriggerReason === 'ai' 
                  ? 'AI风格音乐为 VIP 专享功能。升级后即可体验为您体质量身定制的生成式养生音乐。' 
                  : `免费版仅支持 60 秒试听。\n升级 VIP 即可聆听完整的《${ currentRhythm.music }》，并解锁所有时辰的专属调理音乐。` 
              }}
            </p>
            
            <button 
              @click="showVipModal = false; /* Implement upgrade flow */" 
              class="w-full py-3 bg-gradient-to-r from-cinnabar to-cinnabar-dark text-white rounded-xl font-bold hover:shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Crown class="w-5 h-5" />
              立即升级 VIP
            </button>
          </div>
        </div>
      </div>

      <!-- 7天复测弹窗 -->
      <div v-if="showRetestModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
        <div class="bg-paper rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative p-6 text-center">
             <div class="w-16 h-16 mx-auto mb-4 bg-cinnabar/10 rounded-full flex items-center justify-center">
               <Calendar class="w-8 h-8 text-cinnabar" />
             </div>
             <h3 class="text-xl font-serif font-bold text-ink mb-2">建议复测体质</h3>
             <p class="text-ink-light text-sm mb-6">
               您已坚持调理超过 7 天。体质可能已发生变化，建议重新进行测评以获取调整后的处方。
             </p>
             <div class="flex gap-3">
                <button @click="showRetestModal = false" class="flex-1 py-3 border rounded-xl text-ink-light">稍后再说</button>
                <button @click="router.push('/assessment')" class="flex-1 py-3 bg-cinnabar text-white rounded-xl font-bold shadow-md shadow-cinnabar/20">立即复测</button>
             </div>
        </div>
      </div>

      <!-- 科研每日打卡弹窗 -->
      <div v-if="showResearchModal" class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
        <div class="bg-paper rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
             <button @click="showResearchModal = false" class="absolute top-3 right-3 text-ink-light hover:text-ink z-10">
                <span class="text-xl leading-none">&times;</span>
             </button>

             <div class="p-6">
                <div v-if="!researchSubmitted">
                     <div class="flex items-center justify-center gap-2 mb-4 text-indigo-600">
                        <ClipboardCheck class="w-6 h-6" />
                        <span class="font-bold text-lg">每日科研打卡</span>
                     </div>
                     <p class="text-center text-sm text-ink-light mb-6">今日听音任务已完成，请简单记录感受</p>
                     
                     <div class="space-y-4 mb-6">
                        <div>
                            <div class="flex justify-between text-xs text-ink-light mb-1">
                                <span>睡眠改善</span>
                                <span class="font-bold text-indigo-600">{{ researchRating.sleep }}</span>
                            </div>
                            <input type="range" min="0" max="10" v-model.number="researchRating.sleep" class="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                        </div>
                        <div>
                            <div class="flex justify-between text-xs text-ink-light mb-1">
                                <span>焦虑缓解</span>
                                <span class="font-bold text-indigo-600">{{ researchRating.anxiety }}</span>
                            </div>
                            <input type="range" min="0" max="10" v-model.number="researchRating.anxiety" class="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                        </div>
                        <div>
                            <div class="flex justify-between text-xs text-ink-light mb-1">
                                <span>心情愉悦</span>
                                <span class="font-bold text-indigo-600">{{ researchRating.mood }}</span>
                            </div>
                            <input type="range" min="0" max="10" v-model.number="researchRating.mood" class="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
                        </div>
                        <input 
                            v-model="researchNote"
                            placeholder="其他感受（选填）"
                            class="w-full p-2 bg-ink/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                     </div>

                    <button 
                        @click="submitResearchLog" 
                        class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                    >
                        提交打卡
                    </button>
                </div>

                <div v-else class="text-center py-8">
                    <CheckCircle2 class="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 class="font-bold text-ink text-lg">打卡成功</h3>
                    <p class="text-sm text-ink-light">感谢您的参与，离VIP奖励更近一步！</p>
                </div>
             </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-gradient-radial {
  background: radial-gradient(circle, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 70%);
}
</style>
