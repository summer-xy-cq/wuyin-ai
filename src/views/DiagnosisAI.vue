<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ScanFace, ScanLine, BrainCircuit, ChevronRight } from 'lucide-vue-next'
import CameraCapture from '../components/CameraCapture.vue'
import { CONSTITUTIONS } from '../data/constitutions.js'

const router = useRouter()

// Steps: 'intro' -> 'capture-face' -> 'capture-tongue' -> 'analyzing' -> 'result'
const step = ref('intro')
const faceImage = ref(null)
const tongueImage = ref(null)
const analysisResult = ref(null)

const startDiagnosis = () => {
    step.value = 'capture-face'
}

const handleFaceCapture = (image) => {
    faceImage.value = image
    step.value = 'capture-tongue'
}

const handleTongueCapture = (image) => {
    tongueImage.value = image
    analyzeImages()
}



// ... existing refs

const mapDiagnosisToConstitution = (diagnosisText) => {
    // Simple keyword matching to map AI text to 5 Tones/Constitutions
    const text = diagnosisText || ''
    if (text.includes('脾') || text.includes('湿') || text.includes('胃')) return CONSTITUTIONS['tanshi'] // 痰湿
    if (text.includes('气虚') || text.includes('肺')) return CONSTITUTIONS['qixu']
    if (text.includes('阴虚') || text.includes('火') || text.includes('热')) return CONSTITUTIONS['yinxu']
    if (text.includes('阳虚') || text.includes('寒') || text.includes('怕冷')) return CONSTITUTIONS['yangxu']
    if (text.includes('血瘀') || text.includes('斑')) return CONSTITUTIONS['xueyu']
    if (text.includes('郁') || text.includes('肝')) return CONSTITUTIONS['qiyu']
    
    // Default fallback
    return CONSTITUTIONS['pinghe']
}

const saveToHistory = (result) => {
    const matchedConstitution = mapDiagnosisToConstitution(result.diagnosis)
    
    const record = {
        constitutionKey: 'ai_diagnosis', // Special key
        constitutionName: result.diagnosis || 'AI 辨证', // Use the specific diagnosis
        toneName: matchedConstitution.toneName,
        tone: matchedConstitution.tone,
        score: 80, // AI confidence?
        features: [...(result.face?.features || []), ...(result.tongue?.coating ? [result.tongue.coating] : [])],
        date: new Date().toISOString(),
        tracks: matchedConstitution.tracks,
        traditionalMusic: matchedConstitution.tracks[0],
        isAi: true, // Marker for AI record
        aiDetails: result // Store full details
    }
    
    // Save current for Home page
    localStorage.setItem('wuyin_current_constitution', JSON.stringify(record))

    // Append to history
    const history = JSON.parse(localStorage.getItem('wuyin_history') || '[]')
    history.unshift(record)
    localStorage.setItem('wuyin_history', JSON.stringify(history))
}

const analyzeImages = async () => {
    step.value = 'analyzing'
    
    try {
        const response = await fetch('/api/analyze-diagnosis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                faceImage: faceImage.value,
                tongueImage: tongueImage.value
            })
        })
        
        if (!response.ok) {
            throw new Error('Analysis failed')
        }
        
        const data = await response.json()
        analysisResult.value = data
        
        // Save to history immediately
        saveToHistory(data)
        
        step.value = 'result'
    } catch (err) {
        console.error("API Error, falling back to mock data:", err)
        // Fallback for local development or API failure
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const mockData = {
            face: {
                color: '面色淡白',
                luster: '少泽',
                features: ['眼袋明显', '额头无痘']
            },
            tongue: {
                color: '舌质淡',
                coating: '苔白腻',
                shape: '边有齿痕'
            },
            diagnosis: '脾虚湿盛',
            advice: '（模拟结果）检测结果显示您有脾虚湿盛的倾向。建议强健脾胃，祛湿化痰。饮食上宜清淡，少食生冷油腻，多食山药、薏米、赤小豆。作息上注意避免熬夜，适当运动以助阳气升发。'
        }
        
        analysisResult.value = mockData
        saveToHistory(mockData)
        step.value = 'result'
    }
}

const cancelCapture = () => {
    // If cancelling face capture, go back to intro
    // If cancelling tongue capture, maybe go back to face? Or confirm exit?
    // Simple for now: back to previous step or exit
    if (step.value === 'capture-face') step.value = 'intro'
    if (step.value === 'capture-tongue') step.value = 'capture-face'
}

const exit = () => {
    router.push('/diagnosis')
}
</script>

<template>
  <div class="min-h-screen bg-paper pb-10">
    <!-- Intro Screen -->
    <div v-if="step === 'intro'" class="min-h-screen flex flex-col">
        <header class="p-4">
            <button @click="router.back()" class="text-ink-light hover:text-ink">
                <ArrowLeft class="w-6 h-6" />
            </button>
        </header>
        
        <main class="flex-1 px-8 flex flex-col justify-center items-center text-center -mt-10 animate-fade-in-up">
            <div class="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl mb-8 transform rotate-3">
                <BrainCircuit class="w-12 h-12 text-white" />
            </div>
            
            <h1 class="text-3xl font-serif font-bold text-ink mb-4">AI 智能望诊</h1>
            <p class="text-ink-light leading-relaxed mb-8">
                融合传统中医望诊理论与现代 AI 视觉分析技术。<br>
                通过采集您的<b>面象</b>与<b>舌象</b>，<br>
                为您提供更精准的体质辩证。
            </p>
            
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink/5 w-full max-w-xs text-left space-y-4 mb-8">
                <div class="flex items-start gap-4">
                    <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <ScanFace class="w-6 h-6" />
                    </div>
                    <div>
                        <h3 class="font-bold text-ink">第一步：面部采集</h3>
                        <p class="text-xs text-ink-light mt-1">请摘下眼镜，在自然光下拍摄素颜照。</p>
                    </div>
                </div>
                <div class="w-px h-6 bg-ink/10 ml-5"></div>
                <div class="flex items-start gap-4">
                    <div class="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <ScanLine class="w-6 h-6" />
                    </div>
                    <div>
                        <h3 class="font-bold text-ink">第二步：舌象采集</h3>
                        <p class="text-xs text-ink-light mt-1">自然伸舌，放松舌面，避免反光。</p>
                    </div>
                </div>
            </div>
            
            <button 
                @click="startDiagnosis"
                class="w-full max-w-xs bg-ink text-white py-4 rounded-xl font-bold shadow-lg shadow-ink/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                开始检测
                <ChevronRight class="w-5 h-5" />
            </button>

             <p class="mt-6 text-[10px] text-ink-light/40">
                声明：本功能仅供健康调理参考，不可作为医疗诊断依据。<br>我们承诺您的照片仅用于实时分析，不会保留或用于其他用途。
            </p>
        </main>
    </div>

    <!-- Capture Components -->
    <CameraCapture 
        v-if="step === 'capture-face'" 
        mode="face" 
        @capture="handleFaceCapture" 
        @cancel="cancelCapture" 
    />
    
    <CameraCapture 
        v-if="step === 'capture-tongue'" 
        mode="tongue" 
        @capture="handleTongueCapture" 
        @cancel="cancelCapture" 
    />

    <!-- Analyzing State -->
    <div v-if="step === 'analyzing'" class="fixed inset-0 bg-paper z-50 flex flex-col items-center justify-center">
        <div class="relative w-32 h-32 mb-8">
             <div class="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
             <div class="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
             <BrainCircuit class="absolute inset-0 m-auto w-12 h-12 text-indigo-500 animate-pulse" />
        </div>
        <h2 class="text-xl font-bold text-ink mb-2">AI正在分析中...</h2>
        <p class="text-ink-light text-sm">正在综合分析您的面部与舌象特征</p>
    </div>

    <!-- Result Display (Mock) -->
    <div v-if="step === 'result'" class="min-h-screen p-6 animate-fade-in-up">
        <header class="flex items-center justify-between mb-8">
            <h1 class="text-2xl font-serif font-bold text-ink">分析报告</h1>
            <button @click="exit" class="text-sm text-ink-light hover:text-ink">完成</button>
        </header>
        
        <div class="space-y-6">
            <!-- Diagnosis Card -->
            <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                <div class="flex items-center gap-2 mb-4">
                    <BrainCircuit class="w-5 h-5 text-indigo-600" />
                    <h2 class="font-bold text-indigo-900">AI 综合辩证</h2>
                </div>
                <div class="text-3xl font-serif font-bold text-indigo-900 mb-2">{{ analysisResult.diagnosis }}</div>
                <p class="text-indigo-800/80 text-sm leading-relaxed">{{ analysisResult.advice }}</p>
            </div>

            <!-- Detail Cards -->
             <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-4 rounded-xl shadow-sm border border-ink/5">
                    <div class="flex items-center gap-2 mb-3">
                        <ScanFace class="w-4 h-4 text-indigo-500" />
                        <h3 class="font-bold text-ink">面诊分析</h3>
                    </div>
                    <ul class="text-xs text-ink-light space-y-2">
                        <li><span class="text-ink/60">面色：</span>{{ analysisResult.face.color }}</li>
                        <li><span class="text-ink/60">光泽：</span>{{ analysisResult.face.luster }}</li>
                        <li v-for="feature in analysisResult.face.features" :key="feature" class="text-indigo-500 bg-indigo-50 inline-block px-1.5 py-0.5 rounded mr-1">
                            {{ feature }}
                        </li>
                    </ul>
                </div>

                <div class="bg-white p-4 rounded-xl shadow-sm border border-ink/5">
                    <div class="flex items-center gap-2 mb-3">
                        <ScanLine class="w-4 h-4 text-purple-500" />
                        <h3 class="font-bold text-ink">舌诊分析</h3>
                    </div>
                    <ul class="text-xs text-ink-light space-y-2">
                        <li><span class="text-ink/60">舌质：</span>{{ analysisResult.tongue.color }}</li>
                        <li><span class="text-ink/60">舌苔：</span>{{ analysisResult.tongue.coating }}</li>
                         <li><span class="text-ink/60">舌形：</span>{{ analysisResult.tongue.shape }}</li>
                    </ul>
                </div>
            </div>

             <!-- Combined Images (Small Preview) -->
            <div class="flex gap-4 mt-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <img :src="faceImage" class="w-16 h-16 object-cover rounded-lg border border-ink/10" />
                <img :src="tongueImage" class="w-16 h-16 object-cover rounded-lg border border-ink/10" />
            </div>
        </div>
    </div>
  </div>
</template>
