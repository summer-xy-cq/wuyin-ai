<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ChevronRight, ChevronLeft, Crown } from 'lucide-vue-next'
import { QUESTIONS_FREE, OPTIONS } from '../data/questions-free.js'

const router = useRouter()

// VIP状态
const isVip = ref(localStorage.getItem('wuyin_vip') === 'true')

// 使用的问卷
const questions = computed(() => QUESTIONS_FREE)

// 当前题目索引
const currentIndex = ref(0)
const currentQuestion = computed(() => questions.value[currentIndex.value])

// 用户答案
const answers = ref({})

// 进度
const progress = computed(() => ((currentIndex.value + 1) / questions.value.length) * 100)

// 是否已回答当前题目
const hasAnswered = computed(() => answers.value[currentQuestion.value?.id] !== undefined)

// 初始化时读取本地存储的答案
onMounted(() => {
  const saved = localStorage.getItem('wuyin_answers_temp')
  if (saved) {
    try {
      answers.value = JSON.parse(saved)
    } catch (e) {
      answers.value = {}
    }
  }
})

// 选择答案
const selectAnswer = (value) => {
  answers.value[currentQuestion.value.id] = value
  // 保存临时答案
  localStorage.setItem('wuyin_answers_temp', JSON.stringify(answers.value))
}

// 下一题
const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  }
}

// 上一题
const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

// 提交
const submit = () => {
  // 保存最终答案
  localStorage.setItem('wuyin_answers', JSON.stringify(answers.value))
  localStorage.setItem('wuyin_question_version', isVip.value ? 'vip' : 'free')
  // 清除临时答案
  localStorage.removeItem('wuyin_answers_temp')
  // 跳转到结果页
  router.push('/result')
}

// 检查是否全部回答
const allAnswered = computed(() => {
  return questions.value.every(q => answers.value[q.id] !== undefined)
})
</script>

<template>
  <div class="min-h-screen bg-paper flex flex-col">
    <!-- 头部导航 -->
    <header class="sticky top-0 z-50 bg-paper/80 backdrop-blur-lg border-b border-ink/5">
      <div class="max-w-lg mx-auto px-6 py-4">
        <div class="flex items-center justify-between mb-3">
          <button @click="router.push('/')" class="p-2 -ml-2 rounded-full hover:bg-ink/5 transition-colors">
            <ArrowLeft class="w-5 h-5 text-ink" />
          </button>
          <div class="flex items-center gap-2">
            <Crown v-if="isVip" class="w-4 h-4 text-gold" />
            <span class="font-serif font-bold text-ink">问诊</span>
            <span class="text-xs text-ink-light">(27题)</span>
          </div>
          <div class="w-9"></div>
        </div>
        
        <!-- 进度条 -->
        <div class="h-1.5 bg-ink/10 rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-cinnabar to-cinnabar-light rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-ink-light">
          <span>第 {{ currentIndex + 1 }} 题</span>
          <span>共 {{ questions.length }} 题</span>
        </div>
      </div>
    </header>

    <!-- 问题区域 -->
    <main class="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">
      <!-- 7天建议提示 -->
      <div class="mb-6 p-3 bg-ink/5 rounded-lg flex items-center gap-2 text-xs text-ink-light justify-center">
        <span>📅</span>
        <span>建议每7天进行一次复测，以动态调整调理方案。</span>
      </div>

      <div class="flex-1 flex flex-col justify-center animate-fade-in-up" :key="currentIndex">
        <!-- 问题文本 -->
        <div class="text-center mb-10">
          <p class="text-2xl font-serif font-medium text-ink leading-relaxed">
            {{ currentQuestion?.text }}
          </p>
        </div>

        <!-- 选项 -->
        <div class="space-y-3">
          <button
            v-for="option in OPTIONS"
            :key="option.value"
            @click="selectAnswer(option.value)"
            class="w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4"
            :class="answers[currentQuestion?.id] === option.value 
              ? 'border-cinnabar bg-cinnabar/5 text-cinnabar' 
              : 'border-ink/10 bg-white hover:border-cinnabar/30'"
          >
            <span 
              class="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium text-sm transition-all"
              :class="answers[currentQuestion?.id] === option.value 
                ? 'border-cinnabar bg-cinnabar text-white' 
                : 'border-ink/20 text-ink-light'"
            >
              {{ option.value }}
            </span>
            <span class="font-medium" :class="answers[currentQuestion?.id] === option.value ? 'text-cinnabar' : 'text-ink'">
              {{ option.label }}
            </span>
          </button>
        </div>
      </div>

      <!-- 导航按钮 -->
      <div class="flex items-center justify-between gap-4 mt-8">
        <button
          @click="prevQuestion"
          :disabled="currentIndex === 0"
          class="flex items-center gap-2 px-6 py-3 rounded-full border border-ink/20 text-ink-light transition-all"
          :class="currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:border-ink/40'"
        >
          <ChevronLeft class="w-5 h-5" />
          上一题
        </button>

        <button
          v-if="currentIndex < questions.length - 1"
          @click="nextQuestion"
          :disabled="!hasAnswered"
          class="flex items-center gap-2 px-6 py-3 rounded-full transition-all"
          :class="hasAnswered 
            ? 'btn-primary' 
            : 'bg-ink/10 text-ink-light cursor-not-allowed'"
        >
          下一题
          <ChevronRight class="w-5 h-5" />
        </button>

        <button
          v-else
          @click="submit"
          :disabled="!allAnswered"
          class="flex items-center gap-2 px-8 py-3 rounded-full transition-all"
          :class="allAnswered 
            ? 'btn-primary' 
            : 'bg-ink/10 text-ink-light cursor-not-allowed'"
        >
          提交测评
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
      
      <!-- 权威背书 -->
      <p class="text-[10px] text-center text-ink-light/50 font-serif mt-8 pb-4">
        依据国家标准 GB/T 46939-2025《中医体质分类与判定》制定
      </p>
    </main>
  </div>
</template>
