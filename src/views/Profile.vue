<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { History, Crown, Settings, ChevronRight, ChevronDown, ChevronUp, Trash2, LogOut, UserCircle, Lock, ClipboardCheck, Database } from 'lucide-vue-next'
import ConstitutionTrendChart from '../components/ConstitutionTrendChart.vue'

const router = useRouter()
const isVip = ref(false)
const history = ref([])
const showAllHistory = ref(false)

const displayedHistory = computed(() => {
  if (showAllHistory.value) return history.value
  return history.value.slice(0, 3)
})

// Mock 用户数据
const user = ref({
  name: '中医爱好者',
  avatar: '', // 既然没有实际图片，使用 UserCircle 图标
  days: 0    // 坚持天数 (Calculated)
})

// 删除确认弹窗
const showDeleteModal = ref(false)
const deleteTargetIndex = ref(null)
const showExportModal = ref(false)
const showClearHistoryModal = ref(false)

onMounted(() => {
  // 演示模式：URL包含 ?demo=1 时自动解锁VIP
  const isDemoMode = location.search.includes('demo=1')
  isVip.value = isDemoMode || localStorage.getItem('wuyin_vip') === 'true'

  const historyData = localStorage.getItem('wuyin_history')
  if (historyData) {
    history.value = JSON.parse(historyData)
    
    // Calculate persisted days (unique dates in history)
    const uniqueDates = new Set(history.value.map(item => {
        const d = new Date(item.date)
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }))
    user.value.days = uniqueDates.size || 1 // At least 1 day if they have history, or default 0/1
    if (uniqueDates.size === 0 && history.value.length > 0) user.value.days = 1
    if (history.value.length === 0) user.value.days = 0 
  }
})

// 展开状态
const expandedIndex = ref(null)

const toggleExpand = (index) => {
  if (expandedIndex.value === index) {
    expandedIndex.value = null
  } else {
    expandedIndex.value = index
  }
}

const confirmExport = () => {
    const exportObj = {
        title: '五音疗AI-科研数据导出',
        exportDate: new Date().toISOString(),
        user: user.value,
        vip: isVip.value,
        research: JSON.parse(localStorage.getItem('wuyin_research') || 'null'),
        history: JSON.parse(localStorage.getItem('wuyin_history') || '[]'),
        feedback: JSON.parse(localStorage.getItem('wuyin_feedback') || '[]')
    }

    const fileName = `wuyin_research_data_${new Date().toISOString().split('T')[0]}.json`
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showExportModal.value = false
}

const exportData = () => {
    showExportModal.value = true
}

const handleLogout = () => {
    if (confirm('退出登录将清除本地缓存的所有数据（相当于重置应用）。确定要退出吗？')) {
        localStorage.clear()
        location.reload()
    }
}

// 格式化日期
const formatDate = (isoString) => {
  const date = new Date(isoString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const openDeleteModal = (index) => {
  deleteTargetIndex.value = index
  showDeleteModal.value = true
}

const confirmDelete = () => {
  if (deleteTargetIndex.value === null) return
  history.value.splice(deleteTargetIndex.value, 1)
  localStorage.setItem('wuyin_history', JSON.stringify(history.value))
  
  // 如果删除了第一条，需更新 Current Constitution (虽 Profile 不负责播放，但保持数据一致性)
  if (deleteTargetIndex.value === 0) {
    if (history.value.length > 0) {
      localStorage.setItem('wuyin_current_constitution', JSON.stringify(history.value[0]))
    } else {
      localStorage.removeItem('wuyin_current_constitution')
    }
  }
  showDeleteModal.value = false
  deleteTargetIndex.value = null
}

const confirmClearHistory = () => {
    history.value = []
    localStorage.removeItem('wuyin_history')
    localStorage.removeItem('wuyin_current_constitution')
    localStorage.removeItem('wuyin_daily_usage')
    localStorage.removeItem('wuyin_feedback')
    localStorage.removeItem('wuyin_answers')
    localStorage.removeItem('wuyin_research')
    showClearHistoryModal.value = false
}

const updateRating = (index, rating) => {
  const record = history.value[index]
  if (!record.feedback) record.feedback = {}
  record.feedback.rating = rating
  
  // Persist
  localStorage.setItem('wuyin_history', JSON.stringify(history.value))
}
</script>

<template>
  <div class="min-h-screen bg-paper pb-20">
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4 border-b border-ink/5 flex justify-between items-center">
      <h1 class="font-serif font-bold text-xl text-ink">个人中心</h1>
      <button class="p-2 -mr-2 text-ink-light hover:text-ink hover:bg-ink/5 rounded-full transition-colors">
        <Settings class="w-5 h-5" />
      </button>
    </header>

    <main class="p-6 space-y-6 animate-fade-in-up">
      <!-- 用户信息卡片 -->
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-ink/10 flex items-center justify-center text-ink-light">
          <UserCircle class="w-12 h-12" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h2 class="font-bold text-xl text-ink">{{ user.name }}</h2>
            <span v-if="isVip" class="text-xs bg-gold/10 text-gold-dark px-1.5 py-0.5 rounded border border-gold/20">VIP</span>
          </div>
          <div class="text-sm text-ink-light">已坚持调理 {{ user.days }} 天</div>
        </div>
      </div>

      <!-- 科研体验官入口 -->
      <section 
        @click="router.push('/research')"
        class="card p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 cursor-pointer active:scale-95 transition-transform group"
      >
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
            <ClipboardCheck class="w-6 h-6 text-white" />
            </div>
            <div class="flex-1">
            <h3 class="font-bold text-ink flex items-center gap-2">
                成为科研体验官
                <span class="text-[10px] bg-red-500 text-white px-1.5 rounded-full animate-pulse">招募中</span>
            </h3>
            <p class="text-xs text-ink-light mt-0.5">完成7天体验，获赠 VIP 会员及荣誉证书</p>
            </div>
            <div class="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center group-hover:bg-white transition-colors">
                <ChevronRight class="w-5 h-5 text-indigo-400" />
            </div>
        </div>
      </section>

      <!-- 设置列表 -->
      <div class="bg-white rounded-xl shadow-sm border border-ink/5 overflow-hidden">
        <div class="p-4 flex items-center justify-between border-b border-ink/5 hover:bg-ink/5 transition-colors cursor-pointer" @click="exportData">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Database class="w-5 h-5" />
            </div>
            <span class="font-medium text-ink">导出科研数据</span>
          </div>
          <ChevronRight class="w-5 h-5 text-ink-light" />
        </div>

        <div class="p-4 flex items-center justify-between border-b border-ink/5 hover:bg-ink/5 transition-colors cursor-pointer">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-jade/10 flex items-center justify-center text-jade"><Settings class="w-4 h-4" /></div>
            <span class="text-sm font-medium text-ink">账号设置</span>
          </div>
          <ChevronRight class="w-4 h-4 text-ink-light" />
        </div>
         <!-- 仅作UI展示 -->
        <div class="p-4 flex items-center justify-between hover:bg-ink/5 transition-colors cursor-pointer text-cinnabar" @click="handleLogout">
          <div class="flex items-center gap-3">
            <LogOut class="w-5 h-5" />
            <span class="font-bold">退出登录</span>
          </div>
        </div>
      </div>
      
      <!-- 趋势图 (VIP) -->
      <section v-if="history.length >= 2 || !isVip" class="card p-6 animate-fade-in-up relative overflow-hidden">
        <div class="flex items-center justify-between mb-4 relative z-10">
            <div class="flex items-center gap-2">
                <History class="w-5 h-5 text-gold" />
                <h2 class="font-serif font-bold text-lg text-ink">体质变化趋势</h2>
            </div>
            <span v-if="!isVip" class="text-xs bg-ink/5 text-ink-light px-2 py-1 rounded-full flex items-center gap-1">
                <Lock class="w-3 h-3" /> VIP可见
            </span>
        </div>
        
        <div class="relative">
            <div :class="{ 'blur-sm opacity-50 pointer-events-none select-none': !isVip }">
                 <ConstitutionTrendChart :history="history.length >= 2 ? history : []" />
                 <!-- Placeholder if not enough history but VIP (handled by v-if above somewhat, but if isVip and history<2, section hidden. If !isVip, we show this even if history<2? No, let's stick to history logic or mock data for lock view) -->
                 <!-- Actually, for !isVip, we should show a mock chart or just the blur overlay on empty/mock data to entice them? -->
                 <!-- Let's simpler: If !isVip, show blurred container saying 'Upgrade to see trends' -->
                 <div v-if="!isVip && history.length < 2" class="h-48 bg-ink/5 rounded-lg flex items-center justify-center text-ink-light">
                    <!-- Mock chart visual or just text -->
                 </div>
            </div>

            <!-- VIP Lock Overlay -->
            <div v-if="!isVip" class="absolute inset-0 flex flex-col items-center justify-center z-20">
              <div class="w-12 h-12 rounded-full bg-ink/80 flex items-center justify-center mb-2 shadow-lg">
                <Crown class="w-6 h-6 text-gold" />
              </div>
              <p class="font-serif font-bold text-ink mb-1">解锁体质趋势分析</p>
              <p class="text-xs text-ink-light mb-4">升级 VIP 查看您的长期调理效果</p>
            </div>
        </div>
      </section>

      <!-- 历史列表 -->
      <section v-if="history.length > 0" class="card p-6 animate-fade-in-up" style="animation-delay: 0.1s">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <History class="w-5 h-5 text-jade" />
            <h2 class="font-serif font-bold text-lg text-ink select-none">测评记录</h2>
          </div>

          
          <button 
             @click="showClearHistoryModal = true"
             class="text-xs bg-ink/5 hover:bg-cinnabar/10 text-ink hover:text-cinnabar px-2 py-1 rounded transition-colors ml-2"
          >
             清空记录
          </button>
        </div>
        
        <!-- Retest Frequency Tip -->
        <p class="text-xs text-ink-light/60 mb-4 px-1">
            建议每 7-14 天进行一次体质复测，以及时调整调理方案。
        </p>

        <!-- 列表 -->
        <div class="space-y-3">
        <div class="space-y-3">
           <div 
              v-for="(record, index) in displayedHistory" 
              :key="index"
              class="rounded-lg transition-all group bg-ink/5 hover:bg-ink/10 overflow-hidden"
            >
              <!-- 列表头（点击展开） -->
              <div 
                @click="toggleExpand(index)"
                class="p-3 flex items-center justify-between cursor-pointer"
              >
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-ink">{{ record.constitutionName }}</span>
                        <span class="text-xs bg-ink/10 px-1.5 py-0.5 rounded text-ink-light">{{ record.toneName }}音</span>
                        <span class="text-xs text-ink-light ml-2">{{ formatDate(record.date) }}</span>
                    </div>
                     <div class="text-xs text-ink-light mt-1 flex items-center justify-between">
                        <!-- 显示乐曲信息 -->
                         <div class="flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full" :class="record.toneName === '宫' ? 'bg-gold' : 'bg-jade'"></span>
                            <span>{{ record.traditionalMusic?.title || '未知曲目' }}</span>
                         </div>
                         <!-- 评分与时长展示 (Collapsed State) -->
                         <div class="flex items-center gap-3">
                            <span v-if="record.feedback?.listenDuration" class="text-[10px] text-ink-light/50 font-mono">
                                {{ Math.floor(record.feedback.listenDuration/60) }}:{{ (record.feedback.listenDuration%60).toString().padStart(2, '0') }}
                            </span>
                            <div v-if="record.feedback?.rating" class="flex items-center text-gold text-xs">
                                <span class="mr-0.5">★</span>{{ record.feedback.rating }}
                            </div>
                         </div>
                    </div>
                </div>
                
                <div class="flex items-center gap-3">
                   <!-- 展开指示器 -->
                   <ChevronRight 
                     class="w-4 h-4 text-ink-light transition-transform duration-300"
                     :class="expandedIndex === index ? 'rotate-90' : ''"
                   />
                </div>
              </div>

              <!-- 展开详情 -->
              <div 
                v-if="expandedIndex === index" 
                class="px-3 pb-3 pt-0 border-t border-ink/5 animate-fade-in"
              >
                 <div class="mt-3 flex items-center justify-between">
                    <div class="text-xs text-ink-light space-y-1">
                        <div v-if="record.feedback?.musicType">
                            偏好：{{ record.feedback.musicType === 'ai' ? 'AI风格' : '传统古曲' }}
                        </div>
                         <div v-if="record.feedback?.listenDuration">
                            时长：{{ Math.floor(record.feedback.listenDuration/60) }}分{{ (record.feedback.listenDuration%60).toString().padStart(2, '0') }}秒
                        </div>
                    </div>
                    
                    <!-- 评分与删除 -->
                    <div class="flex flex-col items-end gap-2">
                         <div class="flex items-center gap-0.5">
                            <button 
                              v-for="star in 5" 
                              :key="star"
                              @click.stop="updateRating(index, star)"
                              class="focus:outline-none transition-transform hover:scale-110"
                            >
                              <span :class="(record.feedback?.rating || 0) >= star ? 'text-gold' : 'text-ink/10'">★</span>
                            </button>
                          </div>
                          
                          <button 
                            @click.stop="openDeleteModal(index)"
                            class="text-xs text-cinnabar flex items-center gap-1 hover:underline opacity-80 hover:opacity-100"
                          >
                            <Trash2 class="w-3 h-3" /> 删除记录
                          </button>
                    </div>
                 </div>
              </div>
          </div>
          </div>
        </div>
        
        <!-- 展开/收起按钮 -->
        <div v-if="history.length > 3" class="mt-4 text-center">
            <button 
                @click="showAllHistory = !showAllHistory" 
                class="inline-flex items-center gap-1 text-sm text-ink-light hover:text-ink transition-colors pb-1 border-b border-transparent hover:border-ink/20"
            >
                <span>{{ showAllHistory ? '收起记录' : '查看更多历史记录' }}</span>
                <component :is="showAllHistory ? ChevronUp : ChevronDown" class="w-4 h-4" />
            </button>
        </div>
      </section>
      
      <div v-else class="text-center py-10 text-ink-light">
        <p>暂无测评记录</p>
        <button @click="router.push('/diagnosis')" class="mt-4 text-cinnabar text-sm hover:underline">去进行第一次问诊</button>
      </div>
    </main>

    <!-- 删除确认弹窗 -->
    <div 
      v-if="showDeleteModal" 
      class="fixed inset-0 z-[60] flex items-center justify-center p-6"
      @click.self="showDeleteModal = false"
    >
      <div class="absolute inset-0 bg-ink/60 backdrop-blur-sm"></div>
      <div class="relative bg-paper rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up">
        <h3 class="text-lg font-serif font-bold text-ink mb-2 text-center">确认删除</h3>
        <p class="text-center text-ink-light mb-6">确定要删除这条记录吗？</p>
        <div class="flex gap-3">
          <button @click="showDeleteModal = false" class="flex-1 py-3 border rounded-xl">取消</button>
          <button @click="confirmDelete" class="flex-1 py-3 bg-cinnabar text-white rounded-xl">删除</button>
        </div>
      </div>
    </div>

    <!-- 导出确认弹窗 -->
    <div 
      v-if="showExportModal" 
      class="fixed inset-0 z-[60] flex items-center justify-center p-6"
      @click.self="showExportModal = false"
    >
      <div class="absolute inset-0 bg-ink/60 backdrop-blur-sm"></div>
      <div class="relative bg-paper rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up">
        <h3 class="text-lg font-serif font-bold text-ink mb-2 text-center">导出科研数据</h3>
        <p class="text-center text-ink-light mb-6 text-sm">
          确认导出吗？<br>这将生成一个包含您所有测评与科研记录的 JSON 文件。请将此文件发送给研究人员。
        </p>
        <div class="flex gap-3">
          <button @click="showExportModal = false" class="flex-1 py-3 border rounded-xl">取消</button>
          <button @click="confirmExport" class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">确认导出</button>
        </div>
      </div>
    </div>

    <!-- 清空历史确认弹窗 -->
    <div 
      v-if="showClearHistoryModal" 
      class="fixed inset-0 z-[60] flex items-center justify-center p-6"
      @click.self="showClearHistoryModal = false"
    >
      <div class="absolute inset-0 bg-ink/60 backdrop-blur-sm"></div>
      <div class="relative bg-paper rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up">
        <h3 class="text-lg font-serif font-bold text-ink mb-2 text-center">确认清空所有数据</h3>
        <div class="text-center text-ink-light mb-6 text-sm space-y-1">
            <p>确定要清空所有数据吗？这将删除：</p>
            <ul class="list-disc list-inside text-left inline-block opacity-80 mt-2">
                <li>所有测评历史记录</li>
                <li>首页今日推荐及打卡进度</li>
                <li>测试结果页面的分析数据</li>
            </ul>
            <p class="mt-2 text-cinnabar font-bold">此操作不可恢复！</p>
        </div>
        <div class="flex gap-3">
          <button @click="showClearHistoryModal = false" class="flex-1 py-3 border rounded-xl">取消</button>
          <button @click="confirmClearHistory" class="flex-1 py-3 bg-cinnabar text-white rounded-xl">全部清空</button>
        </div>
      </div>
    </div>


  </div>
</template>
