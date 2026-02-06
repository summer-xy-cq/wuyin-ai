<script setup>
import { useRouter } from 'vue-router'
import { ArrowLeft, Music } from 'lucide-vue-next'
import { FIVE_TONES } from '../data/constitutions.js'

const router = useRouter()

const tones = Object.values(FIVE_TONES)
</script>

<template>
  <div class="min-h-screen bg-paper">
    <!-- 头部导航 -->
    <header class="sticky top-0 z-50 bg-paper/80 backdrop-blur-lg border-b border-ink/5">
      <div class="max-w-lg mx-auto px-6 py-4 flex items-center gap-4">
        <button @click="router.back()" class="p-2 rounded-full hover:bg-ink/5 transition-colors">
          <ArrowLeft class="w-5 h-5 text-ink" />
        </button>
        <h1 class="font-serif font-bold text-lg text-ink">五音疗法理论</h1>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-6 py-8">
      <!-- 标题区 -->
      <section class="text-center mb-10 animate-fade-in-up">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cinnabar to-cinnabar-dark flex items-center justify-center shadow-xl">
          <Music class="w-8 h-8 text-white" />
        </div>
        <h2 class="text-2xl font-serif font-bold text-ink mb-3">《黄帝内经》五音疗法</h2>
        <p class="text-ink-light leading-relaxed">
          《黄帝内经》提出五音与五行、五脏、五志相应，<br>
          通过聆听或吟唱对应音调，可调节情绪、平衡脏腑功能，<br>
          适合日常养生与辅助治疗。
        </p>
      </section>

      <!-- 五音卡片 -->
      <section class="space-y-4">
        <div 
          v-for="(tone, index) in tones" 
          :key="tone.name"
          class="card p-6 animate-fade-in-up"
          :style="{ animationDelay: `${0.1 + index * 0.1}s` }"
        >
          <div class="flex items-start gap-4">
            <!-- 五音图标 -->
            <div 
              class="flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg"
              :style="{ background: `linear-gradient(135deg, ${tone.color}, ${tone.color}dd)` }"
            >
              <span class="text-2xl font-serif font-bold">{{ tone.name }}</span>
              <span class="text-xs opacity-80">{{ tone.element }}</span>
            </div>
            
            <!-- 内容 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-serif font-bold text-lg text-ink">{{ tone.name }}音</span>
                <span class="text-xs bg-ink/10 text-ink-light px-2 py-0.5 rounded-full">
                  {{ tone.element }}行 · {{ tone.organ }}脏 · {{ tone.emotion }}志
                </span>
              </div>
              <p class="text-ink-light text-sm leading-relaxed mb-2">
                <strong class="text-ink">{{ tone.feature }}</strong>
              </p>
              <p class="text-ink-light text-sm leading-relaxed">
                {{ tone.description }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 开始测评按钮 -->
      <section class="mt-10 text-center animate-fade-in-up" style="animation-delay: 0.6s">
        <button @click="router.push('/assessment')" class="btn-primary text-lg px-8 py-3">
          开始体质测评
        </button>
        <p class="mt-4 text-xs text-ink-light">了解您的体质，获取专属五音推荐</p>
      </section>
    </main>
  </div>
</template>
