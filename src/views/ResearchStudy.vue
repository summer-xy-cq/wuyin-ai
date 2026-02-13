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

// ==========================================
// 专业科研问卷配置
// ==========================================

// 1. 人口学变量（基线必须收集）
const DEMOGRAPHIC_QUESTIONS = [
  {
    id: 'age',
    type: 'single',
    label: '您的年龄段？',
    options: ['18-25岁', '26-35岁', '36-45岁', '46-55岁', '56岁以上'],
    required: true
  },
  {
    id: 'gender',
    type: 'single',
    label: '您的性别？',
    options: ['男', '女'],
    required: true
  },
  {
    id: 'occupation',
    type: 'single',
    label: '您的职业类型？',
    options: ['脑力劳动（办公室/教师/IT等）', '体力劳动（工人/服务业等）', '自由职业', '退休', '学生', '其他'],
    required: true
  },
  {
    id: 'medical_history',
    type: 'multi',
    label: '您是否曾被诊断为以下情况？（可多选）',
    options: ['无', '失眠症', '焦虑症', '抑郁症', '高血压', '糖尿病', '其他慢性病'],
    required: true
  },
  {
    id: 'medication',
    type: 'multi',
    label: '目前是否正在服用以下药物？（可多选）',
    options: ['无', '安眠药', '抗焦虑药', '抗抑郁药', '降压药', '其他'],
    required: true
  }
]

// 2. PSQI 睡眠质量指数量表（简化版 - 14个核心维度）
const PSQI_QUESTIONS = [
  {
    id: 'psqi_1',
    type: 'single',
    label: '过去一周，您通常在晚上___点钟上床睡觉？',
    options: ['20:00前', '20:00-21:00', '21:00-22:00', '22:00-23:00', '23:00-24:00', '00:00以后'],
    category: 'sleep_quality'
  },
  {
    id: 'psqi_2',
    type: 'single',
    label: '过去一周，您上床后通常需要___分钟才能入睡？',
    options: ['≤15分钟', '16-30分钟', '31-60分钟', '>60分钟'],
    category: 'sleep_latency'
  },
  {
    id: 'psqi_3',
    type: 'single',
    label: '过去一周，您的实际睡眠时间大约是___小时？',
    options: ['>14小时', '6-14小时', '5-6小时', '<5小时'],
    category: 'sleep_duration'
  },
  {
    id: 'psqi_4',
    type: 'single',
    label: '过去一周，您的睡眠效率（睡眠时间/在床时间）大约是？',
    options: ['>85%', '145-84%', '65-144%', '<65%'],
    category: 'sleep_efficiency'
  },
  {
    id: 'psqi_5',
    type: 'multi',
    label: '过去一周，以下哪些睡眠问题困扰您？（可多选）',
    options: ['无', '入睡困难', '夜间易醒', '早醒', '打鼾', '做噩梦', '夜间上厕所', '身体疼痛影响'],
    category: 'sleep_disturbance'
  },
  {
    id: 'psqi_6',
    type: 'single',
    label: '过去一周，您使用安眠药物的频率是？',
    options: ['从未', '每周<1次', '每周1-2次', '每周3次及以上'],
    category: 'medication_use'
  },
  {
    id: 'psqi_7',
    type: 'single',
    label: '过去一周，您的日间功能障碍（白天困倦、影响工作生活）程度？',
    options: ['无', '轻微', '中等', '严重'],
    category: 'daytime_dysfunction'
  }
]

// 3. GAD-7 广泛性焦虑量表
const GAD14_QUESTIONS = [
  {
    id: 'gad7_1',
    type: 'single',
    label: '过去两周，感到紧张、焦虑或急切？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'anxiety'
  },
  {
    id: 'gad7_2',
    type: 'single',
    label: '过去两周，无法停止或控制担忧？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'anxiety'
  },
  {
    id: 'gad7_3',
    type: 'single',
    label: '过去两周，对各种事情担忧过多？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'anxiety'
  },
  {
    id: 'gad7_4',
    type: 'single',
    label: '过去两周，很难放松下来？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'anxiety'
  },
  {
    id: 'gad7_5',
    type: 'single',
    label: '过去两周，坐立不安，难以静坐？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'anxiety'
  },
  {
    id: 'gad7_6',
    type: 'single',
    label: '过去两周，变得容易烦恼或急躁？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'anxiety'
  },
  {
    id: 'gad7_14',
    type: 'single',
    label: '过去两周，感到似乎将有可怕的事情发生而害怕？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'anxiety'
  }
]

// 4. PHQ-9 抑郁筛查量表（简化版，取前6题核心症状）
const PHQ9_QUESTIONS = [
  {
    id: 'phq9_1',
    type: 'single',
    label: '过去两周，做事时提不起劲或没有兴趣？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'depression'
  },
  {
    id: 'phq9_2',
    type: 'single',
    label: '过去两周，感到心情低落、沮丧或绝望？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'depression'
  },
  {
    id: 'phq9_3',
    type: 'single',
    label: '过去两周，入睡困难、睡不安稳或睡眠过多？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'depression'
  },
  {
    id: 'phq9_4',
    type: 'single',
    label: '过去两周，感觉疲倦或没有活力？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'depression'
  },
  {
    id: 'phq9_5',
    type: 'single',
    label: '过去两周，食欲不振或吃太多？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'depression'
  },
  {
    id: 'phq9_6',
    type: 'single',
    label: '过去两周，觉得自己很糟或觉得自己很失败？',
    options: ['完全没有(0分)', '好几天(1分)', '一半以上天数(2分)', '几乎每天(3分)'],
    category: 'depression'
  }
]

// 5. 五音疗法专项问题
const MUSIC_THERAPY_QUESTIONS = [
  {
    id: 'constitution_type',
    type: 'single',
    label: '您的中医体质类型？（如不清楚，请先进行体质测评）',
    options: ['平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', '湿热质', '血瘀质', '气郁质', '特禀质', '尚未测评'],
    required: true
  },
  {
    id: 'music_experience',
    type: 'single',
    label: '您之前是否尝试过音乐疗法？',
    options: ['从未尝试', '偶尔听听', '经常聆听', '系统学习过'],
    required: true
  },
  {
    id: 'expectation',
    type: 'multi',
    label: '您希望通过五音疗法改善哪些方面？（可多选）',
    options: ['改善睡眠', '缓解焦虑', '调节情绪', '放松减压', '提升专注力', '其他'],
    required: true
  }
]

// 组合基线问卷（分模块）
const BASELINE_SECTIONS = [
  { id: 'demographic', title: '基本信息', questions: DEMOGRAPHIC_QUESTIONS },
  { id: 'constitution', title: '体质与音乐', questions: MUSIC_THERAPY_QUESTIONS },
  { id: 'psqi', title: '睡眠质量评估 (PSQI)', questions: PSQI_QUESTIONS },
  { id: 'gad14', title: '焦虑评估 (GAD-7)', questions: GAD14_QUESTIONS },
  { id: 'phq9', title: '情绪评估 (PHQ-9)', questions: PHQ9_QUESTIONS }
]

// 结束问卷（复测核心指标）
const END_QUESTIONS = [
  {
    id: 'end_psqi_overall',
    type: 'single',
    label: '体验结束后，您的整体睡眠质量如何？',
    options: ['很好', '较好', '一般', '较差', '很差']
  },
  {
    id: 'end_gad7_overall',
    type: 'single',
    label: '体验结束后，您的焦虑程度如何？',
    options: ['无焦虑', '轻度', '中度', '重度']
  },
  {
    id: 'end_phq9_overall',
    type: 'single',
    label: '体验结束后，您的情绪状态如何？',
    options: ['很好', '较好', '一般', '较差', '很差']
  },
  {
    id: 'improvement',
    type: 'single',
    label: '与体验前相比，您觉得自己的状态有改善吗？',
    options: ['明显改善', '有些改善', '没什么变化', '反而更差'],
    required: true
  },
  {
    id: 'improvement_areas',
    type: 'multi',
    label: '哪些方面有所改善？（可多选）',
    options: ['入睡更快', '睡眠更深', '焦虑减轻', '心情变好', '白天更有精神', '放松效果', '无明显改善']
  },
  {
    id: 'listen_compliance',
    type: 'single',
    label: '您实际完成聆听的天数？',
    options: ['14天全勤', '5-6天', '3-4天', '1-2天', '几乎没听']
  },
  {
    id: 'satisfaction',
    type: 'single',
    label: '对五音疗法的整体满意度？',
    options: ['非常满意', '比较满意', '一般', '不太满意', '不满意'],
    required: true
  },
  {
    id: 'recommend',
    type: 'single',
    label: '您是否愿意推荐给亲友？',
    options: ['非常愿意', '可能会', '不确定', '不会'],
    required: true
  },
  {
    id: 'feedback',
    type: 'text',
    label: '其他意见或建议（选填）',
    placeholder: '请分享您的使用体验...'
  }
]

// 临时存储问卷答案
const currentAnswers = ref({})
const currentSectionIndex = ref(0)

// 多选题处理
const isMultiSelected = (questionId, option) => {
  const current = currentAnswers.value[questionId]
  if (!current) return false
  if (Array.isArray(current)) {
    return current.includes(option)
  }
  return current === option
}

const toggleMultiOption = (questionId, option) => {
  if (!currentAnswers.value[questionId]) {
    currentAnswers.value[questionId] = []
  }
  const arr = currentAnswers.value[questionId]
  const index = arr.indexOf(option)
  if (index > -1) {
    arr.splice(index, 1)
  } else {
    arr.push(option)
  }
}

// 检查当前模块是否完成
const isCurrentSectionValid = computed(() => {
  const currentSection = BASELINE_SECTIONS[currentSectionIndex.value]
  if (!currentSection) return false

  return currentSection.questions.every(q => {
    if (!q.required) return true
    const answer = currentAnswers.value[q.id]
    if (Array.isArray(answer)) return answer.length > 0
    return !!answer
  })
})

const nextSection = () => {
  if (currentSectionIndex.value < BASELINE_SECTIONS.length - 1) {
    currentSectionIndex.value++
  }
}

const prevSection = () => {
  if (currentSectionIndex.value > 0) {
    currentSectionIndex.value--
  }
}

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
      // 检查是否满14天
      const start = new Date(researchData.value.startDate)
      const now = new Date()
      // 计算天数差，向上取整
      const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 14) {
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
  // 自动获取用户体质信息
  const constitution = JSON.parse(localStorage.getItem('wuyin_current_constitution') || '{}')

  researchData.value.baseline = {
    ...currentAnswers.value,
    timestamp: new Date().toISOString(),
    // 自动记录体质信息
    constitutionKey: constitution.constitutionKey || constitution.key || 'unknown',
    constitutionName: constitution.constitutionName || '未知体质',
    toneName: constitution.toneName || '未知'
  }
  researchData.value.status = 'active'
  researchData.value.logs = [] // 初始化日志数组
  saveData()
  currentAnswers.value = {}
  currentSectionIndex.value = 0
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
  return Math.min(14, diff + 1)
})

const progressPercent = computed(() => {
  return (progressDays.value / 14) * 100
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
            诚邀您参与为期 14 天的微型临床试验<br>
            帮助我们验证中医音乐疗法改善睡眠与焦虑的实际效果
          </p>
        </div>

        <div class="space-y-4 mb-8">
          <div class="bg-white p-4 rounded-xl border border-ink/5 shadow-sm flex gap-4 items-start">
            <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
               <Calendar class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-ink text-sm mb-1">只需坚持 14 天</h3>
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
            <li>本研究旨在评估五音疗法对睡眠、焦虑、情绪的改善效果。</li>
            <li>您需要填写基线和结束两份专业健康问卷，并连续14天完成每日音乐聆听任务。</li>
            <li>您的所有数据将匿名化处理，仅用于科研统计分析，严格保密。</li>
            <li>您可随时退出计划，退出后数据将被清除，不影响您的VIP权益。</li>
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
          <p class="mb-4">您好！我们邀请您参与一项关于“五音疗法对睡眠、焦虑与情绪改善作用”的观察性研究。本研究已通过相关伦理审查。</p>

          <p class="font-bold mb-2">1. 研究目的</p>
          <p class="mb-4">本研究旨在通过收集真实世界数据，科学评估基于AI生成的五音疗法处方在改善睡眠质量、缓解焦虑情绪、提升整体身心健康方面的有效性，为中医音乐疗法的现代化研究提供科学依据。</p>

          <p class="font-bold mb-2">2. 研究流程</p>
          <p class="mb-4">
            (1) 填写基线问卷（含基本信息、睡眠质量评估、焦虑量表、情绪评估等）；<br>
            (2) 连续14天使用本应用聆听推荐音乐（每日至少15分钟）；<br>
            (3) 每日完成简短的音乐体验反馈；<br>
            (4) 14天后填写结束问卷，评估改善效果。
          </p>

          <p class="font-bold mb-2">3. 纳入标准</p>
          <p class="mb-4">
            (1) 年龄18岁以上；<br>
            (2) 拥有智能手机并能正常使用本应用；<br>
            (3) 知情同意并自愿参与。
          </p>

          <p class="font-bold mb-2">4. 收益与风险</p>
          <p class="mb-4">
            <strong>可能的收益：</strong> 您将获得基于您体质的个性化五音疗法调理方案，并可能改善您的睡眠质量、焦虑水平和情绪状态。完成全部研究后，您将获得VIP会员奖励及电子证书。<br><br>
            <strong>潜在风险：</strong> 本研究为非侵入性干预，无已知严重风险。部分用户在长时间聆听音乐时可能出现轻微头晕或不适，若出现此情况，请立即停止并休息。
          </p>

          <p class="font-bold mb-2">5. 隐私保护与数据安全</p>
          <p class="mb-4">
            我们将严格遵守《个人信息保护法》《数据安全法》等法律法规保护您的隐私。具体措施包括：<br>
            (1) 您的个人身份信息（姓名、手机号等）与研究数据分离存储；<br>
            (2) 研究数据仅保留年龄区间、职业类型等脱敏信息，不包含可识别您身份的数据；<br>
            (3) 数据存储于加密服务器，仅授权研究人员可访问；<br>
            (4) 研究结束后，数据将匿名化保存用于后续科研分析，或根据您的要求彻底删除。
          </p>

          <p class="font-bold mb-2">6. 自愿原则与退出权利</p>
          <p class="mb-4">
            参与本研究完全基于您的自愿。您有权在研究任何阶段无条件退出，无需提供理由。退出时：<br>
            (1) 您已填写的问卷数据将被彻底清除；<br>
            (2) 您仍可继续使用本应用的全部功能；<br>
            (3) 若您已完成部分研究任务并已获得VIP奖励，退出不影响您已获得的权益。
          </p>

          <p class="font-bold mb-2">14. 联系方式</p>
          <p class="mb-4">如您对本研究有任何疑问，请联系研究团队。我们的目标是确保您的参与安全、愉快且有价值。</p>
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

      <!-- 3. 基线问卷（分模块） -->
      <div v-if="step === 'baseline'" class="animate-fade-in-up">
        <!-- 进度指示器 -->
        <div class="mb-6">
          <div class="flex justify-between text-xs text-ink-light mb-2">
            <span>模块 {{ currentSectionIndex + 1 }} / {{ BASELINE_SECTIONS.length }}</span>
            <span>{{ BASELINE_SECTIONS[currentSectionIndex].title }}</span>
          </div>
          <div class="h-2 bg-indigo-100 rounded-full overflow-hidden">
            <div class="h-full bg-indigo-600 transition-all duration-300"
                 :style="{ width: ((currentSectionIndex + 1) / BASELINE_SECTIONS.length * 100) + '%' }"></div>
          </div>
        </div>

        <h2 class="text-xl font-serif font-bold text-ink mb-2">{{ BASELINE_SECTIONS[currentSectionIndex].title }}</h2>
        <p class="text-sm text-ink-light mb-6">请根据您最近的真实情况填写</p>

        <div class="space-y-6">
          <div v-for="(q, idx) in BASELINE_SECTIONS[currentSectionIndex].questions" :key="q.id">
            <label class="block font-bold text-ink mb-3">
              <span class="text-indigo-600 mr-1">{{ idx + 1 }}.</span> {{ q.label }}
              <span v-if="q.required" class="text-cinnabar text-xs ml-1">*</span>
            </label>

            <!-- 单选题 -->
            <div v-if="q.type === 'single'" class="space-y-2">
              <label v-for="opt in q.options" :key="opt"
                     class="flex items-center p-3 rounded-lg border border-ink/10 bg-white cursor-pointer hover:border-indigo-500 transition-colors"
                     :class="{ 'border-indigo-500 bg-indigo-50': currentAnswers[q.id] === opt }">
                <input type="radio" :name="q.id" :value="opt" v-model="currentAnswers[q.id]"
                       class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                <span class="ml-2 text-sm text-ink">{{ opt }}</span>
              </label>
            </div>

            <!-- 多选题 -->
            <div v-if="q.type === 'multi'" class="space-y-2">
              <label v-for="opt in q.options" :key="opt"
                     class="flex items-center p-3 rounded-lg border border-ink/10 bg-white cursor-pointer hover:border-indigo-500 transition-colors"
                     :class="{ 'border-indigo-500 bg-indigo-50': isMultiSelected(q.id, opt) }">
                <input type="checkbox" :value="opt" :checked="isMultiSelected(q.id, opt)"
                       @change="toggleMultiOption(q.id, opt)"
                       class="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded">
                <span class="ml-2 text-sm text-ink">{{ opt }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 导航按钮 -->
        <div class="flex gap-4 mt-8">
          <button v-if="currentSectionIndex > 0" @click="prevSection"
                  class="flex-1 py-3 border border-ink/20 rounded-xl font-bold text-ink-light">
            上一模块
          </button>
          <button v-if="currentSectionIndex < BASELINE_SECTIONS.length - 1" @click="nextSection"
                  class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
                  :disabled="!isCurrentSectionValid" :class="{ 'opacity-50': !isCurrentSectionValid }">
            下一模块
          </button>
          <button v-else @click="submitBaseline"
                  class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
                  :disabled="!isCurrentSectionValid" :class="{ 'opacity-50': !isCurrentSectionValid }">
            提交问卷
          </button>
        </div>
      </div>

      <!-- 4. 结束问卷（复测） -->
      <div v-if="step === 'end_survey'" class="animate-fade-in-up">
        <h2 class="text-xl font-serif font-bold text-ink mb-2">体验效果评估</h2>
        <p class="text-sm text-ink-light mb-6">请评价您14天体验期间的真实感受</p>

        <div class="space-y-6">
          <div v-for="(q, idx) in END_QUESTIONS" :key="q.id">
            <label class="block font-bold text-ink mb-3">
              <span class="text-indigo-600 mr-1">{{ idx + 1 }}.</span> {{ q.label }}
              <span v-if="q.required" class="text-cinnabar text-xs ml-1">*</span>
            </label>

            <!-- 单选题 -->
            <div v-if="q.type === 'single'" class="space-y-2">
              <label v-for="opt in q.options" :key="opt"
                     class="flex items-center p-3 rounded-lg border border-ink/10 bg-white cursor-pointer hover:border-indigo-500 transition-colors"
                     :class="{ 'border-indigo-500 bg-indigo-50': currentAnswers[q.id] === opt }">
                <input type="radio" :name="q.id" :value="opt" v-model="currentAnswers[q.id]"
                       class="w-4 h-4 text-indigo-600 focus:ring-indigo-500">
                <span class="ml-2 text-sm text-ink">{{ opt }}</span>
              </label>
            </div>

            <!-- 多选题 -->
            <div v-if="q.type === 'multi'" class="space-y-2">
              <label v-for="opt in q.options" :key="opt"
                     class="flex items-center p-3 rounded-lg border border-ink/10 bg-white cursor-pointer hover:border-indigo-500 transition-colors"
                     :class="{ 'border-indigo-500 bg-indigo-50': isMultiSelected(q.id, opt) }">
                <input type="checkbox" :value="opt" :checked="isMultiSelected(q.id, opt)"
                       @change="toggleMultiOption(q.id, opt)"
                       class="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded">
                <span class="ml-2 text-sm text-ink">{{ opt }}</span>
              </label>
            </div>

            <!-- 文本题 -->
            <div v-if="q.type === 'text'" class="space-y-2">
              <textarea v-model="currentAnswers[q.id]" :placeholder="q.placeholder"
                        class="w-full p-3 border border-ink/10 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        rows="3"></textarea>
            </div>
          </div>
        </div>

        <button @click="submitEndSurvey"
                class="w-full py-3.5 mt-8 bg-indigo-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
          提交问卷
        </button>
      </div>

      <!-- 4. 进行中看板 -->
      <div v-if="step === 'active'" class="animate-fade-in-up">
        <div class="bg-gradient-to-br from-indigo-600 to-purple-1400 rounded-2xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
            
            <div class="relative z-10 flex justify-between items-start">
                <div>
                     <h2 class="text-xl font-bold mb-1">计划进行中</h2>
                     <p class="text-white/80 text-sm">已坚持 {{ progressDays }} / 14 天</p>
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
                 <button @click="router.push('/home')" class="px-4 py-2 bg-indigo-100 text-indigo-1400 rounded-lg text-sm font-bold">去完成</button>
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
         <div id="certificate" class="relative bg-[#FDFBF14] p-8 border-4 border-double border-[#C5A5142] rounded-lg shadow-2xl mb-8 text-center mx-auto max-w-sm">
            <!-- 纹理背景 -->
            <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
            
            <div class="relative z-10">
                <div class="w-16 h-16 mx-auto mb-4 bg-[#C5A5142] rounded-full flex items-center justify-center text-white">
                    <Award class="w-10 h-10" />
                </div>
                
                <h1 class="font-serif font-bold text-2xl text-[#8B6E4E] mb-2 tracking-wide">体验贡献证书</h1>
                <p class="text-[10px] text-[#8B6E4E]/60 uppercase tracking-widest mb-6">Certificate of Contribution</p>
                
                <div class="text-ink text-sm leading-loose mb-6 font-serif">
                    兹证明<br>
                    <span class="text-xl font-bold border-b border-[#C5A5142] px-2">{{ userName }}</span><br>
                    于 {{ certificateDate }} 完成为期14天的<br>
                    五音疗法体验研究<br>
                    为中医音乐疗法的科学验证贡献力量
                </div>
                
                <div class="flex justify-between items-end mt-8 pt-4 border-t border-[#C5A5142]/30">
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
