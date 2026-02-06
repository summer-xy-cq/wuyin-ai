<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Camera, Upload, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-vue-next'

const router = useRouter()
const step = ref(1) // 1: 拍照, 2: 分析中, 3: 结果
const analyzing = ref(false)

// 模拟拍照
const captureImage = () => {
  step.value = 2
  analyzing.value = true
  
  // 模拟AI分析
  setTimeout(() => {
    analyzing.value = false
    step.value = 3
  }, 3000)
}

// 重新拍摄
const retake = () => {
  step.value = 1
}
</script>

<template>
  <div class="min-h-screen bg-paper">
    <!-- 头部导航 -->
    <header class="sticky top-0 z-50 bg-paper/80 backdrop-blur-lg border-b border-ink/5">
      <div class="max-w-lg mx-auto px-6 py-4 flex items-center gap-4">
        <button @click="router.back()" class="p-2 rounded-full hover:bg-ink/5 transition-colors">
          <ArrowLeft class="w-5 h-5 text-ink" />
        </button>
        <div class="flex items-center gap-2">
          <Eye class="w-5 h-5 text-jade" />
          <h1 class="font-serif font-bold text-lg text-ink">AI舌诊</h1>
          <span class="text-xs bg-gold/20 text-gold-dark px-2 py-0.5 rounded-full">VIP</span>
        </div>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-6 py-8">
      <!-- 步骤1: 拍照指引 -->
      <div v-if="step === 1" class="animate-fade-in-up">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-serif font-bold text-ink mb-2">舌象拍摄</h2>
          <p class="text-ink-light">请在自然光线下拍摄舌头正面照片</p>
        </div>

        <!-- 拍摄区域 -->
        <div class="relative mb-8">
          <div class="aspect-square bg-ink/5 rounded-3xl border-2 border-dashed border-ink/20 flex flex-col items-center justify-center">
            <div class="w-32 h-32 mb-4 rounded-full bg-jade/10 flex items-center justify-center">
              <Camera class="w-16 h-16 text-jade" />
            </div>
            <p class="text-ink-light text-sm">点击下方按钮开始拍摄</p>
          </div>
          
          <!-- 参考线 -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-40 h-24 border-2 border-jade/30 rounded-full"></div>
          </div>
        </div>

        <!-- 拍摄提示 -->
        <div class="card p-4 mb-6">
          <h3 class="font-medium text-ink mb-3">拍摄要点</h3>
          <ul class="space-y-2 text-sm text-ink-light">
            <li class="flex items-start gap-2">
              <span class="text-jade">✓</span>
              自然光线下拍摄，避免逆光
            </li>
            <li class="flex items-start gap-2">
              <span class="text-jade">✓</span>
              舌头自然伸出，不要过度用力
            </li>
            <li class="flex items-start gap-2">
              <span class="text-jade">✓</span>
              清晨未进食前拍摄效果最佳
            </li>
            <li class="flex items-start gap-2">
              <span class="text-cinnabar">✗</span>
              避免刚喝过有色饮料
            </li>
          </ul>
        </div>

        <button @click="captureImage" class="btn-primary w-full flex items-center justify-center gap-2">
          <Camera class="w-5 h-5" />
          开始拍摄（演示）
        </button>
      </div>

      <!-- 步骤2: AI分析中 -->
      <div v-if="step === 2" class="animate-fade-in-up text-center py-16">
        <div class="relative mb-8">
          <div class="absolute inset-0 bg-jade/20 rounded-full blur-xl animate-pulse"></div>
          <Loader2 class="w-20 h-20 text-jade animate-spin mx-auto relative z-10" />
        </div>
        <h2 class="text-2xl font-serif font-bold text-ink mb-3">AI 正在分析舌象...</h2>
        <p class="text-ink-light animate-pulse">
          识别舌色...<br>
          分析舌苔...<br>
          匹配体质特征...
        </p>
      </div>

      <!-- 步骤3: 分析结果 -->
      <div v-if="step === 3" class="animate-fade-in-up">
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-jade/10 flex items-center justify-center">
            <CheckCircle class="w-8 h-8 text-jade" />
          </div>
          <h2 class="text-2xl font-serif font-bold text-ink mb-2">舌诊结果</h2>
        </div>

        <!-- 结果卡片 -->
        <div class="card p-6 mb-6">
          <div class="flex items-center gap-4 mb-4 pb-4 border-b border-ink/10">
            <div class="w-20 h-20 rounded-xl bg-gradient-to-br from-jade/20 to-jade/5 flex items-center justify-center">
              <span class="text-4xl">👅</span>
            </div>
            <div>
              <div class="text-xs text-ink-light uppercase tracking-wider">舌象类型</div>
              <div class="text-xl font-serif font-bold text-ink">淡红舌 · 薄白苔</div>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-ink-light">舌色</span>
              <span class="text-ink font-medium">淡红（正常）</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-light">舌苔</span>
              <span class="text-ink font-medium">薄白苔</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-light">舌形</span>
              <span class="text-ink font-medium">正常</span>
            </div>
            <div class="flex justify-between">
              <span class="text-ink-light">匹配体质</span>
              <span class="text-jade font-medium">平和质</span>
            </div>
          </div>
        </div>

        <!-- 建议 -->
        <div class="card p-4 bg-jade/5 border border-jade/20 mb-6">
          <div class="flex items-start gap-3">
            <AlertCircle class="w-5 h-5 text-jade flex-shrink-0 mt-0.5" />
            <div>
              <div class="font-medium text-ink text-sm mb-1">舌诊建议</div>
              <p class="text-ink-light text-sm">舌象表现良好，建议继续保持规律作息，结合五音疗法进行日常调理。</p>
            </div>
          </div>
        </div>

        <div class="flex gap-4">
          <button @click="retake" class="btn-secondary flex-1">
            重新拍摄
          </button>
          <button @click="router.push('/')" class="btn-primary flex-1">
            返回首页
          </button>
        </div>

        <p class="text-xs text-center text-ink-light/60 mt-6">
          * 本结果为演示效果，实际功能开发中
        </p>
      </div>
    </main>
  </div>
</template>
