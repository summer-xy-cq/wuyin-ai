<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Camera, RefreshCw, Check, X } from 'lucide-vue-next'

const props = defineProps({
  mode: {
    type: String,
    default: 'face', // 'face' or 'tongue'
  },
  instructions: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['capture', 'cancel'])

const videoRef = ref(null)
const canvasRef = ref(null)
const stream = ref(null)
const capturedImage = ref(null)
const error = ref(null)

const startCamera = async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user', // Front camera by default
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
    }
  } catch (err) {
    console.error("Camera access error:", err)
    error.value = "无法访问摄像头，请确保已授权访问权限。"
  }
}

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
}

const capture = () => {
  if (!videoRef.value || !canvasRef.value) return

  const video = videoRef.value
  const canvas = canvasRef.value
  const context = canvas.getContext('2d')

  // Set canvas dimensions to match video
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // Draw video frame to canvas
  // context.translate(canvas.width, 0);
  // context.scale(-1, 1); // Mirror if using front camera, but usually we want true image for medical?
  // Let's mirror it for UX so it feels like a mirror, then flip back? Or just keep it mirrored?
  // User expects mirror behavior.
  context.save()
  context.translate(canvas.width, 0)
  context.scale(-1, 1)
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  context.restore()

  capturedImage.value = canvas.toDataURL('image/jpeg', 0.8)
  // Stop camera to save battery/resource
  // stopCamera() // Optional: keep running or stop? Usually stop to show static result.
}

const retake = () => {
  capturedImage.value = null
  // startCamera() // If we stopped it
}

const confirm = () => {
  emit('capture', capturedImage.value)
}

onMounted(() => {
  startCamera()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black flex flex-col">
    <!-- Header -->
    <div class="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
        <button @click="$emit('cancel')" class="text-white p-2 rounded-full bg-white/10 hover:bg-white/20">
            <X class="w-6 h-6" />
        </button>
        <span class="text-white font-medium text-lg shadow-sm">{{ mode === 'face' ? '面诊采集' : '舌诊采集' }}</span>
        <div class="w-10"></div> <!-- Spacer -->
    </div>

    <!-- Main Viewport -->
    <div class="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        <p v-if="error" class="text-white text-center px-6">{{ error }}</p>
        
        <!-- Video Stream -->
        <video 
            v-show="!capturedImage"
            ref="videoRef" 
            autoplay 
            playsinline 
            class="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
        ></video>
        
        <!-- Captured Image Preview -->
        <img 
            v-if="capturedImage" 
            :src="capturedImage" 
            class="absolute inset-0 w-full h-full object-cover" 
        />

        <!-- Overlays (Only show when not captured) -->
        <div v-if="!capturedImage" class="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <!-- Face Guide -->
            <svg v-if="mode === 'face'" viewBox="0 0 100 100" class="w-[80%] h-[80%] opacity-50 drop-shadow-lg">
                <ellipse cx="50" cy="45" rx="30" ry="40" fill="none" stroke="white" stroke-width="1.5" stroke-dasharray="4 2" />
                <!-- Eyes guide -->
                <line x1="35" y1="40" x2="45" y2="40" stroke="white" stroke-width="1" />
                <line x1="55" y1="40" x2="65" y2="40" stroke="white" stroke-width="1" />
            </svg>

            <!-- Tongue Guide -->
            <svg v-if="mode === 'tongue'" viewBox="0 0 100 100" class="w-[60%] h-[60%] opacity-50 drop-shadow-lg">
                <path d="M30,30 Q50,90 70,30 Q50,10 30,30" fill="none" stroke="white" stroke-width="1.5" stroke-dasharray="4 2" />
            </svg>
        </div>
        
        <!-- Instructions -->
        <div v-if="!capturedImage" class="absolute bottom-32 left-0 right-0 text-center z-20 px-6">
            <p class="text-white/90 text-sm bg-black/40 inline-block px-4 py-2 rounded-full backdrop-blur-sm">
                {{ instructions || (mode === 'face' ? '请摘下眼镜，露出额头，保持光线充足' : '请自然伸出舌头，放松舌面，避免反光') }}
            </p>
        </div>
    </div>

    <!-- Controls -->
    <div class="bg-black p-8 pb-12 flex justify-around items-center z-20">
        <div v-if="!capturedImage" class="flex-1 flex justify-center">
             <!-- Capture Button -->
            <button 
                @click="capture"
                class="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/10 transition-colors active:scale-95"
            >
                <div class="w-16 h-16 bg-white rounded-full"></div>
            </button>
        </div>

        <div v-else class="flex-1 flex justify-around items-center w-full px-8 gap-8">
            <button 
                @click="retake"
                class="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
                <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <RefreshCw class="w-6 h-6" />
                </div>
                <span class="text-xs">重拍</span>
            </button>

             <button 
                @click="confirm"
                class="flex flex-col items-center gap-2 text-jade hover:text-jade-light transition-colors"
            >
                <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg shadow-jade/20">
                    <Check class="w-8 h-8 text-jade" />
                </div>
                <span class="text-xs font-bold">确认</span>
            </button>
        </div>
    </div>

    <canvas ref="canvasRef" class="hidden"></canvas>
  </div>
</template>
