<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Play, Pause, RefreshCw, Music, Home, Loader2, Star, Sparkles } from 'lucide-vue-next'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'
import { Radar } from 'vue-chartjs'
import { QUESTIONS_FREE } from '../data/questions-free.js'
import { QUESTIONS_VIP } from '../data/questions-vip.js'
import { CONSTITUTIONS } from '../data/constitutions.js'
import { getFullAssessment } from '../utils/scoring.js'
import { getAIMusicByConstitution } from '../data/ai-music.js'

// 注册 Chart.js
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const router = useRouter()

// 状态
const loading = ref(true)
const result = ref(null)
const isPlaying = ref(false)
const audioPlayer = ref(null)
const rating = ref(0)
const feedbackSubmitted = ref(false)
const showFeedback = ref(false)
const musicType = ref('traditional') // 'traditional' 或 'ai'

// 当前播放的音乐信息
const currentMusic = computed(() => {
  if (!result.value) return null
  
  if (musicType.value === 'ai') {
    return getAIMusicByConstitution(result.value.primary.key)
  } else {
    const track = result.value.primary.constitution.tracks[0]
    return {
      title: track?.title,
      src: track?.src,
      description: result.value.primary.constitution.musicDesc,
      tone: result.value.primary.constitution.toneName
    }
  }
})

// 切换音乐类型时停止播放
watch(musicType, () => {
  if (audioPlayer.value) {
    audioPlayer.value.pause()
    isPlaying.value = false
  }
})

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
  if (!result.value) return { labels: [], datasets: [] }
  
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

// 初始化
onMounted(() => {
  // 模拟AI分析加载
  setTimeout(() => {
    calculateResult()
    loading.value = false
  }, 2500)
})

// 计算结果
const calculateResult = () => {
  const answersStr = localStorage.getItem('wuyin_answers')
  const version = localStorage.getItem('wuyin_question_version')
  
  if (!answersStr) {
    router.push('/assessment')
    return
  }
  
  const answers = JSON.parse(answersStr)
  const questions = version === 'vip' ? QUESTIONS_VIP : QUESTIONS_FREE
  
  result.value = getFullAssessment(answers, questions)
  
  // 保存体质历史记录
  const historyRecord = {
    date: new Date().toISOString(),
    constitutionKey: result.value.primary.key,
    constitutionName: result.value.primary.constitution.name,
    toneName: result.value.primary.constitution.toneName,
    traditionalMusic: result.value.primary.constitution.tracks[0],
    aiMusic: getAIMusicByConstitution(result.value.primary.key),
    version: version
  }
  
  // 获取历史记录
  const history = JSON.parse(localStorage.getItem('wuyin_history') || '[]')
  history.unshift(historyRecord) // 添加到开头
  // 最多保存20条
  if (history.length > 20) history.pop()
  localStorage.setItem('wuyin_history', JSON.stringify(history))
  
  // 保存当前体质（供首页使用）
  localStorage.setItem('wuyin_current_constitution', JSON.stringify(historyRecord))
}

// 播放控制
const togglePlay = () => {
  if (!audioPlayer.value) return
  
  if (isPlaying.value) {
    audioPlayer.value.pause()
  } else {
    audioPlayer.value.play().catch(e => console.error('Playback failed', e))
  }
  isPlaying.value = !isPlaying.value
}

// 播放结束
const onAudioEnded = () => {
  isPlaying.value = false
  showFeedback.value = true
}

// 提交反馈
const submitFeedback = () => {
  // 保存反馈
  const feedback = {
    constitution: result.value.primary.key,
    rating: rating.value,
    timestamp: new Date().toISOString()
  }
  const history = JSON.parse(localStorage.getItem('wuyin_feedback') || '[]')
  history.push(feedback)
  localStorage.setItem('wuyin_feedback', JSON.stringify(history))
  
  feedbackSubmitted.value = true
  setTimeout(() => {
    showFeedback.value = false
  }, 2000)
}
</script>

<template>
  <div class="min-h-screen bg-paper">
    <!-- AI分析加载 -->
    <div v-if="loading" class="min-h-screen flex flex-col items-center justify-center p-6 text-center">
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

        <!-- 雷达图 -->
        <section class="card p-6 animate-fade-in-up" style="animation-delay: 0.1s">
          <h3 class="font-serif font-bold text-lg text-ink mb-4 text-center">体质全景分析</h3>
          <div class="h-64">
            <Radar :data="chartData" :options="chartOptions" />
          </div>
          <p class="text-xs text-center text-ink-light mt-4">越向外扩张，说明该体质特征越明显</p>
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
                @click="musicType = 'ai'"
                class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all"
                :class="musicType === 'ai' ? 'bg-white text-ink shadow-sm' : 'text-ink-light'"
              >
                <Sparkles class="w-4 h-4" />
                AI风格
              </button>
            </div>
            
            <p class="text-sm text-ink-light mb-4 leading-relaxed">
              {{ musicType === 'ai' ? currentMusic?.description : result.primary.constitution.musicDesc }}
            </p>

            <!-- 播放器 -->
            <div class="relative rounded-xl overflow-hidden transition-all duration-500">
              <!-- 动态渐变背景：传统=墨绿，AI=深空灰 -->
              <div 
                class="absolute inset-0 bg-gradient-to-br transition-all duration-500"
                :class="musicType === 'ai' 
                  ? 'from-slate-700 via-slate-800 to-slate-900' 
                  : 'from-emerald-800 via-teal-800 to-teal-900'"
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
            </div>

            <audio 
              ref="audioPlayer" 
              :src="currentMusic?.src"
              @ended="onAudioEnded"
              preload="auto"
            ></audio>
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
        <div v-if="!feedbackSubmitted">
          <h3 class="font-serif font-bold text-lg text-ink text-center mb-4">疗效反馈</h3>
          
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
          
          <p class="text-sm text-ink-light text-center mb-6">您对本次音乐疗愈的体验如何？</p>
          
          <div class="flex gap-3">
            <button @click="showFeedback = false" class="btn-secondary flex-1">跳过</button>
            <button @click="submitFeedback" :disabled="rating === 0" class="btn-primary flex-1" :class="rating === 0 && 'opacity-50'">提交</button>
          </div>
        </div>
        
        <div v-else class="text-center py-4">
          <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-jade/10 flex items-center justify-center">
            <Star class="w-6 h-6 text-jade" />
          </div>
          <p class="font-serif font-bold text-ink">感谢您的反馈！</p>
        </div>
      </div>
    </div>
  </div>
</template>
