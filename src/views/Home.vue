<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Music, BookOpen, Activity, Sparkles, ChevronRight, Crown, Play, Pause, History, Eye, Camera, Lock, Trash2 } from 'lucide-vue-next'

const router = useRouter()
const isVip = ref(false)
const currentConstitution = ref(null)
const history = ref([])
const isPlaying = ref(false)
const audioPlayer = ref(null)
const musicType = ref('traditional')

// 初始化
onMounted(() => {
  // 检查VIP状态
  isVip.value = localStorage.getItem('wuyin_vip') === 'true'
  
  // 获取当前体质
  const saved = localStorage.getItem('wuyin_current_constitution')
  if (saved) {
    currentConstitution.value = JSON.parse(saved)
  }
  
  // 获取历史记录
  const historyData = localStorage.getItem('wuyin_history')
  if (historyData) {
    history.value = JSON.parse(historyData)
  }
})

const toggleVip = () => {
  isVip.value = !isVip.value
  localStorage.setItem('wuyin_vip', isVip.value.toString())
}

// 当前音乐
const currentMusic = computed(() => {
  if (!currentConstitution.value) return null
  return musicType.value === 'ai' 
    ? currentConstitution.value.aiMusic 
    : currentConstitution.value.traditionalMusic
})

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

// 格式化日期
const formatDate = (isoString) => {
  const date = new Date(isoString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 删除确认弹窗状态
const showDeleteModal = ref(false)
const deleteTargetIndex = ref(null)

// 打开删除确认弹窗
const openDeleteModal = (index) => {
  deleteTargetIndex.value = index
  showDeleteModal.value = true
}

// 确认删除
const confirmDelete = () => {
  const index = deleteTargetIndex.value
  if (index === null) return
  
  history.value.splice(index, 1)
  localStorage.setItem('wuyin_history', JSON.stringify(history.value))
  
  // 如果删除的是当前体质，更新为下一条
  if (index === 0) {
    if (history.value.length > 0) {
      currentConstitution.value = history.value[0]
      localStorage.setItem('wuyin_current_constitution', JSON.stringify(history.value[0]))
    } else {
      currentConstitution.value = null
      localStorage.removeItem('wuyin_current_constitution')
    }
  }
  
  // 关闭弹窗
  showDeleteModal.value = false
  deleteTargetIndex.value = null
}

// 取消删除
const cancelDelete = () => {
  showDeleteModal.value = false
  deleteTargetIndex.value = null
}
</script>

<template>
  <div class="min-h-screen bg-paper relative overflow-hidden">
    <!-- 水墨背景装饰 -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cinnabar/5 to-transparent rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-jade/5 to-transparent rounded-full blur-3xl"></div>
    </div>

    <div class="relative z-10 max-w-lg mx-auto px-6 py-12">
      <!-- 头部 -->
      <header class="text-center mb-10 animate-fade-in-up">
        <!-- VIP 标识 -->
        <button 
          @click="toggleVip"
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all mb-6"
          :class="isVip ? 'bg-gradient-to-r from-gold to-gold-light text-ink shadow-lg' : 'bg-white text-ink-light border border-ink-light/20'"
        >
          <Crown class="w-4 h-4" :class="isVip ? 'text-ink' : 'text-ink-light'" />
          {{ isVip ? 'VIP会员' : '免费版' }}
        </button>

        <!-- Logo & 标题 -->
        <div class="mb-4">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cinnabar to-cinnabar-dark flex items-center justify-center shadow-xl animate-pulse-glow">
            <Music class="w-10 h-10 text-white" />
          </div>
          <h1 class="text-4xl font-serif font-bold text-ink mb-2">五音疗·AI</h1>
          <p class="text-ink-light">基于《黄帝内经》的智能音乐调理</p>
        </div>
      </header>

      <!-- 五音理论简介卡片 -->
      <section class="card p-6 mb-6 animate-fade-in-up" style="animation-delay: 0.1s">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 rounded-full bg-jade/10 flex items-center justify-center">
            <BookOpen class="w-6 h-6 text-jade" />
          </div>
          <div class="flex-1">
            <h2 class="font-serif font-bold text-lg text-ink mb-2">五音疗法简介</h2>
            <p class="text-ink-light text-sm leading-relaxed mb-3">
              《黄帝内经》提出五音与五行、五脏、五志相应，通过聆听对应音调，可调节情绪、平衡脏腑功能。
            </p>
            <router-link 
              to="/theory" 
              class="inline-flex items-center text-cinnabar text-sm font-medium hover:underline"
            >
              了解更多 <ChevronRight class="w-4 h-4 ml-1" />
            </router-link>
          </div>
        </div>
      </section>

      <!-- 功能入口 -->
      <section class="grid grid-cols-3 gap-3 mb-6 animate-fade-in-up" style="animation-delay: 0.15s">
        <!-- 体质测评 -->
        <button 
          @click="router.push('/assessment')"
          class="card p-4 text-center group"
        >
          <div class="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-cinnabar to-cinnabar-dark flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Activity class="w-6 h-6 text-white" />
          </div>
          <div class="font-medium text-ink text-sm">体质测评</div>
          <div class="text-xs text-ink-light">{{ isVip ? '67题' : '27题' }}</div>
        </button>

        <!-- 舌诊 VIP -->
        <button 
          @click="isVip ? router.push('/tongue') : null"
          class="card p-4 text-center group relative"
          :class="!isVip && 'opacity-60'"
        >
          <div v-if="!isVip" class="absolute top-2 right-2">
            <Lock class="w-3 h-3 text-gold" />
          </div>
          <div class="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-jade to-jade-light flex items-center justify-center shadow-lg" :class="isVip && 'group-hover:scale-105 transition-transform'">
            <Eye class="w-6 h-6 text-white" />
          </div>
          <div class="font-medium text-ink text-sm">舌诊</div>
          <div class="text-xs text-ink-light">{{ isVip ? 'VIP' : '🔒VIP' }}</div>
        </button>

        <!-- 面诊 VIP -->
        <button 
          @click="isVip ? router.push('/face') : null"
          class="card p-4 text-center group relative"
          :class="!isVip && 'opacity-60'"
        >
          <div v-if="!isVip" class="absolute top-2 right-2">
            <Lock class="w-3 h-3 text-gold" />
          </div>
          <div class="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-lg" :class="isVip && 'group-hover:scale-105 transition-transform'">
            <Camera class="w-6 h-6 text-white" />
          </div>
          <div class="font-medium text-ink text-sm">面诊</div>
          <div class="text-xs text-ink-light">{{ isVip ? 'VIP' : '🔒VIP' }}</div>
        </button>
      </section>

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
            @click="musicType = 'ai'"
            class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all"
            :class="musicType === 'ai' ? 'bg-white text-ink shadow-sm' : 'text-ink-light'"
          >
            <Sparkles class="w-4 h-4" />
            AI风格
          </button>
        </div>

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
              class="relative w-12 h-12 rounded-full bg-gradient-to-br from-paper to-paper/90 text-ink flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              <!-- 播放时的呼吸光环 -->
              <div 
                v-if="isPlaying" 
                class="absolute inset-0 rounded-full animate-ping"
                :class="musicType === 'ai' ? 'bg-sky-400/25' : 'bg-gold/25'"
              ></div>
              <Pause v-if="isPlaying" class="w-5 h-5 relative z-10" />
              <Play v-else class="w-5 h-5 ml-0.5 relative z-10" />
            </button>
            
            <div class="flex-1 min-w-0">
              <div class="font-bold truncate text-paper">{{ currentMusic?.title }}</div>
              <div class="text-xs text-paper/70">{{ currentConstitution.toneName }}调 · {{ musicType === 'ai' ? 'AI合成' : '传统古曲' }}</div>
            </div>
            
            <!-- 装饰符号 -->
            <div class="text-paper/20 text-2xl">{{ musicType === 'ai' ? '✦' : '♪' }}</div>
          </div>
        </div>

        <audio 
          ref="audioPlayer" 
          :src="currentMusic?.src"
          @ended="isPlaying = false"
          preload="auto"
        ></audio>
      </section>

      <!-- 无体质记录提示 -->
      <section v-else class="card p-6 mb-6 text-center animate-fade-in-up" style="animation-delay: 0.2s">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-ink/5 flex items-center justify-center">
          <Music class="w-8 h-8 text-ink-light" />
        </div>
        <p class="text-ink-light mb-4">完成体质测评，获取专属音乐推荐</p>
        <button @click="router.push('/assessment')" class="btn-primary">
          开始测评
        </button>
      </section>

      <!-- 体质历史 -->
      <section class="card p-6 mb-6 animate-fade-in-up" style="animation-delay: 0.25s">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <History class="w-5 h-5 text-jade" />
            <h2 class="font-serif font-bold text-lg text-ink">{{ isVip ? '体质历史' : '当前体质' }}</h2>
          </div>
        </div>

        <template v-if="history.length > 0">
          <!-- 免费用户只显示最近一条 -->
          <div v-if="!isVip" class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-ink/5 rounded-lg">
              <div>
                <div class="font-medium text-ink">{{ history[0].constitutionName }}</div>
                <div class="text-xs text-ink-light">{{ formatDate(history[0].date) }} · {{ history[0].toneName }}音</div>
              </div>
              <div class="text-2xl">{{ history[0].toneName === '宫' ? '🎵' : history[0].toneName === '商' ? '🎶' : history[0].toneName === '角' ? '🎼' : history[0].toneName === '徵' ? '🎹' : '🎻' }}</div>
            </div>
            <div class="flex items-center gap-2 p-3 bg-gold/10 border border-gold/20 rounded-lg">
              <Lock class="w-4 h-4 text-gold" />
              <span class="text-sm text-ink">升级VIP查看完整历史记录</span>
              <button @click="toggleVip" class="ml-auto text-xs font-medium text-gold">开通</button>
            </div>
          </div>

          <!-- VIP用户显示全部历史 -->
          <div v-else class="space-y-2 max-h-48 overflow-y-auto">
            <div 
              v-for="(record, index) in history" 
              :key="index"
              class="flex items-center justify-between p-3 rounded-lg transition-colors group"
              :class="index === 0 ? 'bg-cinnabar/5 border border-cinnabar/20' : 'bg-ink/5 hover:bg-ink/10'"
            >
              <div class="flex-1">
                <div class="font-medium text-ink">
                  {{ record.constitutionName }}
                  <span v-if="index === 0" class="text-xs text-cinnabar ml-1">当前</span>
                </div>
                <div class="text-xs text-ink-light">{{ formatDate(record.date) }} · {{ record.toneName }}音</div>
              </div>
              <div class="flex items-center gap-2">
                <div class="text-xl">{{ record.toneName === '宫' ? '🎵' : record.toneName === '商' ? '🎶' : record.toneName === '角' ? '🎼' : record.toneName === '徵' ? '🎹' : '🎻' }}</div>
                <button 
                  @click="openDeleteModal(index)"
                  class="p-1.5 rounded-lg text-ink-light hover:text-cinnabar hover:bg-cinnabar/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="删除此记录"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="text-center py-4 text-ink-light">
          暂无测评记录
        </div>
      </section>

      <!-- VIP升级提示 -->
      <div v-if="!isVip" class="card p-4 bg-gradient-to-r from-gold/10 to-gold-light/10 border border-gold/20 animate-fade-in-up" style="animation-delay: 0.3s">
        <div class="flex items-center gap-3">
          <Crown class="w-8 h-8 text-gold" />
          <div class="flex-1">
            <p class="font-medium text-ink text-sm">升级VIP，解锁完整功能</p>
            <p class="text-ink-light text-xs">67题标准版 · AI舌诊面诊 · 完整历史</p>
          </div>
          <button @click="toggleVip" class="btn-primary text-sm px-4 py-2">
            开通
          </button>
        </div>
      </div>

      <!-- 底部 -->
      <footer class="text-center mt-12 text-xs text-ink-light/60">
        <p>本应用仅供参考，不作为医疗诊断依据</p>
        <p class="mt-1">© 2026 五音疗·AI</p>
      </footer>
    </div>

    <!-- 删除确认弹窗 -->
    <div 
      v-if="showDeleteModal" 
      class="fixed inset-0 z-50 flex items-center justify-center p-6"
      @click.self="cancelDelete"
    >
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-ink/60 backdrop-blur-sm"></div>
      
      <!-- 弹窗内容 -->
      <div class="relative bg-paper rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up">
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-cinnabar/10 flex items-center justify-center">
            <Trash2 class="w-8 h-8 text-cinnabar" />
          </div>
          <h3 class="text-lg font-serif font-bold text-ink mb-2">确认删除</h3>
          <p class="text-ink-light text-sm">确定要删除这条体质测评记录吗？此操作无法撤销。</p>
        </div>
        
        <div class="flex gap-3">
          <button 
            @click="cancelDelete"
            class="flex-1 py-3 px-4 rounded-xl border border-ink/20 text-ink font-medium hover:bg-ink/5 transition-colors"
          >
            取消
          </button>
          <button 
            @click="confirmDelete"
            class="flex-1 py-3 px-4 rounded-xl bg-cinnabar text-white font-medium hover:bg-cinnabar-dark transition-colors"
          >
            确认删除
          </button>
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
