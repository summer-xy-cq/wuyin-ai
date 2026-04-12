<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Play, Square, RotateCcw, Save, Check, Music2, Clock, Zap, Heart, Type } from 'lucide-vue-next'
import { toneGenerator, TONE_FREQUENCIES, PENTATONIC_SCALES, CONSTITUTION_TONE_MAP } from '../utils/toneGenerator.js'
import { FIVE_TONES } from '../data/constitutions.js'

const router = useRouter()
const route = useRoute()

// ============================================================
// 一、参数状态
// ============================================================

const selectedTone = ref('gong')   // 宫/商/角/徵/羽
const selectedMood = ref('舒展')   // 平静/舒展/热烈
const selectedRhythm = ref('natural') // slow/natural/active
const selectedDuration = ref(300)  // 秒：300(5min) / 600(10min) / 900(15min)
const volume = ref(0.5)

const isPlaying = ref(false)
const playingProgress = ref(0)
const savedCompositions = ref([])
const showSaved = ref(false)
const justSaved = ref(false)
const progressInterval = ref(null)

// 填词模式
const lyricsMode = ref(false)           // 是否为填词模式
const lyrics = ref('')                 // 用户输入的歌词
const lyricsHighlightIndex = ref(-1)    // 当前高亮的字符索引
const lyricsInterval = ref(null)        // 歌词同步定时器

// ============================================================
// 二、接收体质参数，自动预填
// ============================================================
const fromConstitution = ref(false)
const recommendedTone = ref('gong')  // 推荐的音调（不随用户切换而变）

onMounted(() => {
  const constitutionKey = route.query.constitution
  if (constitutionKey) {
    fromConstitution.value = true
    const toneKey = CONSTITUTION_TONE_MAP[constitutionKey] || 'gong'
    recommendedTone.value = toneKey
    selectedTone.value = toneKey
    selectedDuration.value = 600
    selectedMood.value = '舒展'
  }
})

onUnmounted(() => {
  if (lyricsInterval.value) clearInterval(lyricsInterval.value)
  toneGenerator.stop()
})

// ============================================================
// 三、参数映射配置
// ============================================================

const moodOptions = [
  { label: '平静', value: '平静', rhythm: 'slow', density: 0.35, warmth: 0.45, timbre: 'guqin', desc: '舒缓深沉，适合入睡' },
  { label: '舒展', value: '舒展', rhythm: 'natural', density: 0.55, warmth: 0.55, timbre: 'guqin', desc: '自然流畅，平衡身心' },
  { label: '热烈', value: '热烈', rhythm: 'active', density: 0.75, warmth: 0.7, timbre: 'guzheng', desc: '明快活跃，振奋精神' }
]

const durationOptions = [
  { label: '5分钟', value: 300 },
  { label: '10分钟', value: 600 },
  { label: '15分钟', value: 900 }
]

const currentMoodConfig = computed(() =>
  moodOptions.find(m => m.value === selectedMood.value) || moodOptions[1]
)

// ============================================================
// 四、歌词解析（将歌词拆成字符数组）
// ============================================================
const lyricsChars = computed(() => {
  const text = lyrics.value.trim()
  if (!text) return []
  // 按字符拆分，保留标点和空格作为独立元素
  return text.split('')
})

// ============================================================
// 五、播放控制
// ============================================================

const playParams = computed(() => ({
  timbre: currentMoodConfig.value.timbre,
  rhythm: currentMoodConfig.value.rhythm,
  density: currentMoodConfig.value.density,
  warmth: currentMoodConfig.value.warmth,
  reverbWet: 0.3
}))

// 启动歌词同步定时器
const startLyricsSync = () => {
  if (lyricsInterval.value) clearInterval(lyricsInterval.value)
  lyricsHighlightIndex.value = -1

  const chars = lyricsChars.value
  if (chars.length === 0) return

  // 每200ms检查当前音符索引，同步歌词
  lyricsInterval.value = setInterval(() => {
    const noteIndex = toneGenerator.getCurrentNoteIndex()
    if (noteIndex >= 0 && noteIndex < chars.length) {
      lyricsHighlightIndex.value = noteIndex
    }
    if (!toneGenerator.isPlaying) {
      lyricsHighlightIndex.value = -1
      clearInterval(lyricsInterval.value)
    }
  }, 150)
}

const play = () => {
  if (isPlaying.value) {
    stop()
    return
  }

  toneGenerator.init()
  toneGenerator.setVolume(volume.value)
  toneGenerator.playMelody(selectedTone.value, selectedDuration.value, playParams.value)
  isPlaying.value = true
  lyricsHighlightIndex.value = -1

  // 启动歌词同步（填词模式）
  if (lyricsMode.value && lyricsChars.value.length > 0) {
    startLyricsSync()
  }

  // 进度更新
  const startTime = Date.now()
  progressInterval.value = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000
    playingProgress.value = Math.min(elapsed / selectedDuration.value * 100, 100)
    if (elapsed >= selectedDuration.value) {
      stop()
    }
  }, 200)
}

const stop = () => {
  toneGenerator.stop()
  isPlaying.value = false
  playingProgress.value = 0
  lyricsHighlightIndex.value = -1
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
    progressInterval.value = null
  }
  if (lyricsInterval.value) {
    clearInterval(lyricsInterval.value)
    lyricsInterval.value = null
  }
}

const regenerate = () => {
  stop()
  setTimeout(play, 100)
}

// 填词模式下切换模式时停止播放
const toggleLyricsMode = () => {
  if (isPlaying.value) stop()
  lyricsMode.value = !lyricsMode.value
}

// ============================================================
// 六、保存作品
// ============================================================

// 加载已有作品
const loadSaved = () => {
  const saved = localStorage.getItem('wuyin_compositions')
  savedCompositions.value = saved ? JSON.parse(saved) : []
}

loadSaved()

const saveComposition = () => {
  const composition = {
    id: Date.now().toString(36),
    tone: selectedTone.value,
    mood: selectedMood.value,
    rhythm: selectedRhythm.value,
    duration: selectedDuration.value,
    createdAt: new Date().toISOString(),
    // 填词模式
    lyricsMode: lyricsMode.value,
    lyrics: lyricsMode.value ? lyrics.value : '',
    // 音调元信息
    toneName: TONE_FREQUENCIES[selectedTone.value]?.name || '宫',
    organName: TONE_FREQUENCIES[selectedTone.value]?.organ || '脾',
    elementName: TONE_FREQUENCIES[selectedTone.value]?.element || '土',
    moodLabel: currentMoodConfig.value.label
  }

  savedCompositions.value.unshift(composition)
  localStorage.setItem('wuyin_compositions', JSON.stringify(savedCompositions.value))

  justSaved.value = true
  setTimeout(() => { justSaved.value = false }, 2000)
}

const loadComposition = (comp) => {
  stop()
  selectedTone.value = comp.tone
  selectedMood.value = comp.mood
  selectedRhythm.value = comp.rhythm
  selectedDuration.value = comp.duration
  lyricsMode.value = comp.lyricsMode || false
  lyrics.value = comp.lyrics || ''
  showSaved.value = false
}

const deleteComposition = (id, event) => {
  event.stopPropagation()
  savedCompositions.value = savedCompositions.value.filter(c => c.id !== id)
  localStorage.setItem('wuyin_compositions', JSON.stringify(savedCompositions.value))
}

const formatDate = (iso) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const durationLabel = computed(() => {
  const s = selectedDuration.value
  return s === 300 ? '5' : s === 600 ? '10' : '15'
})

// ============================================================
// 七、选中样式
// ============================================================

const toneOptions = Object.entries(TONE_FREQUENCIES).map(([key, val]) => ({
  key,
  ...val
}))

const getToneColor = (key) => {
  const colors = {
    gong: '#D4AF37',
    shang: '#9CA3AF',
    jiao: '#2D6A4F',
    zhi: '#A63434',
    yu: '#1E3A5F'
  }
  return colors[key] || '#D4AF37'
}
</script>

<template>
  <div class="min-h-screen bg-paper pb-10">
    <!-- 头部 -->
    <header class="sticky top-0 z-50 bg-paper/90 backdrop-blur border-b border-ink/5 px-6 py-4 max-w-lg mx-auto">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="router.push('/')" class="p-2 -ml-2 rounded-full hover:bg-ink/5 transition-colors">
            <ArrowLeft class="w-5 h-5 text-ink" />
          </button>
          <div>
            <h1 class="font-serif font-bold text-lg text-ink">五音创作</h1>
            <p class="text-xs text-ink-light">谱写你的专属音调</p>
          </div>
        </div>
        <button @click="showSaved = !showSaved" class="text-xs text-cinnabar font-medium">
          {{ showSaved ? '返回创作' : `我的作品(${savedCompositions.length})` }}
        </button>
      </div>
    </header>

    <!-- ====================================================== -->
    <!-- 创作界面 -->
    <!-- ====================================================== -->
    <main v-if="!showSaved" class="p-6 space-y-6 max-w-lg mx-auto">

      <!-- 已保存提示 -->
      <div v-if="justSaved" class="bg-jade/10 border border-jade/30 rounded-xl p-3 flex items-center gap-3">
        <Check class="w-4 h-4 text-jade shrink-0" />
        <span class="text-sm text-jade font-medium">作品已保存到个人曲库</span>
      </div>

      <!-- 进度条 -->
      <div v-if="isPlaying" class="space-y-2">
        <div class="flex justify-between text-xs text-ink-light">
          <span>正在播放...</span>
          <span>{{ Math.round(playingProgress) }}%</span>
        </div>
        <div class="h-1.5 bg-ink/10 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-cinnabar to-cinnabar-light rounded-full transition-all"
               :style="{ width: playingProgress + '%' }"></div>
        </div>
      </div>

      <!-- 体质推荐提示（仅从结果页跳转时显示） -->
      <div v-if="fromConstitution" class="p-3 rounded-xl bg-jade/10 border border-jade/20">
        <div class="text-xs text-jade font-medium mb-1">
          根据您的体质推荐 · {{ TONE_FREQUENCIES[recommendedTone]?.name }}音
        </div>
        <div class="text-xs text-ink-light">
          {{ TONE_FREQUENCIES[recommendedTone]?.description }}，当然也可以自由选择其他音调进行探索
        </div>
      </div>

      <!-- 模式切换：纯旋律 / 填词 -->
      <section class="animate-fade-in-up">
        <div class="flex bg-ink/5 rounded-xl p-1">
          <button
            @click="toggleLyricsMode"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all"
            :class="!lyricsMode ? 'bg-white text-ink shadow-sm' : 'text-ink-light'"
          >
            <Music2 class="w-4 h-4" />
            {{ lyricsMode ? '纯旋律' : '纯旋律' }}
          </button>
          <button
            @click="toggleLyricsMode"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all"
            :class="lyricsMode ? 'bg-white text-ink shadow-sm' : 'text-ink-light'"
          >
            <Type class="w-4 h-4" />
            {{ lyricsMode ? '填词模式' : '填词模式' }}
          </button>
        </div>
        <p class="text-xs text-ink-light mt-2 text-center">
          {{ lyricsMode ? '写下你的歌词，播放时逐字高亮同步' : '选择音调与情绪，系统生成专属五音旋律' }}
        </p>
      </section>

      <!-- 第一步：选择主音调 -->
      <section class="animate-fade-in-up">
        <div class="flex items-center gap-2 mb-3">
          <Music2 class="w-4 h-4 text-cinnabar" />
          <h2 class="font-serif font-bold text-ink">选择主音调</h2>
          <span class="text-xs text-ink-light">宫商角徵羽</span>
        </div>

        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="tone in toneOptions"
            :key="tone.key"
            @click="selectedTone = tone.key"
            class="aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border-2"
            :style="{
              background: selectedTone === tone.key
                ? `linear-gradient(135deg, ${getToneColor(tone.key)}22, ${getToneColor(tone.key)}44)`
                : 'white',
              borderColor: selectedTone === tone.key ? getToneColor(tone.key) : 'transparent',
              boxShadow: selectedTone === tone.key ? `0 0 12px ${getToneColor(tone.key)}33` : 'none'
            }"
          >
            <span class="text-2xl font-serif font-bold"
                  :style="{ color: getToneColor(tone.key) }">{{ tone.name }}</span>
            <span class="text-[9px] mt-0.5"
                  :class="selectedTone === tone.key ? 'text-ink' : 'text-ink-light'">{{ tone.organ }}脏</span>
          </button>
        </div>

        <!-- 音调说明 -->
        <div class="mt-3 p-3 bg-ink/5 rounded-xl text-xs text-ink-light leading-relaxed">
          <strong class="text-ink">{{ TONE_FREQUENCIES[selectedTone]?.name }}音·{{ TONE_FREQUENCIES[selectedTone]?.organ }}脏</strong>
          {{ TONE_FREQUENCIES[selectedTone]?.description }}
        </div>

        <!-- 填词模式：歌词输入 -->
        <div v-if="lyricsMode" class="mt-3">
          <div class="text-xs font-medium text-ink mb-2 flex items-center gap-1">
            <Type class="w-3.5 h-3.5 text-cinnabar" />
            写下你的歌词
            <span class="text-ink-light ml-1">（每个字对应一个音符）</span>
          </div>
          <textarea
            v-model="lyrics"
            placeholder="例如：天地玄黄 宇宙洪荒 日月盈昃 辰宿列张"
            class="w-full h-28 p-3 rounded-xl bg-white border-2 border-ink/10 text-sm text-ink leading-relaxed resize-none focus:outline-none focus:border-cinnabar/50 transition-colors placeholder:text-ink-light/40"
            :disabled="isPlaying"
          ></textarea>
          <div class="text-xs text-ink-light mt-1 text-right">
            {{ lyricsChars.length }} 字 / {{ Math.max(1, Math.round(lyricsChars.length / 2)) }} 秒预估
          </div>
        </div>
      </section>

      <!-- 第二步：选择情绪基调 -->
      <section class="animate-fade-in-up" style="animation-delay: 0.1s">
        <div class="flex items-center gap-2 mb-3">
          <Heart class="w-4 h-4 text-cinnabar" />
          <h2 class="font-serif font-bold text-ink">选择情绪基调</h2>
          <span class="text-xs text-ink-light">决定节奏与音色</span>
        </div>

        <div class="space-y-2">
          <button
            v-for="mood in moodOptions"
            :key="mood.value"
            @click="selectedMood = mood.value"
            class="w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between"
            :class="selectedMood === mood.value
              ? 'border-cinnabar bg-cinnabar/5'
              : 'border-ink/10 bg-white hover:border-ink/20'"
          >
            <div class="text-left">
              <div class="font-bold text-ink">{{ mood.label }}</div>
              <div class="text-xs text-ink-light mt-0.5">{{ mood.desc }}</div>
            </div>
            <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                 :class="selectedMood === mood.value
                   ? 'border-cinnabar bg-cinnabar'
                   : 'border-ink/20'">
              <div v-if="selectedMood === mood.value" class="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </button>
        </div>
      </section>

      <!-- 第三步：选择时长 -->
      <section class="animate-fade-in-up" style="animation-delay: 0.2s">
        <div class="flex items-center gap-2 mb-3">
          <Clock class="w-4 h-4 text-cinnabar" />
          <h2 class="font-serif font-bold text-ink">选择聆听时长</h2>
          <span class="text-xs text-ink-light">建议每日15分钟</span>
        </div>

        <div class="flex gap-3">
          <button
            v-for="opt in durationOptions"
            :key="opt.value"
            @click="selectedDuration = opt.value"
            class="flex-1 py-3 rounded-xl border-2 transition-all font-medium text-center"
            :class="selectedDuration === opt.value
              ? 'border-cinnabar bg-cinnabar/5 text-cinnabar'
              : 'border-ink/10 bg-white text-ink-light hover:border-ink/20'"
          >
            {{ opt.label }}
          </button>
        </div>
      </section>

      <!-- 第四步：音量 -->
      <section class="animate-fade-in-up" style="animation-delay: 0.25s">
        <div class="flex items-center gap-2 mb-3">
          <Zap class="w-4 h-4 text-cinnabar" />
          <h2 class="font-serif font-bold text-ink">音量</h2>
        </div>

        <div class="flex items-center gap-4">
          <span class="text-xs text-ink-light">轻柔</span>
          <input
            type="range"
            v-model="volume"
            min="0.1"
            max="0.8"
            step="0.05"
            class="flex-1 accent-cinnabar"
          />
          <span class="text-xs text-ink-light">洪亮</span>
        </div>
      </section>

      <!-- 播放控制 -->
      <section class="animate-fade-in-up pt-2" style="animation-delay: 0.3s">
        <!-- 歌词展示区（填词模式下播放时显示） -->
        <div v-if="lyricsMode && lyricsChars.length > 0 && isPlaying" class="mb-4">
          <div class="p-4 rounded-2xl bg-ink text-paper text-center leading-loose select-none">
            <span
              v-for="(char, i) in lyricsChars"
              :key="i"
              class="inline-block px-0.5 text-lg font-serif transition-all duration-150"
              :class="i <= lyricsHighlightIndex
                ? i === lyricsHighlightIndex
                  ? 'text-gold font-bold scale-110'
                  : 'text-paper/60'
                : 'text-paper/30'"
            >{{ char }}</span>
          </div>
        </div>

        <!-- 歌词提示（填词模式未播放时） -->
        <div v-else-if="lyricsMode && lyricsChars.length > 0 && !isPlaying" class="mb-4 p-4 rounded-2xl bg-ink/5 text-center">
          <p class="text-xs text-ink-light">点击播放，歌词将逐字高亮同步</p>
        </div>

        <!-- 实时参数预览 -->
        <div class="text-center text-xs text-ink-light mb-4">
          将播放
          <strong class="text-ink">{{ TONE_FREQUENCIES[selectedTone]?.name }}音</strong>
          +
          <strong class="text-ink">{{ currentMoodConfig.label }}</strong>
          +
          {{ durationLabel }}分钟
          {{ lyricsMode && lyricsChars.length > 0 ? `${lyricsChars.length}字歌词` : '五音旋律' }}
        </div>

        <div class="flex gap-3">
          <!-- 主播放按钮 -->
          <button
            @click="play"
            class="flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg"
            :class="isPlaying
              ? 'bg-ink text-white shadow-none'
              : 'bg-gradient-to-r from-cinnabar to-cinnabar-dark text-white hover:scale-[1.02] active:scale-95'"
          >
            <Square v-if="isPlaying" class="w-5 h-5" />
            <Play v-else class="w-5 h-5" />
            <span class="font-bold">{{ isPlaying ? '停止' : '▶ 播放' }}</span>
          </button>

          <!-- 重新生成 -->
          <button
            v-if="isPlaying"
            @click="regenerate"
            class="px-5 py-4 rounded-2xl bg-ink/10 text-ink hover:bg-ink/20 transition-all"
            title="重新生成"
          >
            <RotateCcw class="w-5 h-5" />
          </button>

          <!-- 保存 -->
          <button
            v-if="!isPlaying"
            @click="saveComposition"
            class="px-5 py-4 rounded-2xl border-2 border-ink/10 bg-white text-ink hover:border-cinnabar hover:text-cinnabar transition-all"
            title="保存到我的曲库"
          >
            <Save class="w-5 h-5" />
          </button>
        </div>
      </section>

      <!-- 五声音阶可视化 -->
      <section class="animate-fade-in-up" style="animation-delay: 0.35s">
        <div class="card p-4">
          <h3 class="font-serif font-bold text-ink text-sm mb-3">当前音阶</h3>
          <div class="flex items-end justify-center gap-1 h-16">
            <div
              v-for="(freq, i) in PENTATONIC_SCALES[selectedTone]"
              :key="i"
              class="w-8 rounded-t-lg transition-all duration-500"
              :style="{
                height: `${(i + 1) * 20}%`,
                background: `linear-gradient(to top, ${getToneColor(selectedTone)}, ${getToneColor(selectedTone)}88)`
              }"
            ></div>
          </div>
          <div class="flex justify-around mt-2 text-[9px] text-ink-light">
            <span v-for="(freq, i) in PENTATONIC_SCALES[selectedTone]" :key="i">
              {{ Math.round(freq) }}Hz
            </span>
          </div>
        </div>
      </section>

    </main>

    <!-- ====================================================== -->
    <!-- 我的作品列表 -->
    <!-- ====================================================== -->
    <main v-else class="p-6 space-y-3 max-w-lg mx-auto animate-fade-in-up">

      <div class="text-sm text-ink-light mb-2">
        已保存 {{ savedCompositions.length }} 首作品
      </div>

      <div v-if="savedCompositions.length === 0" class="text-center py-16 text-ink-light">
        <Music2 class="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p class="text-sm">还没有创作作品</p>
        <p class="text-xs mt-1">创作并保存后，这里会显示你的作品</p>
      </div>

      <div
        v-for="comp in savedCompositions"
        :key="comp.id"
        @click="loadComposition(comp)"
        class="card p-4 cursor-pointer hover:scale-[1.01] active:scale-100 transition-transform"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
              :style="{ background: getToneColor(comp.tone) + '22' }"
            >
              <span class="text-lg font-serif font-bold" :style="{ color: getToneColor(comp.tone) }">
                {{ comp.toneName }}
              </span>
            </div>
            <div>
              <div class="font-bold text-ink">{{ comp.toneName }}音 · {{ comp.moodLabel }}</div>
              <div class="text-xs text-ink-light mt-0.5">
                {{ comp.organName }}脏 · {{ comp.elementName }}行 · {{ comp.duration / 60 }}分钟
                <span v-if="comp.lyricsMode && comp.lyrics" class="text-cinnabar ml-1">· 含歌词</span>
              </div>
              <!-- 歌词预览（如果有） -->
              <div v-if="comp.lyricsMode && comp.lyrics" class="text-[10px] text-ink-light/60 mt-0.5 truncate max-w-[200px]">
                "{{ comp.lyrics.substring(0, 20) }}{{ comp.lyrics.length > 20 ? '...' : '' }}"
              </div>
              <div class="text-[10px] text-ink-light/50 mt-1">{{ formatDate(comp.createdAt) }}</div>
            </div>
          </div>
          <button
            @click="deleteComposition(comp.id, $event)"
            class="p-1 text-ink-light/40 hover:text-cinnabar transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
input[type="range"] {
  -webkit-appearance: none;
  height: 4px;
  background: #2A262215;
  border-radius: 2px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #A63434;
  cursor: pointer;
}
</style>
