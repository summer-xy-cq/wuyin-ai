/**
 * 五音频率生成器 v2.0
 * 基于 Web Audio API 实现：
 * - ADSR 包络（音符起止更自然）
 * - 复合波形泛音（模拟古琴/古筝音色）
 * - 卷积混响（模拟自然空间感）
 * - 旋律序列生成（不是随机噪音，是像样的旋律）
 * - 体质参数映射（不同体质对应不同音色/节奏参数）
 */

// ============================================================
// 一、基础频率定义
// ============================================================

// 五音频率（Hz）- 基于中医五音对五脏理论
export const TONE_FREQUENCIES = {
  gong: { frequency: 261.63, name: '宫', organ: '脾', description: '宫调厚重稳健，健脾和胃', element: '土' },
  shang: { frequency: 293.66, name: '商', organ: '肺', description: '商调清亮肃静，宣肺理气', element: '金' },
  jiao: { frequency: 329.63, name: '角', organ: '肝', description: '角调舒展生发，疏肝解郁', element: '木' },
  zhi: { frequency: 392.00, name: '徵', organ: '心', description: '徵调热烈欢快，养心安神', element: '火' },
  yu: { frequency: 440.00, name: '羽', organ: '肾', description: '羽调深沉悠远，补肾固精', element: '水' }
}

// 体质 → 主音调映射（与原有一致）
export const CONSTITUTION_TONE_MAP = {
  pinghe: 'gong',
  qixu: 'gong',
  yangxu: 'zhi',
  yinxu: 'yu',
  tanshi: 'gong',
  shire: 'jiao',
  xueyu: 'jiao',
  qiyu: 'jiao',
  tebing: 'gong'
}

// 五声音阶频率表（按音调）
export const PENTATONIC_SCALES = {
  gong: [261.63, 293.66, 329.63, 392.00, 440.00], // C4 D4 E4 G4 A4
  shang: [293.66, 329.63, 392.00, 440.00, 523.25], // D4 E4 G4 A4 C5
  jiao: [329.63, 392.00, 440.00, 523.25, 587.33],  // E4 G4 A4 C5 D5
  zhi: [392.00, 440.00, 523.25, 587.33, 659.25],   // G4 A4 C5 D5 E5
  yu: [440.00, 523.25, 587.33, 659.25, 783.99]    // A4 C5 D5 E5 G5
}

// ============================================================
// 二、体质 → 参数映射
// ============================================================

// 不同体质对应不同的音色参数
export const CONSTITUTION_PARAMS = {
  pinghe: { timbre: 'guqin', rhythm: 'natural', density: 0.6, warmth: 0.5, reverb: 0.5 },
  qixu: { timbre: 'guzheng', rhythm: 'slow', density: 0.4, warmth: 0.7, reverb: 0.6 },    // 气虚→慢、厚实
  yangxu: { timbre: 'guqin', rhythm: 'active', density: 0.7, warmth: 0.8, reverb: 0.4 },  // 阳虚→偏暖、活跃
  yinxu: { timbre: 'guqin', rhythm: 'slow', density: 0.3, warmth: 0.2, reverb: 0.8 },    // 阴虚→清冷、深沉
  tanshi: { timbre: 'guzheng', rhythm: 'natural', density: 0.5, warmth: 0.5, reverb: 0.4 },// 痰湿→均衡
  shire: { timbre: 'guzheng', rhythm: 'active', density: 0.8, warmth: 0.6, reverb: 0.3 },  // 湿热→活跃
  xueyu: { timbre: 'guqin', rhythm: 'natural', density: 0.5, warmth: 0.4, reverb: 0.6 },   // 血瘀→沉稳
  qiyu: { timbre: 'guzheng', rhythm: 'slow', density: 0.6, warmth: 0.5, reverb: 0.7 },    // 气郁→舒展
  tebing: { timbre: 'guqin', rhythm: 'slow', density: 0.4, warmth: 0.5, reverb: 0.5 }      // 特禀→平和
}

// ============================================================
// 三、ADSR 包络
// ============================================================

/**
 * ADSR 包络参数（单位：秒）
 * Attack: 上升到峰值的时间
 * Decay: 从峰值跌到持续值的时间
 * Sustain: 持续值（0-1）
 * Release: 释音时间
 */
export const RHYTHM_PRESETS = {
  slow: { attack: 1.5, decay: 1.0, sustain: 0.6, release: 2.0 },   // 舒缓：长起长落
  natural: { attack: 0.8, decay: 0.6, sustain: 0.65, release: 1.2 }, // 自然：平衡
  active: { attack: 0.3, decay: 0.3, sustain: 0.7, release: 0.8 }   // 活跃：短促有力
}

// ============================================================
// 四、ToneGenerator 主类
// ============================================================

class ToneGenerator {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.reverbGain = null
    this.dryGain = null
    this.convolver = null
    this.isPlaying = false
    this.isPaused = false
    this.currentScale = 'gong'
    this.totalDuration = 0
    this.scheduledTimeouts = []
    this.startTime = 0
    this.currentPreset = RHYTHM_PRESETS.natural
    this.lastSequence = []  // 最近的旋律序列（用于歌词同步）
  }

  // 初始化音频上下文（惰性单例）
  init() {
    if (this.audioContext) return this.audioContext

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // 主增益（控制音量）
    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = 0.5
    this.masterGain.connect(this.audioContext.destination)

    // 干信号（原始声音）
    this.dryGain = this.audioContext.createGain()
    this.dryGain.gain.value = 0.7
    this.dryGain.connect(this.masterGain)

    // 混响信号
    this.reverbGain = this.audioContext.createGain()
    this.reverbGain.gain.value = 0.3
    this.convolver = this.audioContext.createConvolver()
    this.convolver.buffer = this._createReverbIR(2.5) // 2.5秒自然混响
    this.convolver.connect(this.reverbGain)
    this.reverbGain.connect(this.masterGain)

    return this.audioContext
  }

  // 创建合成混响脉冲响应（自然空间模拟）
  _createReverbIR(duration) {
    const ctx = this.audioContext
    const sampleRate = ctx.sampleRate
    const length = sampleRate * duration
    const buffer = ctx.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        // 指数衰减的白噪声模拟自然反射
        const decay = Math.exp(-i / (sampleRate * 0.5))
        // 早期反射（密集）+ 后期混响（稀疏）
        const earlyReflection = (Math.random() * 2 - 1) * decay * 0.6
        const lateReverb = (Math.random() * 2 - 1) * decay * 0.4
        data[i] = (earlyReflection + lateReverb) * (channel === 0 ? 1 : 0.95)
      }
    }
    return buffer
  }

  // ============================================================
  // 五、古琴/古筝音色合成
  // ============================================================

  /**
   * 创建复合波形振荡器（模拟弦乐器泛音）
   * 古琴特点：基音 + 2/3/4/5 次泛音，声音幽深
   * 古筝特点：基音 + 2/3/4 次泛音，声音明亮
   */
  _createStringOscillator(frequency, timbre = 'guqin') {
    const ctx = this.audioContext

    // 增益节点（接收 ADSR 包络）
    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(0, ctx.currentTime)

    // 谐波权重（不同乐器有不同的泛音结构）
    const harmonics = timbre === 'guqin'
      ? [
          { ratio: 1, gain: 1.0 },   // 基音
          { ratio: 2, gain: 0.4 },   // 第2泛音（8度）
          { ratio: 3, gain: 0.15 },  // 第3泛音
          { ratio: 4, gain: 0.08 },  // 第4泛音
          { ratio: 5, gain: 0.03 }   // 第5泛音
        ]
      : [
          { ratio: 1, gain: 1.0 },   // 基音
          { ratio: 2, gain: 0.5 },   // 古筝泛音更丰富
          { ratio: 3, gain: 0.25 },
          { ratio: 4, gain: 0.1 }
        ]

    const oscillators = []

    harmonics.forEach(({ ratio, gain }) => {
      const osc = ctx.createOscillator()
      const harmonicGain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency * ratio, ctx.currentTime)

      // 高频泛音音量稍低
      harmonicGain.gain.setValueAtTime(gain, ctx.currentTime)

      osc.connect(harmonicGain)
      harmonicGain.connect(gainNode)

      osc.start()
      oscillators.push(osc)
    })

    return { oscillators, gainNode }
  }

  // ============================================================
  // 六、ADSR 包络应用
  // ============================================================

  /**
   * 对音符应用 ADSR 包络
   * @param {GainNode} gainNode - 连接到 output 的 gain 节点
   * @param {number} startTime - 开始时间（audioContext.currentTime）
   * @param {number} noteDuration - 音符持续时间（秒）
   * @param {Object} adsr - ADSR 参数
   */
  _applyADSR(gainNode, startTime, noteDuration, adsr) {
    const { attack, decay, sustain, release } = adsr
    const peak = 0.8

    // Attack：0 → 峰值
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(peak, startTime + attack)

    // Decay：峰值 → 持续值
    gainNode.gain.linearRampToValueAtTime(peak * sustain, startTime + attack + decay)

    // Sustain：持续到音符结束前
    // Release：音符结束后淡出
    const releaseStart = startTime + noteDuration
    gainNode.gain.setValueAtTime(peak * sustain, releaseStart)
    gainNode.gain.exponentialRampToValueAtTime(0.001, releaseStart + release)
  }

  // ============================================================
  // 七、旋律序列生成
  // ============================================================

  /**
   * 根据音调类型生成五声音阶旋律序列
   * 使用马尔可夫链风格的状态机，保证旋律流畅自然
   */
  _generateMelodySequence(scale, length, options = {}) {
    const {
      density = 0.6,      // 音符密度（0-1）
      warmth = 0.5,       // 温暖度（影响音域高低）
      pattern = 'flowing' // 旋律走向：flowing(流畅)、leap(跳进)、sparse(稀疏)
    } = options

    const notes = PENTATONIC_SCALES[scale] || PENTATONIC_SCALES.gong
    const sequence = []

    // 初始音：选中间音
    let currentIdx = Math.floor(notes.length / 2)

    for (let i = 0; i < length; i++) {
      // 决定下一个音的走向（状态机）
      const rand = Math.random()

      // 相邻音移动概率最高
      if (rand < 0.5 + density * 0.2) {
        // 邻进：+1 或 -1
        const direction = Math.random() < 0.5 ? 1 : -1
        const nextIdx = Math.max(0, Math.min(notes.length - 1, currentIdx + direction))
        currentIdx = nextIdx
      } else if (rand < 0.8) {
        // 跳进：±2（但不超过音域边界）
        const direction = Math.random() < 0.5 ? 2 : -2
        const nextIdx = Math.max(0, Math.min(notes.length - 1, currentIdx + direction))
        currentIdx = nextIdx
      }
      // else: 重复当前音

      // 八度偏移（warmth 控制）
      let octaveMultiplier = 1
      if (warmth > 0.7) {
        octaveMultiplier = Math.random() < (warmth - 0.5) ? 2 : 1 // 偏暖：偶发高音
      } else if (warmth < 0.3) {
        octaveMultiplier = Math.random() < (0.5 - warmth) ? 0.5 : 1 // 偏冷：偶发低音
      }

      // 音符时值（混合短音和长音，形成节奏感）
      const noteDuration = pattern === 'sparse'
        ? 4 + Math.random() * 4
        : pattern === 'active'
        ? 1 + Math.random() * 1.5
        : 2 + Math.random() * 2 // flowing: 2-4秒

      sequence.push({
        frequency: notes[currentIdx] * octaveMultiplier,
        duration: noteDuration,
        startTime: 0 // 稍后计算
      })
    }

    // 计算累积时间
    let currentTime = 0
    sequence.forEach(note => {
      note.startTime = currentTime
      currentTime += note.duration
    })

    return sequence
  }

  // ============================================================
  // 八、播放旋律（带 ADSR + 混响）
  // ============================================================

  /**
   * 播放五声音阶旋律（完整版）
   * @param {string} scale - 音调类型（gong/shang/jiao/zhi/yu）
   * @param {number} duration - 总时长（秒）
   * @param {Object} options - 播放参数
   */
  playMelody(scale = 'gong', duration = 60, options = {}) {
    const {
      timbre = 'guqin',   // 音色：guqin / guzheng
      rhythm = 'natural',  // 节奏：slow / natural / active
      density = 0.6,       // 音符密度
      warmth = 0.5,        // 温暖度
      reverbWet = 0.3     // 混响比例
    } = options

    this.stop()
    this.init()

    const adsr = RHYTHM_PRESETS[rhythm] || RHYTHM_PRESETS.natural

    // 调整混响比例
    if (this.reverbGain) {
      this.reverbGain.gain.setValueAtTime(reverbWet, this.audioContext.currentTime)
    }

    // 生成旋律序列
    const noteCount = Math.floor((duration / 3) * density) + 3
    const sequence = this._generateMelodySequence(scale, noteCount, {
      density,
      warmth,
      pattern: rhythm === 'slow' ? 'sparse' : rhythm === 'active' ? 'active' : 'flowing'
    })
    this.lastSequence = sequence  // 保存序列供歌词同步使用

    this.isPlaying = true
    this.isPaused = false
    this.currentScale = scale
    this.totalDuration = duration
    this.startTime = this.audioContext.currentTime

    // 淡入
    this.dryGain.gain.setValueAtTime(0, this.audioContext.currentTime)
    this.dryGain.gain.linearRampToValueAtTime(0.7, this.audioContext.currentTime + 2)

    // 调度所有音符
    sequence.forEach((note, index) => {
      const scheduledTime = this.audioContext.currentTime + note.startTime

      // 跳过已经开始播放之后的时间点
      if (scheduledTime < this.audioContext.currentTime) return

      const timeoutId = setTimeout(() => {
        if (!this.isPlaying) return

        const { oscillators, gainNode } = this._createStringOscillator(note.frequency, timbre)

        // 干信号
        gainNode.connect(this.dryGain)
        // 混响信号
        gainNode.connect(this.convolver)

        // 应用 ADSR 包络
        this._applyADSR(gainNode, scheduledTime, note.duration, adsr)

        // 音符结束时停止振荡器
        oscillators.forEach(osc => {
          const stopTime = scheduledTime + note.duration + adsr.release + 0.1
          osc.stop(stopTime)
        })
      }, Math.max(0, (scheduledTime - this.audioContext.currentTime) * 1000))

      this.scheduledTimeouts.push(timeoutId)
    })

    // 整体定时停止
    const stopTimeout = setTimeout(() => this.stop(), duration * 1000 + 500)
    this.scheduledTimeouts.push(stopTimeout)

    return TONE_FREQUENCIES[scale] || TONE_FREQUENCIES.gong
  }

  // ============================================================
  // 九、兼容旧版 API（向后兼容）
  // ============================================================

  playPentatonic(scale = 'gong', duration = 120) {
    // 自动根据体质参数选择音色
    const params = {
      guqin: { timbre: 'guqin', rhythm: 'natural', density: 0.6, warmth: 0.5 },
      shang: { timbre: 'guqin', rhythm: 'natural', density: 0.6, warmth: 0.6 },
      jiao: { timbre: 'guzheng', rhythm: 'slow', density: 0.5, warmth: 0.6 },
      zhi: { timbre: 'guzheng', rhythm: 'active', density: 0.7, warmth: 0.7 },
      yu: { timbre: 'guqin', rhythm: 'slow', density: 0.4, warmth: 0.3 }
    }
    const opt = params[scale] || params.gong
    return this.playMelody(scale, duration, opt)
  }

  playPentatonicWithOptions(scale = 'gong', duration = 120, options = {}) {
    const { rhythm = 'natural', variation = 'rich' } = options
    const rhythmMap = { slow: 'slow', natural: 'natural', active: 'active' }
    const densityMap = { simple: 0.3, rich: 0.6, random: 0.8 }
    return this.playMelody(scale, duration, {
      timbre: 'guqin',
      rhythm: rhythmMap[rhythm] || 'natural',
      density: densityMap[variation] || 0.6,
      warmth: 0.5
    })
  }

  // ============================================================
  // 十、体质直驱播放
  // ============================================================

  /**
   * 根据体质类型自动播放（一步到位）
   * @param {string} constitutionKey - 体质类型键名
   * @param {number} duration - 时长（秒）
   */
  playByConstitution(constitutionKey, duration = 60) {
    const toneKey = CONSTITUTION_TONE_MAP[constitutionKey] || 'gong'
    const params = CONSTITUTION_PARAMS[constitutionKey] || CONSTITUTION_PARAMS.pinghe

    return this.playMelody(toneKey, duration, {
      timbre: params.timbre,
      rhythm: params.rhythm,
      density: params.density,
      warmth: params.warmth,
      reverbWet: params.reverb
    })
  }

  // ============================================================
  // 十一、控制方法
  // ============================================================

  pause() {
    if (!this.isPlaying || this.isPaused) return
    this.isPaused = true
    this.isPlaying = false

    // 清除待执行的定时器
    this.scheduledTimeouts.forEach(id => clearTimeout(id))
    this.scheduledTimeouts = []

    if (this.dryGain) {
      this.dryGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5)
    }
  }

  resume() {
    if (!this.isPaused || this.isPlaying) return
    // 恢复播放需要重新生成（因为 pause 会清除定时器）
    // 这里简化处理：告知用户重新播放
    console.warn('[ToneGenerator] 请重新播放以恢复')
  }

  stop() {
    this.isPlaying = false
    this.isPaused = false

    // 清除所有待执行的定时器
    this.scheduledTimeouts.forEach(id => clearTimeout(id))
    this.scheduledTimeouts = []

    // 淡出
    if (this.dryGain && this.audioContext) {
      this.dryGain.gain.setValueAtTime(this.dryGain.gain.value, this.audioContext.currentTime)
      this.dryGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5)
    }
  }

  setVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        Math.max(0, Math.min(1, value)),
        this.audioContext.currentTime
      )
    }
  }

  fadeIn(duration = 2) {
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime)
      this.masterGain.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + duration)
    }
  }

  fadeOut(duration = 2) {
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration)
    }
  }

  // ============================================================
  // 十二、歌词同步支持
  // ============================================================

  /**
   * 获取当前旋律序列（用于歌词同步）
   * @returns {Array} 音符数组，每个元素包含 { frequency, duration, startTime }
   */
  getMelodySequence() {
    return this.lastSequence
  }

  /**
   * 获取当前音符索引（基于经过的时间）
   * @returns {number} 当前播放到的音符索引
   */
  getCurrentNoteIndex() {
    if (!this.isPlaying || !this.audioContext) return -1
    const elapsed = this.audioContext.currentTime - this.startTime
    let accumulated = 0
    for (let i = 0; i < this.lastSequence.length; i++) {
      accumulated += this.lastSequence[i].duration
      if (elapsed < accumulated) return i
    }
    return this.lastSequence.length - 1
  }

  // ============================================================
  // 十三、获取当前状态
  // ============================================================

  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentScale: this.currentScale,
      totalDuration: this.totalDuration,
      elapsed: this.isPlaying
        ? this.audioContext?.currentTime - this.startTime
        : 0
    }
  }
}

// ============================================================
// 十三、导出单例
// ============================================================

export const toneGenerator = new ToneGenerator()

// 辅助函数
export function getToneByConstitution(constitutionKey) {
  return CONSTITUTION_TONE_MAP[constitutionKey] || 'gong'
}

export function getParamsByConstitution(constitutionKey) {
  return CONSTITUTION_PARAMS[constitutionKey] || CONSTITUTION_PARAMS.pinghe
}
