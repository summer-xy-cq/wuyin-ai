<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { Activity, Eye, Camera, Lock, ChevronRight, Crown, FileText, X, CheckCircle2 } from 'lucide-vue-next'
import { CONSTITUTIONS } from '../data/constitutions.js'

const router = useRouter()
const isVip = ref(localStorage.getItem('wuyin_vip') === 'true')

const rotateVip = () => {
  isVip.value = !isVip.value
  localStorage.setItem('wuyin_vip', isVip.value.toString())
  // 简易刷新VIP状态，实际应用应使用Store
  location.reload()
}

// Manual Input Logic
const showManualInputModal = ref(false)
const selectedConstitution = ref('')

const constitutionOptions = Object.entries(CONSTITUTIONS).map(([key, val]) => ({
  key,
  name: val.name,
  desc: val.desc
}))

const submitManualInput = () => {
    if (!selectedConstitution.value) return
    
    const target = CONSTITUTIONS[selectedConstitution.value]
    const record = {
        constitutionKey: selectedConstitution.value,
        constitutionName: target.name,
        toneName: target.toneName, // Include toneName for Home page display
        tone: target.tone,         // Include tone Key
        score: 60, // Default score
        features: target.features, // Ensure these exist or simple fallback
        date: new Date().toISOString(), // Use 'date' to match Result.vue format
        tracks: target.tracks,          // Required for Home.vue player
        traditionalMusic: target.tracks[0], // Required for Profile.vue display
        isManual: true
    }
    
    // Save current
    localStorage.setItem('wuyin_current_constitution', JSON.stringify(record))
    
    // Save history
    const history = JSON.parse(localStorage.getItem('wuyin_history') || '[]')
    history.unshift(record)
    localStorage.setItem('wuyin_history', JSON.stringify(history))
    
    showManualInputModal.value = false
    router.push('/result')
}

</script>

<template>
  <div class="min-h-screen bg-paper pb-20">
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4 border-b border-ink/5">
      <h1 class="font-serif font-bold text-xl text-ink">功能与诊断</h1>
    </header>

    <main class="p-6 space-y-6 animate-fade-in-up">
      <!-- VIP 状态卡片 -->
      <div class="card p-4 bg-gradient-to-r from-gold/10 to-gold-light/10 border border-gold/20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
            <Crown class="w-5 h-5 text-gold-dark" />
          </div>
          <div>
            <div class="font-bold text-ink text-sm">当前身份：{{ isVip ? 'VIP会员' : '免费用户' }}</div>
            <div class="text-xs text-ink-light">{{ isVip ? '已解锁全部高级诊疗功能' : '升级解锁AI面诊与舌诊' }}</div>
          </div>
        </div>
        <button 
          @click="rotateVip"
          class="px-3 py-1.5 bg-white text-gold-dark text-xs font-bold rounded-lg shadow-sm border border-gold/30 hover:scale-105 transition-transform"
        >
          {{ isVip ? '续费' : '升级' }}
        </button>
      </div>

      <!-- 功能网格 -->
      <div class="grid grid-cols-1 gap-4">
        <!-- 问诊 (核心功能) -->
        <button 
          @click="router.push('/assessment')"
          class="card p-6 flex items-center gap-4 group hover:border-cinnabar/30 transition-all text-left"
        >
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-cinnabar to-cinnabar-dark flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Activity class="w-8 h-8 text-white" />
          </div>
          <div class="flex-1">
            <h3 class="font-serif font-bold text-lg text-ink mb-1 group-hover:text-cinnabar transition-colors">问诊</h3>
            <p class="text-sm text-ink-light leading-relaxed">
              {{ isVip ? '基于国家标准 GB/T 46939-2025 问卷，深度解析全景体质。' : '基于国家标准 GB/T 46939-2025 问卷，快速解析您的中医体质类型。' }}
            </p>
          </div>
          <ChevronRight class="w-5 h-5 text-ink-light group-hover:text-cinnabar" />
        </button>

        <!-- 手动录入 (已有报告) -->
        <button 
          @click="showManualInputModal = true"
          class="card p-4 flex items-center gap-4 group hover:bg-ink/5 transition-all text-left border-dashed border-2 border-ink/10 box-border"
        >
          <div class="w-12 h-12 rounded-xl bg-ink/5 flex items-center justify-center group-hover:bg-white transition-colors">
            <FileText class="w-6 h-6 text-ink-light" />
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-ink mb-0.5">已有体质报告？</h3>
            <p class="text-xs text-ink-light leading-relaxed">
              跳过问卷，直接录入诊断结果。
            </p>
          </div>
          <ChevronRight class="w-4 h-4 text-ink-light" />
        </button>

        <!-- 舌诊 -->
        <button 
          @click="isVip ? router.push('/tongue') : null"
          class="card p-6 flex items-center gap-4 group text-left relative overflow-hidden"
          :class="!isVip && 'opacity-80 grayscale-[0.5]'"
        >
          <div v-if="!isVip" class="absolute top-4 right-4 z-10">
            <Lock class="w-4 h-4 text-gold" />
          </div>
          
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-jade to-jade-light flex items-center justify-center shadow-lg" :class="isVip && 'group-hover:scale-105 transition-transform'">
            <Eye class="w-8 h-8 text-white" />
          </div>
          <div class="flex-1">
            <h3 class="font-serif font-bold text-lg text-ink mb-1">AI 舌诊</h3>
            <p class="text-sm text-ink-light">拍摄舌象，AI自动分析舌质舌苔，辅助辨证。</p>
          </div>
          <ChevronRight v-if="isVip" class="w-5 h-5 text-ink-light" />
          <span v-else class="text-xs text-gold font-bold border border-gold/30 px-2 py-1 rounded bg-gold/5">VIP</span>
        </button>

        <!-- 面诊 -->
        <button 
          @click="isVip ? router.push('/face') : null"
          class="card p-6 flex items-center gap-4 group text-left relative overflow-hidden"
          :class="!isVip && 'opacity-80 grayscale-[0.5]'"
        >
          <div v-if="!isVip" class="absolute top-4 right-4 z-10">
            <Lock class="w-4 h-4 text-gold" />
          </div>

          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-lg" :class="isVip && 'group-hover:scale-105 transition-transform'">
            <Camera class="w-8 h-8 text-white" />
          </div>
          <div class="flex-1">
            <h3 class="font-serif font-bold text-lg text-ink mb-1">AI 面诊</h3>
            <p class="text-sm text-ink-light">面部分析，通过气色光泽判断脏腑健康状态。</p>
          </div>
          <ChevronRight v-if="isVip" class="w-5 h-5 text-ink-light" />
          <span v-else class="text-xs text-gold font-bold border border-gold/30 px-2 py-1 rounded bg-gold/5">VIP</span>
        </button>
      </div>

      
      <!-- Manual Input Modal -->
      <div v-if="showManualInputModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
        <div class="bg-paper rounded-2xl w-full max-w-sm h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
            <!-- Header -->
            <div class="p-4 border-b border-ink/5 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
                <h3 class="font-serif font-bold text-lg text-ink">选择体质类型</h3>
                <button @click="showManualInputModal = false" class="p-2 -mr-2 text-ink-light hover:text-ink">
                    <X class="w-5 h-5" />
                </button>
            </div>
            
            <!-- List -->
            <div class="flex-1 overflow-y-auto p-4 space-y-3">
                <button 
                    v-for="opt in constitutionOptions" 
                    :key="opt.key"
                    @click="selectedConstitution = opt.key"
                    class="w-full card p-4 flex items-center gap-3 transition-all border-2"
                    :class="selectedConstitution === opt.key ? 'border-cinnabar bg-cinnabar/5' : 'border-transparent hover:border-ink/10'"
                >
                    <div class="flex-1 text-left">
                        <div class="font-serif font-bold text-ink" :class="selectedConstitution === opt.key && 'text-cinnabar'">{{ opt.name }}</div>
                        <div class="text-xs text-ink-light line-clamp-1">{{ opt.desc }}</div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        :class="selectedConstitution === opt.key ? 'border-cinnabar bg-cinnabar' : 'border-ink/20'"
                    >
                        <CheckCircle2 v-if="selectedConstitution === opt.key" class="w-3.5 h-3.5 text-white" />
                    </div>
                </button>
            </div>
            
            <!-- Footer -->
            <div class="p-4 border-t border-ink/5 bg-white z-10">
                <button 
                    @click="submitManualInput"
                    :disabled="!selectedConstitution"
                    class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    确认生成方案
                </button>
            </div>
        </div>
      </div>
    </main>
  </div>
</template>
