<script setup>
import { ref, onMounted, onUnmounted, computed, watch, onActivated, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Play, Pause, RefreshCw, Music, Home, Loader2, Star, Sparkles, Lock, Crown, Repeat, SkipForward, AlertCircle } from 'lucide-vue-next'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'
import { Chart } from 'vue-chartjs'
import { QUESTIONS_FREE } from '../data/questions-free.js'
import { CONSTITUTIONS } from '../data/constitutions.js'
import { getFullAssessment } from '../utils/scoring.js'
import { getAIMusicByConstitution } from '../data/ai-music.js'
import { storage, playbackCache } from '../utils/storage.js'
import { toneGenerator, getToneByConstitution, TONE_FREQUENCIES } from '../utils/toneGenerator.js'

const TONE_COLORS = {
  '宫': 'from-amber-500 via-orange-500 to-yellow-600', // Earth - Yellow
  '商': 'from-slate-400 via-zinc-400 to-stone-500',    // Metal - White/Silver
  '角': 'from-emerald-500 via-teal-500 to-green-600',  // Wood - Green
  '徵': 'from-rose-500 via-red-500 to-orange-600',     // Fire - Red
  '羽': 'from-indigo-600 via-blue-600 to-slate-800'    // Water - Black/Blue
}

// 注册 Chart.js
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const router = useRouter()

// 状态
const loading = ref(true)
const result = ref(null)
const isPlaying = ref(false)
const isAIGenerating = ref(false)  // AI音乐生成状态
const audioPlayer = ref(null)
const rating = ref(0)
const feedbackSubmitted = ref(false)
const showFeedback = ref(false)
const musicType = ref('traditional') // 'traditional' 或 'ai'
const currentTime = ref(0)
const duration = ref(0)
const showVipModal = ref(false)

const isLooping = ref(false)
const currentTrackIndex = ref(0)

// 评价弹窗相关
const hasPromptedFeedback = ref(false)        // 是否已触发过评价弹窗
const sessionId = ref(Date.now().toString())  // 本次会话ID

// 自动保存间隔（秒）- 防止数据丢失
const AUTO_SAVE_INTERVAL = 10

// VIP 状态（演示模式自动解锁）
const isVip = ref(location.search.includes('demo=1') || localStorage.getItem('wuyin_vip') === 'true')

// 进度百分比
const progress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 更新进度
const updateProgress = () => {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime
    duration.value = audioPlayer.value.duration || 0
  }
}

// 进度条引用
const progressBar = ref(null)
const isDragging = ref(false)

// 计算并设置进度
const setProgressFromEvent = (event) => {
  if (!progressBar.value || !audioPlayer.value || !duration.value) return
  const rect = progressBar.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  audioPlayer.value.currentTime = percent * duration.value
}

// 点击进度条
const seekTo = (event) => {
  setProgressFromEvent(event)
}

// 开始拖动
const startDrag = (event) => {
  isDragging.value = true
  setProgressFromEvent(event)
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

// 拖动中
const onDrag = (event) => {
  if (isDragging.value) {
    setProgressFromEvent(event)
  }
}

// 停止拖动
const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 动态背景
const playerBgClass = computed(() => {
  if (!result.value) return 'from-emerald-800 via-teal-800 to-teal-900'
  const tone = result.value.primary.constitution.toneName
  return TONE_COLORS[tone] || 'from-emerald-800 via-teal-800 to-teal-900'
})

// 当前播放的音乐信息
const currentMusic = computed(() => {
  if (!result.value) return null

  if (musicType.value === 'ai') {
    // AI音乐模式：返回虚拟音乐对象（实际用Web Audio API播放）
    const toneKey = getToneByConstitution(result.value.primary.key)
    const tone = TONE_FREQUENCIES[toneKey] || TONE_FREQUENCIES.gong
    return {
      title: `${tone.name}调养生音`,
      src: '',  // 空src，用Web Audio API播放
      duration: '10:00',
      tone: tone.name,
      description: tone.description,
      isAI: true
    }
  } else {
    // 确保 index 有效
    const tracks = result.value.primary.constitution.tracks || []

    // 如果没有 tracks 但有 key，尝试从 CONSTITUTIONS 获取（兼容旧数据）
    let availableTracks = tracks
    if (availableTracks.length === 0 && result.value.primary.key) {
        const key = result.value.primary.key
        if (CONSTITUTIONS[key]) {
            availableTracks = CONSTITUTIONS[key].tracks || []
        }
    }

    if (availableTracks.length > 0) {
         if (currentTrackIndex.value >= availableTracks.length) currentTrackIndex.value = 0
         return {
            ...availableTracks[currentTrackIndex.value],
            description: result.value.primary.constitution.musicDesc,
            tone: result.value.primary.constitution.toneName
         }
    }

    const track = tracks[currentTrackIndex.value]
    return {
      title: track?.title,
      src: track?.src,
      description: result.value.primary.constitution.musicDesc,
      tone: result.value.primary.constitution.toneName
    }
  }
})

// 切换音乐类型时停止播放并重置进度
watch(musicType, () => {
  // 停止AI音乐生成
  if (isAIGenerating.value) {
    toneGenerator.stop()
    isAIGenerating.value = false
  }
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    isPlaying.value = false
    currentTime.value = 0
  }
  currentTrackIndex.value = 0 // Reset index when switching types
  // 艹！切换音乐类型时必须重置评价状态
  hasPromptedFeedback.value = false
  feedbackSubmitted.value = false
  rating.value = 0
})

const selectTrack = (index) => {
    console.log('[Result] selectTrack 被调用, 从', currentTrackIndex.value, '切换到', index)
    if (currentTrackIndex.value === index) return
    currentTrackIndex.value = index

    // 艹！切换曲目时必须重置评价状态，否则后续曲目不会弹出评价弹窗
    hasPromptedFeedback.value = false
    feedbackSubmitted.value = false
    rating.value = 0

    // 清除上一首的进度缓存（因为曲目已经切换）
    localStorage.removeItem('wuyin_playback_progress')

    if(audioPlayer.value) {
        audioPlayer.value.pause()
        isPlaying.value = false
    }
    currentTime.value = 0

    setTimeout(() => {
        if(audioPlayer.value) {
            audioPlayer.value.play().catch(e => console.error('Playback failed', e))
            isPlaying.value = true
        }
    }, 100)
}

const switchTrack = () => {
    console.log('[Result] switchTrack 被调用, 当前曲目:', currentTrackIndex.value)
    if (musicType.value === 'ai') return // AI music usually single stream per type

    const tracks = result.value.primary.constitution.tracks || []
    if (tracks.length <= 1) return

    // 保存当前曲目的播放进度
    savePlaybackProgress()

    // Pause current
    if (audioPlayer.value) {
        audioPlayer.value.pause()
        isPlaying.value = false
    }

    // Switch index
    currentTrackIndex.value = (currentTrackIndex.value + 1) % tracks.length
    console.log('[Result] 切换到曲目:', currentTrackIndex.value)

    // Reset progress
    currentTime.value = 0

    // 清除上一首的进度缓存（因为曲目已经切换）
    localStorage.removeItem('wuyin_playback_progress')

    // 艹！切换曲目时必须重置评价状态，否则后续曲目不会弹出评价弹窗
    hasPromptedFeedback.value = false
    feedbackSubmitted.value = false
    rating.value = 0
    console.log('[Result] 重置评价状态: hasPromptedFeedback=false, feedbackSubmitted=false')

    // Auto play new track after short delay
    setTimeout(() => {
        if(audioPlayer.value) {
            audioPlayer.value.play().catch(e => console.error('Playback failed', e))
            isPlaying.value = true
            console.log('[Result] 开始播放新曲目')
        }
    }, 300)
}

const handleAiMusicClick = () => {
    if (isVip.value) {
        musicType.value = 'ai'
    } else {
        showVipModal.value = true
    }
}

// 雷达图配置
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      angleLines: { color: '#E5E7EB' },
      grid: { color: '#E5E7EB' },
      pointLabels: {
        font: { family: '"Noto Serif SC", serif', size: 11 },
        color: '#595E66'
      },
      ticks: { display: false },
      suggestedMin: 0,
      suggestedMax: 100
    }
  },
  plugins: {
    legend: { display: false }
  }
}

// 雷达图数据
const chartData = computed(() => {
  console.log('[Chart] result.value:', result.value)
  if (!result.value) return { labels: [], datasets: [] }

  console.log('[Chart] scores:', result.value.scores)
  return {
    labels: Object.values(CONSTITUTIONS).map(c => c.name),
    datasets: [{
      label: '体质得分',
      backgroundColor: 'rgba(166, 52, 52, 0.15)',
      borderColor: '#A63434',
      borderWidth: 2,
      pointBackgroundColor: '#A63434',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#A63434',
      data: Object.keys(CONSTITUTIONS).map(k => result.value.scores.transformed[k] || 0)
    }]
  }
})

const loadData = () => {
    loading.value = true
    // 模拟AI分析加载 (Only if we have data to analyze or existing result)
    // Actually, check storage first.
    const current = storage.get('CONSTITUTION')
    const answers = storage.get('ANSWERS')

    console.log('[Result] loadData:', { current: !!current, answers: !!answers, answersData: answers })

    if (!current && !answers) {
        console.log('[Result] No data found, redirecting to assessment')
        result.value = null
        loading.value = false
        return
    }
    
    // If we have data, simulate loading or just show it (if it's already calculated/saved)
    // For smoother UX, if we have saved result, just show it.
    // If we need to calculate from answers, do that.
    
    setTimeout(() => {
        calculateResult()
        loading.value = false
    }, 500) // Shorten delay for re-entry
}

// 初始化
onMounted(() => {
  loadData()
})

// 恢复播放进度（切换页面回来时继续播放）
onActivated(() => {
    // 检查数据是否已加载，如果已加载则恢复进度
    if (result.value) {
        console.log('[Result] onActivated 触发，数据已加载，尝试恢复播放进度')
        restorePlaybackProgress()
    } else {
        console.log('[Result] onActivated 触发，数据未加载，调用 loadData')
        loadData()
    }
})

// 保存播放进度到缓存
const savePlaybackProgress = () => {
    if (!audioPlayer.value || !result.value) return

    const progressData = {
        currentTime: currentTime.value,
        duration: duration.value,
        isPlaying: isPlaying.value,
        trackIndex: currentTrackIndex.value,
        musicType: musicType.value,
        trackTitle: currentMusic.value?.title,  // 保存曲目标题，用于恢复时判断
        timestamp: new Date().toISOString()
    }

    // 保存到本地存储
    localStorage.setItem('wuyin_playback_progress', JSON.stringify(progressData))
    console.log('[Result] 保存播放进度:', progressData)
}

// 恢复播放进度
const restorePlaybackProgress = () => {
    console.log('[Result] restorePlaybackProgress 被调用, result.value:', !!result.value, 'audioPlayer.value:', !!audioPlayer.value)

    const saved = localStorage.getItem('wuyin_playback_progress')
    if (!saved) {
        console.log('[Result] 没有保存的进度')
        return
    }
    if (!result.value) {
        console.log('[Result] result.value 为空，不恢复')
        return
    }

    try {
        const progressData = JSON.parse(saved)
        console.log('[Result] 恢复进度数据:', progressData)

        // 检查是否是同一次会话的数据（检查曲目是否相同）
        const currentTrackTitle = currentMusic.value?.title
        console.log('[Result] 当前曲目标题:', currentTrackTitle, '保存的曲目标题:', progressData.trackTitle)

        if (progressData.trackTitle !== currentTrackTitle) {
            console.log('[Result] 曲目不同，不恢复进度')
            return
        }

        // 恢复进度
        if (audioPlayer.value && progressData.currentTime > 0) {
            audioPlayer.value.currentTime = progressData.currentTime
            currentTime.value = progressData.currentTime

            // 如果之前在播放，恢复播放状态
            if (progressData.isPlaying) {
                audioPlayer.value.play().catch(e => console.error('恢复播放失败', e))
                isPlaying.value = true
            }

            console.log('[Result] 恢复播放进度成功:', progressData)
        }
    } catch (e) {
        console.error('[Result] 恢复播放进度失败:', e)
    }
}

// 计算结果
const calculateResult = () => {
    // 1. Check for Manual Input first
    const current = storage.get('CONSTITUTION')
    if (current) {
        // If it's a recent manual input (less than 5 mins old? or just isManual flag), use it.
        // Actually, just checking isManual is enough for now, as we redirect immediately.
        if (current.isManual) {
            result.value = {
                primary: {
                    key: current.constitutionKey,
                    constitution: CONSTITUTIONS[current.constitutionKey],
                    score: current.score
                },
                scores: { transformed: {} }, // Empty scores for manual
                tendencies: [] // No tendencies for manual
            }
            loading.value = false
            return
        }
    }

  const answers = storage.get('ANSWERS')

  if (!answers) {
    router.push('/assessment')
    return
  }

  // 艹！检查答案数据是否完整，特禀质题目（25-27）必须存在
  const missingQuestions = QUESTIONS_FREE.filter(q => answers[q.id] === undefined)
  if (missingQuestions.length > 0) {
    console.error('[Result] 艹！答案数据不完整，缺少题目:', missingQuestions.map(q => ({id: q.id, type: q.type})))
    // 如果缺少题目，删除脏数据，让用户重新答题
    storage.remove('ANSWERS')
    storage.remove('CONSTITUTION')
    router.push('/assessment')
    return
  }

  console.log('[Result] 答案数据完整，开始计算...')
  console.log('[Result] 完整答案数据:', JSON.stringify(answers))
  console.log('[Result] 特禀质题目答案:', {
    25: answers[25],
    26: answers[26],
    27: answers[27]
  })

  const version = 'GB/T 46939-2025' // 国标版本

  // 统一使用国标卷
  const assessmentResult = getFullAssessment(answers, QUESTIONS_FREE)
  console.log('[Result] getFullAssessment 原始返回:', assessmentResult)
  result.value = assessmentResult
  console.log('[Result] Calculated result:', result.value)
  console.log('[Result] Primary constitution:', result.value.primary.key, 'score:', result.value.scores.transformed[result.value.primary.key])
  console.log('[Result] All scores:', result.value.scores.transformed)
  console.log('[Result] Tendencies:', result.value.tendencies)

  // 保存体质历史记录
  // 艹！这里要保存当前播放的曲目，不然Profile页面显示"未知曲目"
  const currentTrack = result.value.primary.constitution.tracks?.[0] || null

  const historyRecord = {
    date: new Date().toISOString(),
    constitutionKey: result.value.primary.key,
    constitutionName: result.value.primary.constitution.name,
    toneName: result.value.primary.constitution.toneName,

    aiMusic: getAIMusicByConstitution(result.value.primary.key),
    traditionalMusic: currentTrack, // 保存第一首推荐曲目
    musicType: 'traditional', // 默认传统音乐，用户可以在播放器切换
    version: version
  }
  
  // 获取历史记录
  const history = storage.get('HISTORY') || []
  history.unshift(historyRecord) // 添加到开头
  // 最多保存20条
  if (history.length > 20) history.pop()
  storage.set('HISTORY', history)
  
  // 保存当前体质（供首页使用）
  storage.set('CONSTITUTION', historyRecord)
}

// 播放控制
const togglePlay = () => {
  // AI 音乐模式
  if (musicType.value === 'ai') {
    if (isPlaying.value) {
      // 停止AI生成
      toneGenerator.stop()
      isPlaying.value = false
      isAIGenerating.value = false
    } else {
      // 开始AI生成
      const toneKey = getToneByConstitution(result.value?.primary?.key || 'gong')
      console.log('[Result] 播放AI音乐, toneKey:', toneKey)
      toneGenerator.playPentatonic(toneKey, 600)  // 播放10分钟
      isPlaying.value = true
      isAIGenerating.value = true
    }
    return
  }

  // 传统音乐模式
  if (!audioPlayer.value) return

  if (isPlaying.value) {
    audioPlayer.value.pause()
  } else {
    audioPlayer.value.play().catch(e => console.error('Playback failed', e))
  }
  isPlaying.value = !isPlaying.value

  // 保存播放进度
  savePlaybackProgress()
}

// 播放结束 - 触发评价弹窗
const onAudioEnded = () => {
  console.log('[Result] onAudioEnded 触发, feedbackSubmitted:', feedbackSubmitted.value, 'listenDuration:', listenDuration.value)
  isPlaying.value = false

  // 切换曲目时重置评价状态
  hasPromptedFeedback.value = false
  rating.value = 0

  // 触发评价弹窗
  if (!feedbackSubmitted.value && listenDuration.value > 0) {
    console.log('[Result] 显示评价弹窗')
    showFeedback.value = true

    // 保存播放数据到缓存
    playbackCache.save({
      sessionId: sessionId.value,
      listenDuration: listenDuration.value,
      musicType: musicType.value,
      trackTitle: currentMusic.value?.title,
      trackIndex: currentTrackIndex.value,
      timestamp: new Date().toISOString()
    })
  } else {
    console.log('[Result] 不显示评价弹窗: feedbackSubmitted=', feedbackSubmitted.value, 'listenDuration=', listenDuration.value)
  }
}

// 计时器相关
let timer = null
const listenDuration = ref(0) // 单位：秒
let lastSaveTime = 0          // 上次保存时间

// 开始计时
const startTimer = () => {
  stopTimer()
  timer = setInterval(() => {
    listenDuration.value++

    // 每10秒自动保存播放数据（防止用户杀App数据丢失）
    if (listenDuration.value - lastSaveTime >= AUTO_SAVE_INTERVAL) {
      savePlaybackData()
      lastSaveTime = listenDuration.value
    }
  }, 1000)
}

// 停止计时
const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 保存播放数据（带缓存机制）
const savePlaybackData = () => {
  if (listenDuration.value <= 0) return

  // 1. 先保存到缓存（防止丢失）
  playbackCache.save({
    sessionId: sessionId.value,
    listenDuration: listenDuration.value,
    musicType: musicType.value,
    trackTitle: currentMusic.value?.title,
    trackIndex: currentTrackIndex.value,
    timestamp: new Date().toISOString()
  })

  // 2. 更新历史记录中的播放数据（不是评价数据）
  const history = storage.get('HISTORY') || []
  if (history.length > 0) {
    if (!history[0].playback) {
      history[0].playback = {}
    }
    history[0].playback.listenDuration = listenDuration.value
    history[0].playback.musicType = musicType.value
    history[0].playback.trackTitle = currentMusic.value?.title
    history[0].playback.trackIndex = currentTrackIndex.value
    history[0].playback.lastUpdate = new Date().toISOString()

    storage.set('HISTORY', history)
    storage.set('CONSTITUTION', history[0])
  }
}

// 监听播放状态
watch(isPlaying, (val) => {
  if (val) {
    startTimer()
  } else {
    stopTimer()
    // 暂停时立即保存数据（用户可能切走）
    savePlaybackData()
    // 保存播放进度（用于切换页面后继续播放）
    savePlaybackProgress()
  }
})

// 组件卸载时清除计时器并自动保存播放数据
onUnmounted(() => {
  stopTimer()

  // 保存播放进度（切换页面时继续播放）
  savePlaybackProgress()

  // 艹！用户杀App、关网页时这里可能不执行，所以前面要定期保存
  // 但还是要尽量保存一次
  savePlaybackData()
})

// 提交反馈
const submitFeedback = () => {
  // 获取兼夹体质数据
  const tendencies = result.value?.tendencies || []

  // 更新历史记录 - 保存实际播放的歌曲评价
  const history = storage.get('HISTORY') || []
  if (history.length > 0) {
    // 使用当前播放的歌曲信息，不是默认第一首
    history[0].feedback = {
      rating: rating.value,
      musicType: musicType.value,
      trackTitle: currentMusic.value?.title,
      trackIndex: currentTrackIndex.value,
      tone: currentMusic.value?.tone || result.value?.primary?.constitution?.toneName,
      timestamp: new Date().toISOString(),
      listenDuration: listenDuration.value
    }
    storage.set('HISTORY', history)
    storage.set('CONSTITUTION', history[0])
  }

  // 同时保存到独立的反馈记录（便于科研导出）
  const feedbackRecord = {
    constitution: result.value.primary.key,
    constitutionName: result.value.primary.constitution.name,
    toneName: result.value.primary.constitution.toneName,
    tone: result.value.primary.constitution.tone,
    tendencies: tendencies.map(t => ({
      key: t.key,
      name: t.constitution.name,
      score: t.score
    })),
    rating: rating.value,
    ratingLabel: getRatingLabel(rating.value),
    musicType: musicType.value,
    trackTitle: currentMusic.value?.title,
    trackIndex: currentTrackIndex.value,
    timestamp: new Date().toISOString(),
    listenDuration: listenDuration.value
  }
  const feedbacks = storage.get('FEEDBACK') || []
  feedbacks.push(feedbackRecord)
  storage.set('FEEDBACK', feedbacks)

  // 关闭评价弹窗
  feedbackSubmitted.value = true
  showFeedback.value = false

  // 清除缓存
  playbackCache.clear()
}

// 评分标签辅助函数
const getRatingLabel = (score) => {
  const labels = { 1: '很差', 2: '较差', 3: '一般', 4: '较好', 5: '很好' }
  return labels[score] || ''
}

// 跳过评价（记录用户跳过了评价）
const skipFeedback = () => {
  const history = storage.get('HISTORY') || []
  if (history.length > 0) {
    if (!history[0].feedback) {
      history[0].feedback = {}
    }
    history[0].feedback.skipped = true
    history[0].feedback.skipTimestamp = new Date().toISOString()
    history[0].feedback.listenDuration = listenDuration.value
    storage.set('HISTORY', history)
  }
  showFeedback.value = false
  hasPromptedFeedback.value = true
}
// End of script
</script>

<template>
  <div class="min-h-screen bg-paper pb-20 relative overflow-hidden">
    <!-- Empty State -->
    <div v-if="!loading && !result" class="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in-up">
        <div class="w-24 h-24 bg-ink/5 rounded-full flex items-center justify-center mb-6">
            <Sparkles class="w-12 h-12 text-ink-light" />
        </div>
        <h2 class="text-xl font-serif font-bold text-ink mb-2">您还没有进行体质测评</h2>
        <p class="text-ink-light mb-8">进行体质测评，获取您的专属调理方案</p>
        <button 
            @click="router.push('/diagnosis')"
            class="bg-cinnabar text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:scale-95"
        >
            立即测评
        </button>
    </div>

    <!-- AI分析加载 -->
    <div v-else-if="loading" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper/90 backdrop-blur-sm">
      <div class="relative mb-8">
        <div class="absolute inset-0 bg-cinnabar/20 rounded-full blur-xl animate-pulse"></div>
        <Loader2 class="h-16 w-16 text-cinnabar animate-spin relative z-10" />
      </div>
      <div class="space-y-3">
        <h2 class="text-2xl font-serif font-bold text-ink">AI 正在分析体质...</h2>
        <p class="text-ink-light animate-pulse">
          解析问卷数据...<br>
          匹配五音调式...<br>
          生成个性化建议...
        </p>
      </div>
    </div>

    <!-- 结果页面 -->
    <div v-else-if="result" class="pb-8">
      <!-- 头部导航 -->
      <header class="sticky top-0 z-50 bg-paper/80 backdrop-blur-lg border-b border-ink/5">
        <div class="max-w-lg mx-auto px-6 py-4 flex items-center gap-4">
          <button @click="router.push('/')" class="p-2 rounded-full hover:bg-ink/5 transition-colors">
            <ArrowLeft class="w-5 h-5 text-ink" />
          </button>
          <h1 class="font-serif font-bold text-lg text-ink">辨识结果</h1>
        </div>
      </header>

      <!-- ⚠️ 医疗免责声明 -->
      <div class="bg-amber-50 border-b border-amber-200 py-2">
        <div class="max-w-lg mx-auto px-4 flex items-start gap-2">
          <AlertCircle class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-amber-800 leading-relaxed">
            <strong class="font-bold">重要提示：</strong>本功能仅供健康调理参考，非医疗诊断。
            分析结果不能替代专业医生的诊断和治疗建议。如有身体不适，请及时就医。
          </p>
        </div>
      </div>

      <main class="max-w-lg mx-auto px-6 py-6 space-y-6">
        <!-- 主要体质卡片 -->
        <section class="card p-6 border-t-4 animate-fade-in-up" :style="{ borderColor: result.primary.constitution.color }">
          <div class="text-xs text-ink-light tracking-widest uppercase mb-2">您的主要体质</div>
          <h2 class="text-3xl font-serif font-bold text-ink mb-3">{{ result.primary.constitution.name }}</h2>
          <p class="text-ink-light leading-relaxed mb-4">
            {{ result.primary.constitution.desc }}
          </p>
          <div class="bg-jade/10 rounded-lg p-4">
            <p class="text-sm text-jade font-medium">{{ result.primary.constitution.feature }}</p>
          </div>
        </section>

        <!-- 雷达图 (VIP) -->
        <section class="card p-6 animate-fade-in-up" style="animation-delay: 0.1s">
          <h3 class="font-serif font-bold text-lg text-ink mb-4 text-center">体质全景分析</h3>
          <div class="h-80 w-full relative">
            <Chart v-if="chartData.datasets && chartData.datasets.length > 0" type="radar" :data="chartData" :options="chartOptions" />
            
            <!-- VIP 锁 -->
            <div v-if="!isVip" class="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div class="w-12 h-12 rounded-full bg-ink/80 flex items-center justify-center mb-2 shadow-lg">
                <Lock class="w-6 h-6 text-gold" />
              </div>
              <p class="font-serif font-bold text-ink">升级 VIP 解锁全景分析</p>
            </div>
          </div>
          <p class="text-xs text-center text-ink-light mt-4">
            {{ isVip ? '越向外扩张，说明该体质特征越明显' : '深度解析九种体质分布，精准定位偏颇' }}
          </p>
        </section>

        <!-- 兼夹体质 (VIP) -->
        <section v-if="result.tendencies && result.tendencies.length > 0" class="card p-6 border-l-4 border-gold animate-fade-in-up" style="animation-delay: 0.15s">
          <h3 class="font-serif font-bold text-lg text-ink mb-3">兼夹体质</h3>
          
          <div v-if="!isVip">
            <p class="text-sm text-ink-light mb-4">
              检测到您有复杂的混合体质倾向，可能影响调理方案的精准度。
            </p>
            <button class="w-full py-3 bg-gradient-to-r from-gold to-gold-light text-ink-dark font-bold rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all">
              <Crown class="w-4 h-4" />
              升级 VIP 查看深度兼夹分析
            </button>
          </div>

          <div v-else>
            <p class="text-sm text-ink-light mb-4 leading-relaxed">
              中医体质常为混合存在。数据显示您兼有以下体质倾向，调理时需兼顾整体平衡。
            </p>
            <div class="space-y-3">
              <div 
                v-for="item in result.tendencies" 
                :key="item.key"
                class="flex items-center justify-between p-3 bg-ink/5 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center font-serif font-bold text-ink shadow-sm">
                    {{ item.constitution.name[0] }}
                  </div>
                  <div>
                    <div class="font-medium text-ink">{{ item.constitution.name }}</div>
                    <div class="text-xs text-ink-light">转化分: {{ item.score }}</div>
                  </div>
                </div>
                <div class="text-sm font-bold text-ink-light/70 bg-white/50 px-2 py-1 rounded">
                  {{ item.judgment.label }}
                </div>
              </div>
            </div>
            <p class="text-[10px] text-ink-light/50 mt-4 text-center">
              * 本处方优先针对您的主体质（{{ result.primary.constitution.name }}）进行核心调理
            </p>
          </div>
        </section>

        <!-- 五音处方 -->
        <section class="card p-6 border-t-4 border-cinnabar relative overflow-hidden animate-fade-in-up" style="animation-delay: 0.2s">
          <div class="absolute -right-8 -bottom-8 opacity-5">
            <div class="w-48 h-48 rounded-full border-8 border-ink"></div>
          </div>
          
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-4">
              <div>
                <div class="text-xs text-ink-light tracking-widest uppercase">五音疗愈处方</div>
                <h3 class="text-xl font-serif font-bold text-ink mt-1">{{ result.primary.constitution.toneName }}音调理</h3>
              </div>
              <div class="w-10 h-10 rounded-full bg-cinnabar/10 flex items-center justify-center">
                <Music class="w-5 h-5 text-cinnabar" />
              </div>
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
                @click="handleAiMusicClick"
                class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all"
                :class="musicType === 'ai' ? 'bg-white text-ink shadow-sm' : 'text-ink-light'"
              >
                <div class="flex items-center gap-2">
                    <Sparkles class="w-4 h-4" />
                    <span>AI风格</span>
                    <Lock v-if="!isVip" class="w-3 h-3 text-ink-light" />
                </div>
              </button>
            </div>
            
            <p class="text-sm text-ink-light mb-4 leading-relaxed">
              {{ musicType === 'ai' ? currentMusic?.description : result.primary.constitution.musicDesc }}
            </p>

            <!-- 播放器 -->
            <div class="relative rounded-xl overflow-hidden transition-all duration-500">
              <!-- 动态渐变背景 -->
              <div 
                class="absolute inset-0 bg-gradient-to-br transition-all duration-500"
                :class="playerBgClass"
              ></div>
              <!-- 播放时的光晕效果 -->
              <div 
                v-if="isPlaying" 
                class="absolute inset-0 bg-gradient-radial animate-pulse transition-all duration-500"
                :class="musicType === 'ai' 
                  ? 'from-sky-400/20 via-transparent to-transparent' 
                  : 'from-gold/25 via-transparent to-transparent'"
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

                 <!-- Switch Track Button -->
                <button 
                    v-if="musicType === 'traditional' && result.primary.constitution.tracks.length > 1"
                    @click.stop="switchTrack"
                    class="absolute top-4 left-12 z-20 p-1.5 rounded-full text-white/40 hover:text-white/80 transition-colors"
                    title="切换曲目"
                >
                    <SkipForward class="w-4 h-4" />
                </button>

                <button 
                  @click="togglePlay"
                  class="relative w-14 h-14 rounded-full bg-gradient-to-br from-paper to-paper/90 text-ink flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                >
                  <!-- 播放时的呼吸光环 -->
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
                    {{ result.primary.constitution.toneName }}调 · {{ musicType === 'ai' ? 'AI合成' : '传统古曲' }}
                  </div>
                </div>
                
                <!-- 装饰符号 -->
                <div class="text-paper/20 text-2xl">{{ musicType === 'ai' ? '✦' : '♪' }}</div>
              </div>
              
              <!-- 进度条 -->
              <div class="px-4 pb-3">
                <div 
                  ref="progressBar"
                  @click="seekTo"
                  @mousedown="startDrag"
                  class="h-2 bg-paper/20 rounded-full cursor-pointer group"
                >
                  <div 
                    class="h-full rounded-full transition-all relative"
                    :class="musicType === 'ai' ? 'bg-white' : 'bg-white'"
                    :style="{ width: progress + '%' }"
                  >
                    <div 
                      class="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-md cursor-grab active:cursor-grabbing scale-0 group-hover:scale-100 transition-transform"
                      :class="musicType === 'ai' ? 'bg-white' : 'bg-white'"
                    ></div>
                  </div>
                </div>
                 <!-- Duration Display -->
                <div class="flex justify-between mt-1.5 px-0.5">
                   <span class="text-xs text-white/90 font-medium font-mono drop-shadow-md">{{ formatTime(currentTime) }}</span>
                   <span class="text-xs text-white/90 font-medium font-mono drop-shadow-md">{{ formatTime(duration) }}</span>
                </div>
              </div>
            </div>

            <audio 
              ref="audioPlayer" 
              :src="currentMusic?.src"
              :loop="isLooping"
              @ended="onAudioEnded"
              @timeupdate="updateProgress"
              @loadedmetadata="updateProgress"
              preload="auto"
            ></audio>

            <!-- Song Selection List (Traditional Only) -->
            <div v-if="musicType === 'traditional' && result" class="mt-4 space-y-2">
                <div class="px-1 text-xs font-bold text-ink-light mb-2">推荐曲目清单</div>
                <div class="space-y-2">
                     <div class="grid grid-cols-1 gap-2">
                         <button 
                            v-for="(track, idx) in (result?.primary?.constitution?.tracks || CONSTITUTIONS[result?.primary?.key]?.tracks || [])" 
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

          </div>
        </section>

        <!-- 养生建议 -->
        <section class="card p-6 animate-fade-in-up" style="animation-delay: 0.3s">
          <h3 class="font-serif font-bold text-lg text-ink mb-4">养生调理建议</h3>
          
          <div class="space-y-4">
            <div class="flex gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-cinnabar/10 flex items-center justify-center text-cinnabar font-bold text-sm">食</div>
              <div>
                <div class="font-medium text-ink text-sm mb-1">饮食调理</div>
                <p class="text-ink-light text-sm">{{ result.primary.constitution.advice.diet }}</p>
              </div>
            </div>
            
            <div class="flex gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-jade/10 flex items-center justify-center text-jade font-bold text-sm">居</div>
              <div>
                <div class="font-medium text-ink text-sm mb-1">起居调护</div>
                <p class="text-ink-light text-sm">{{ result.primary.constitution.advice.living }}</p>
              </div>
            </div>
            
            <div class="flex gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold font-bold text-sm">动</div>
              <div>
                <div class="font-medium text-ink text-sm mb-1">运动调养</div>
                <p class="text-ink-light text-sm">{{ result.primary.constitution.advice.sports }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 操作按钮 -->
        <div class="flex gap-4 animate-fade-in-up" style="animation-delay: 0.4s">
          <button @click="router.push('/assessment')" class="btn-secondary flex-1 flex items-center justify-center gap-2">
            <RefreshCw class="w-4 h-4" />
            重新测评
          </button>
          <button @click="router.push('/')" class="btn-primary flex-1 flex items-center justify-center gap-2">
            <Home class="w-4 h-4" />
            返回首页
          </button>
        </div>

        <!-- 免责声明 -->
        <p class="text-xs text-center text-ink-light/60">
          本结果仅供参考，不作为医疗诊断依据
        </p>
      </main>
    </div>

    <!-- 反馈弹窗 -->
    <div v-if="showFeedback" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-6">
      <div class="card p-6 max-w-sm w-full animate-fade-in-up">
          <h3 class="font-serif font-bold text-lg text-ink text-center mb-2">疗效反馈</h3>

          <!-- 显示正在评价的曲目 -->
          <p class="text-xs text-ink-light text-center mb-4">
            您刚刚听完《{{ currentMusic?.title }}》
          </p>

          <div class="flex justify-center gap-2 mb-4">
            <button
              v-for="star in 5"
              :key="star"
              @click="rating = star"
              class="text-3xl transition-all hover:scale-110"
              :class="star <= rating ? 'text-gold' : 'text-ink/20'"
            >
              ★
            </button>
          </div>

          <!-- 评分提示 -->
          <p class="text-sm text-cinnabar text-center mb-4 font-medium">
            {{ rating === 0 ? '请点击星星评分' : '感谢您的评价！' }}
          </p>

          <div class="flex gap-3">
            <button @click="skipFeedback" class="btn-secondary flex-1 text-sm">跳过</button>
            <button @click="submitFeedback" :disabled="rating === 0" class="btn-primary flex-1" :class="rating === 0 && 'opacity-50'">
              提交
            </button>
          </div>
      </div>
    </div>

    <!-- VIP 升级弹窗 -->
      <div v-if="showVipModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
        <div class="bg-paper rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
          <button @click="showVipModal = false" class="absolute top-3 right-3 text-ink-light hover:text-ink">
            <span class="text-xl leading-none">&times;</span>
          </button>
          
          <div class="p-6 text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gold to-orange-400 rounded-full flex items-center justify-center shadow-lg">
              <Crown class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-serif font-bold text-ink mb-2">解锁AI智能音乐</h3>
            <p class="text-ink-light text-sm mb-6">
              AI风格音乐为 VIP 专享功能。升级后即可体验为您体质量身定制的生成式养生音乐。
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
  </div>
</template>
