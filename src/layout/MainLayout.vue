<script setup>
import { useRoute, useRouter } from 'vue-router'
import { Home, Activity, FileText, User } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const tabs = [
  { name: 'Home', label: '首页', icon: Home, path: '/home' },
  { name: 'Diagnosis', label: '体质测评', icon: Activity, path: '/diagnosis' },
  { name: 'ResultTab', label: '测试结果', icon: FileText, path: '/result-tab' },
  { name: 'Profile', label: '我的', icon: User, path: '/profile' }
]

const navigate = (path) => {
  router.push(path)
}

const isActive = (path) => route.path.startsWith(path)
</script>

<template>
  <div class="flex flex-col min-h-screen bg-paper">
    <!-- 主内容区 -->
    <main class="flex-1 pb-20">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <keep-alive include="Home,Result">
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </main>

    <!-- 底栏 TabBar -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-ink/5 pt-1 pb-safe shadow-lg z-50">
      <div class="max-w-lg mx-auto flex justify-around items-center h-14">
        <button 
          v-for="tab in tabs" 
          :key="tab.name"
          @click="navigate(tab.path)"
          class="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative"
          :class="isActive(tab.path) ? 'text-cinnabar' : 'text-ink-light hover:text-ink'"
        >
          <component 
            :is="tab.icon" 
            class="w-6 h-6 transition-transform duration-300"
            :class="isActive(tab.path) && 'scale-110'"
            :stroke-width="isActive(tab.path) ? 2.5 : 2"
          />
          <span class="text-[10px] font-medium">{{ tab.label }}</span>
          
          <!-- 激活指示点 -->
          <div 
            v-if="isActive(tab.path)" 
            class="absolute -top-1 w-1 h-1 rounded-full bg-cinnabar"
          ></div>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 16px);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
