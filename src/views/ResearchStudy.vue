<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ClipboardCheck, CheckCircle2, ChevronRight, Gift, 
  ArrowLeft, Calendar, Award, Star, Activity, ShieldCheck 
} from 'lucide-vue-next'

const router = useRouter()
const step = ref('loading') // intro, consent, baseline, active, end_survey, completed
const researchData = ref({})

// 问卷选型配置
const BASELINE_QUESTIONS = [
  { id: 'sleep', type: 'scale', label: '过去一周，您的整体睡眠质量如何？', min: '非常差', max: '非常好' },
  { id: 'anxiety', type: 'scale', label: '过去一周，您感到焦虑或紧张的程度？', min: '完全不紧张', max: '极度紧张' },
  { id: 'mood', type: 'scale', label: '过去一周，您的整体心情愉悦程度？', min: '非常低落', max: '非常愉悦' },
  { id: 'stress', type: 'multi', label: '您当前最主要的压力来源是什么？', options: ['工作', '学业', '人际关系', '经济', '健康', '家庭', '其他'] },
  { id: 'expect', type: 'multi', label: '您希望通过五音疗法改善哪些方面？', options: ['睡眠质量', '减轻焦虑', '提升情绪', '放松减压', '其他'] }
]

const END_QUESTIONS = [
  { id: 'sleep', type: 'scale', label: '现在，您的整体睡眠质量如何？', min: '非常差', max: '非常好' },
  { id: 'anxiety', type: 'scale', label: '现在，您感到焦虑或紧张的程度？', min: '完全不紧张', max: '极度紧张' },
  { id: 'mood', type: 'scale', label: '现在，您的整体心情愉悦程度？', min: '非常低落', max: '非常愉悦' },
  { id: 'improvement', type: 'single', label: '与开始使用前相比，您觉得自己的状态有改善吗？', options: ['有明显改善', '有一些改善', '没什么变化', '反而更差'] },
  { id: 'satisfaction', type: 'single', label: '对产品的整体满意度？', options: ['非常满意', '比较满意', '一般', '不太满意'] },
  { id: 'recommend', type: 'single', label: '您是否愿意推荐给家人朋友？', options: ['非常愿意', '可能会', '不确定', '不愿意'] }
]

// 临时存储问卷答案
const currentAnswers = ref({})

onMounted(() => {
  loadData()
})

const loadData = () => {
  const saved = localStorage.getItem('wuyin_research')
  if (saved) {
    researchData.value = JSON.parse(saved)
    
    // 状态路由
    if (researchData.value.status === 'completed') {
      step.value = 'completed'
    } else if (researchData.value.status === 'active') {
      // 检查是否满7天
      const start = new Date(researchData.value.startDate)
      const now = new Date()
      // 计算天数差，向上取整
      const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 7) {
        step.value = 'end_survey'
      } else {
        step.value = 'active'
      }
    } else {
      step.value = 'intro'
    }
  } else {
    step.value = 'intro'
  }
}

const saveData = () => {
  localStorage.setItem('wuyin_research', JSON.stringify(researchData.value))
}

// 1. 同意书
const agreeConsent = () => {
  researchData.value = {
    status: 'consent_signed',
    startDate: new Date().toISOString(),
    isVip: localStorage.getItem('wuyin_vip') === 'true',
    consent: {
      agreed: true,
      timestamp: new Date().toISOString()
    }
  }
  saveData()
  step.value = 'baseline'
}

// 2. 提交基线
const submitBaseline = () => {
  researchData.value.baseline = { ...currentAnswers.value, timestamp: new Date().toISOString() }
  researchData.value.status = 'active'
  researchData.value.logs = [] // 初始化日志数组
  saveData()
  currentAnswers.value = {}
  step.value = 'active'
}

// 3. 提交结束问卷
const submitEndSurvey = () => {
  researchData.value.endSurvey = { ...currentAnswers.value, timestamp: new Date().toISOString() }
  researchData.value.status = 'completed'
  researchData.value.completedDate = new Date().toISOString()
  
  // 发放奖励
  issueReward()
  
  saveData()
  currentAnswers.value = {}
  step.value = 'completed'
}

const issueReward = () => {
  // 奖励逻辑
  const isVip = localStorage.getItem('wuyin_vip') === 'true'
  
  if (!isVip) {
    // 免费用户 -> 送VIP
    localStorage.setItem('wuyin_vip', 'true')
    // 记录奖励类型
    researchData.value.reward = { type: 'vip_gift', desc: '获赠1个月VIP会员' }
  } else {
    // VIP用户 -> 记录延期（实际后端逻辑这里仅做标记）
    researchData.value.reward = { type: 'vip_extend', desc: 'VIP会员延期1个月 + 专属勋章' }
  }
}

// 辅助计算
const progressDays = computed(() => {
  if (!researchData.value.startDate) return 0
  const start = new Date(researchData.value.startDate)
  const now = new Date()
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return Math.min(7, diff + 1)
})

const progressPercent = computed(() => {
  return (progressDays.value / 7) * 100
})

const userName = computed(() => {
    // 尝试从 Profile 获取，或者默认
    return '五音疗用户'
})

const certificateDate = computed(() => {
    if(!researchData.value.completedDate) return new Date().toLocaleDateString()
    return new Date(researchData.value.completedDate).toLocaleDateString()
})

</script>

<template>
  <div class="min-h-screen bg-paper pb-10">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-paper/90 backdrop-blur border-b border-ink/5 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="router.back()" class="p-1 -ml-2 rounded-full hover:bg-ink/5">
          <ArrowLeft class="w-6 h-6 text-ink" />
        </button>
        <span class="font-serif font-bold text-lg text-ink">科研共建计划</span>
      </div>
    </header>

    <main class="p-6">
      <!-- 1. 介绍页 -->
      <div v-if="step === 'intro'" class="animate-fade-in-up">
        <div class="text-center mb-8 mt-4">
          <div class="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl rotate-3 mb-6">
            <Activity class="w-10 h-10 text-white" />
          </div>
          <h1 class="text-2xl font-serif font-bold text-ink mb-3">五音疗法 · 效能验证计划</h1>
          <p class="text-ink-light text-sm leading-relaxed px-4">
            诚邀您参与为期 7 天的微型临床试验<br>
            帮助我们验证中医音乐疗法改善睡眠与焦虑的实际效果
          </p>
        </div>

        <div class="space-y-4 mb-8">
          <div class="bg-white p-4 rounded-xl border border-ink/5 shadow-sm flex gap-4 items-start">
            <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
               <Calendar class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-ink text-sm mb-1">只需坚持 7 天</h3>
              <p class="text-xs text-ink-light">每日聆听记录，每次15分钟</p>
            </div>
          </div>
          
          <div class="bg-white p-4 rounded-xl border border-ink/5 shadow-sm flex gap-4 items-start">
            <div class="p-2 bg-purple-50 rounded-lg text-purple-600 shrink-0">
               <Gift class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-ink text-sm mb-1">丰厚奖励回报</h3>
              <p class="text-xs text-ink-light">完成即赠 1个月 VIP会员及电子证书</p>
            </div>
          </div>
        </div>

        <!-- 知情同意书摘要 -->
        <div class="bg-ink/5 p-4 rounded-xl text-xs text-ink-light mb-8">
          <h4 class="font-bold text-ink mb-2">知情同意说明：</h4>
          <ul class="list-disc list-inside space-y-1 opacity-80">
            <li>本研究旨在评估五音疗法对身心健康的影响。</li>
            <li>您需要填写前后两份问卷，并连续7天打卡。</li>
            <li>您的数据仅用于统计分析，严格保密。</li>
            <li>您可随时退出计划，不影响正常使用。</li>
          </ul>
        </div>

        <button 
          @click="step = 'consent'"
          class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          我愿意参与
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <!-- 2. 知情同意确认 -->
      <div v-if="step === 'consent'" class="animate-fade-in-up">
        <h2 class="text-2xl font-serif font-bold text-ink mb-6">知情同意书</h2>
        <div class="bg-white p-5 rounded-xl border border-ink/10 shadow-sm text-sm text-ink mb-6 h-96 overflow-y-auto leading-relaxed">
          <p class="font-bold mb-2">尊敬的用户：</p>
          <p class="mb-4">您好！我们邀请您参与一项关于“五音疗法对睡眠与情绪改善作用”的观察性研究。</p>
          
          <p class="font-bold mb-2">1. 研究目的</p>
          <p class="mb-4">本研究旨在通过收集真实世界数据，科学评估基于AI生成的五音疗法处方在改善睡眠质量、缓解焦虑情绪方面的有效性。</p>

          <p class="font-bold mb-2">2. 研究流程</p>
          <p class="mb-4">
            (1) 填写基础信息问卷；<br>
            (2) 连续7天使用本应用聆听推荐音乐（每日至少15分钟）；<br>
            (3) 每日简要记录听后感受；<br>
            (4) 结束时填写效果评估问卷。
          </p>

          <p class="font-bold mb-2">3. 收益与风险</p>
          <p class="mb-4">
            <strong>收益：</strong> 您将获得专业的音乐调理方案，并可能改善您的睡眠与情绪。完成研究后，您将获得VIP会员奖励及电子证书。<br>
            <strong>风险：</strong> 本研究为非侵入性干预，无已知风险。如您在聆听过程中感到不适（如头晕、烦躁），请立即停止使用。
          </p>

          <p class="font-bold mb-2">4. 隐私保护</p>
          <p class="mb-4">我们将严格遵守法律法规保护您的个人信息。您的数据将在去标识化后仅用于科研统计分析。</p>

          <p class="font-bold mb-2">5. 自愿原则</p>
          <p class="mb-4">参与本研究完全自愿，您有权在任何阶段退出，这不会影响您对APP其他功能的使用。</p>
        </div>

        <div class="flex items-center gap-3 mb-8 px-2">
          <input type="checkbox" id="agree" class="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" @change="e => hasAgreed = e.target.checked">
          <label for="agree" class="text-sm text-ink font-medium select-none">我已阅读并理解以上内容，同意参与研究</label>
        </div>

        <div class="flex gap-4">
            <button @click="step = 'intro'" class="flex-1 py-3 border border-ink/20 rounded-xl font-bold text-ink-light">返回</button>
            <button 
                id="consent-btn"
                @click="agreeConsent"
                class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
            >
                确认签署
            </button>
        </div>
      </div>

      <!-- 3. 基线问卷 & 结束问卷 (共用模版) -->
      <div v-if="step === 'baseline' || step === 'end_survey'" class="animate-fade-in-up">
        <h2 class="text-xl font-serif font-bold text-ink mb-2">
            {{ step === 'baseline' ? '基础信息评估' : '效果评估问卷' }}
        </h2>
        <p class="text-sm text-ink-light mb-6">
            {{ step === 'baseline' ? '请根据您最近一周的真实感受填写' : '请评价您在体验期间的真实感受' }}
        </p>

        <div class="space-y-8">
            <div v-for="(q, idx) in (step === 'baseline' ? BASELINE_QUESTIONS : END_QUESTIONS)" :key="q.id">
                <label class="block font-bold text-ink mb-3">
                    <span class="text-indigo-600 mr-1">{{ idx + 1 }}.</span> {{ q.label }}
                </label>
                
                <!-- 评分题 -->
                <div v-if="q.type === 'scale'" class="px-2">
                    <div class="flex justify-between text-xs text-ink-light mb-2">
                        <span>{{ q.min }}</span>
                        <span>{{ q.max }}</span>
                    </div>
                    <input 
                        type="range" :min="0" :max="10" :step="1" 
                        v-model.number="currentAnswers[q.id]"
                        class="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    >
                    <div class="text-center mt-2 font-bold text-indigo-600">{{ currentAnswers[q.id] || 0 }} 分</div>
                </div>

                <!-- 单选题 -->
                 <div v-if="q.type === 'single'" class="space-y-2">
                    <label v-for="opt in q.options" :key="opt" class="flex items-center p-3 rounded-lg border border-ink/10 bg-white cursor-pointer hover:border-indigo-500 transition-colors">
                        <input type="radio" :name="q.id" :value="opt" v-model="currentAnswers[q.id]" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                        <span class="ml-2 text-sm text-ink">{{ opt }}</span>
                    </label>
                 </div>

                <!-- 多选题 (这里简化为单选交互，实际可扩展) -->
                <div v-if="q.type === 'multi'" class="space-y-2">
                    <p class="text-xs text-ink-light mb-2">(可多选 - 暂不支持多选交互，请选主要一项)</p>
                     <label v-for="opt in q.options" :key="opt" class="flex items-center p-3 rounded-lg border border-ink/10 bg-white cursor-pointer hover:border-indigo-500 transition-colors">
                        <input type="radio" :name="q.id" :value="opt" v-model="currentAnswers[q.id]" class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                        <span class="ml-2 text-sm text-ink">{{ opt }}</span>
                    </label>
                </div>
            </div>
        </div>

        <button 
            @click="step === 'baseline' ? submitBaseline() : submitEndSurvey()"
            class="w-full py-3.5 mt-8 bg-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
        >
            提交问卷
        </button>
      </div>

      <!-- 4. 进行中看板 -->
      <div v-if="step === 'active'" class="animate-fade-in-up">
        <div class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
            
            <div class="relative z-10 flex justify-between items-start">
                <div>
                     <h2 class="text-xl font-bold mb-1">计划进行中</h2>
                     <p class="text-white/80 text-sm">已坚持 {{ progressDays }} / 7 天</p>
                </div>
                <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Activity class="w-6 h-6" />
                </div>
            </div>

            <div class="mt-6 relative h-2 bg-black/20 rounded-full overflow-hidden">
                <div class="absolute top-0 left-0 h-full bg-white/90 rounded-full transition-all duration-1000" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <p class="mt-2 text-xs text-center text-white/60">坚持就是胜利，完成即可获赠 VIP</p>
        </div>

        <div class="card p-6 mb-6">
            <h3 class="font-bold text-ink mb-4 flex items-center gap-2">
                <CheckCircle2 class="w-5 h-5 text-indigo-500" />
                今日任务
            </h3>
            
            <div class="flex items-center justify-between p-4 bg-ink/5 rounded-xl">
                 <div>
                    <div class="font-medium text-ink">聆听音乐 15分钟</div>
                    <div class="text-xs text-ink-light mt-1">请前往首页或曲库进行聆听</div>
                 </div>
                 <button @click="router.push('/home')" class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold">去完成</button>
            </div>
            <!-- 实际打卡逻辑由 Home 页自动触发，这里仅做展示 -->
        </div>

        <div class="text-center text-xs text-ink-light/50 mt-8">
            <p>如遇问题可联系客服</p>
            <p>ID: {{ researchData.startDate ? new Date(researchData.startDate).getTime().toString(36).toUpperCase() : '' }}</p>
        </div>
      </div>

      <!-- 5. 完成页 & 证书 -->
      <div v-if="step === 'completed'" class="animate-fade-in-up">
         <!-- 证书区域 -->
         <div id="certificate" class="relative bg-[#FDFBF7] p-8 border-4 border-double border-[#C5A572] rounded-lg shadow-2xl mb-8 text-center mx-auto max-w-sm">
            <!-- 纹理背景 -->
            <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
            
            <div class="relative z-10">
                <div class="w-16 h-16 mx-auto mb-4 bg-[#C5A572] rounded-full flex items-center justify-center text-white">
                    <Award class="w-10 h-10" />
                </div>
                
                <h1 class="font-serif font-bold text-2xl text-[#8B6E4E] mb-2 tracking-wide">体验贡献证书</h1>
                <p class="text-[10px] text-[#8B6E4E]/60 uppercase tracking-widest mb-6">Certificate of Contribution</p>
                
                <div class="text-ink text-sm leading-loose mb-6 font-serif">
                    兹证明<br>
                    <span class="text-xl font-bold border-b border-[#C5A572] px-2">{{ userName }}</span><br>
                    于 {{ certificateDate }} 完成为期7天的<br>
                    五音疗法体验研究<br>
                    为中医音乐疗法的科学验证贡献力量
                </div>
                
                <div class="flex justify-between items-end mt-8 pt-4 border-t border-[#C5A572]/30">
                    <div class="text-left">
                        <div class="text-[10px] text-ink-light">编号 / No.</div>
                        <div class="text-xs font-mono text-[#8B6E4E]">WY-2026-{{ researchData.startDate ? new Date(researchData.startDate).getTime().toString().slice(-6) : '0000' }}</div>
                    </div>
                    <div class="text-right">
                        <div class="w-20 h-8 bg-contain bg-no-repeat bg-right opacity-80" style="background-image: url('/sign_mock.png')"></div> <!-- 模拟签名 -->
                        <div class="text-xs font-bold text-[#8B6E4E]">五音疗·AI 项目组</div>
                    </div>
                </div>
            </div>
         </div>

         <div class="text-center mb-8">
            <h2 class="text-xl font-bold text-ink mb-2">🎉 恭喜完成！</h2>
            <p class="text-ink-light text-sm mb-4">奖励已发放至您的账户</p>
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold/10 to-orange-100 border border-gold/30 rounded-full text-gold-dark font-bold text-sm">
                <Gift class="w-4 h-4" />
                {{ researchData.reward?.desc || 'VIP会员奖励' }}
            </div>
         </div>

         <div class="flex gap-4">
            <button @click="router.push('/home')" class="flex-1 py-3 border rounded-xl font-bold text-ink-light">返回首页</button>
            <button class="flex-1 py-3 bg-ink text-white rounded-xl font-bold shadow-lg">保存证书</button>
         </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
/* 简单的 checkbox 样式修复 */
input[type="checkbox"] {
    position: relative;
    top: 2px;
}
</style>
