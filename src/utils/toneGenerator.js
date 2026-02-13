// 五音频率生成器
// 使用Web Audio API生成五音对应频率的养生音乐

// 五音频率（Hz）- 基于中医五音对五脏理论
export const TONE_FREQUENCIES = {
  gong: {  // 宫 - 脾
    frequency: 261.63,  // C4
    name: '宫',
    organ: '脾',
    description: '宫调厚重稳健，健脾和胃'
  },
  shang: {  // 商 - 肺
    frequency: 293.66,  // D4
    name: '商',
    organ: '肺',
    description: '商调清亮肃静，宣肺理气'
  },
  jiao: {  // 角 - 肝
    frequency: 329.63,  // E4
    name: '角',
    organ: '肝',
    description: '角调舒展生发，疏肝解郁'
  },
  zhi: {  // 徵 - 心
    frequency: 392.00,  // G4
    name: '徵',
    organ: '心',
    description: '徵调热烈欢快，养心安神'
  },
  yu: {  // 羽 - 肾
    frequency: 440.00,  // A4
    name: '羽',
    organ: '肾',
    description: '羽调深沉悠远，补肾固精'
  }
}

// 五脏对应频率（432Hz宇宙频率）
export const ORGAN_FREQUENCIES = {
  heart: 432,    // 心 - 432Hz 宇宙频率
  liver: 417,    // 肝
  spleen: 396,    // 脾
  lung: 384,     // 肺
  kidney: 396     // 肾
}

// 音阶频率（十二平均律）
export const SCALE_FREQUENCIES = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25
}

class ToneGenerator {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.isPlaying = false
    this.oscillators = []
    this.currentTone = null
    this.noteInterval = null
  }

  // 初始化音频上下文
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.masterGain.gain.value = 0.3
    }
    return this.audioContext
  }

  // 生成柔和的正弦波音色
  createOscillator(frequency, type = 'sine') {
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime)

    gain.gain.setValueAtTime(0, this.audioContext.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.5)
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 1)
    gain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 3)

    osc.connect(gain)
    gain.connect(this.masterGain)

    return { osc, gain }
  }

  // 播放五声音阶（宫商角徵羽）
  playPentatonic(scale = 'gong', duration = 120) {
    const scaleNotes = {
      gong: [261.63, 293.66, 329.63, 392.00, 440.00],
      shang: [293.66, 329.63, 392.00, 440.00, 523.25],
      jiao: [329.63, 392.00, 440.00, 523.25, 587.33],
      zhi: [392.00, 440.00, 523.25, 587.33, 659.25],
      yu: [440.00, 523.25, 587.33, 659.25, 783.99]
    }

    const notes = scaleNotes[scale] || scaleNotes.gong

    this.init()
    this.stop()

    this.isPlaying = true
    let noteIndex = 0

    const playNote = () => {
      if (!this.isPlaying || noteIndex >= notes.length * 10) {
        this.stop()
        return
      }

      const freq = notes[noteIndex % notes.length]
      const { osc, gain } = this.createOscillator(freq, 'sine')
      osc.start()

      setTimeout(() => {
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5)
        setTimeout(() => {
          try { osc.stop() } catch(e) {}
        }, 500)
      }, 3500)

      noteIndex++
      this.noteInterval = setTimeout(playNote, 4000)
    }

    playNote()

    // 定时停止
    setTimeout(() => {
      if (this.isPlaying) {
        this.stop()
      }
    }, duration * 1000)

    return TONE_FREQUENCIES[scale] || TONE_FREQUENCIES.gong
  }

  // 停止播放
  stop() {
    this.isPlaying = false

    if (this.noteInterval) {
      clearTimeout(this.noteInterval)
      this.noteInterval = null
    }

    this.oscillators.forEach(({ osc, gain }) => {
      try {
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1)
        setTimeout(() => {
          try { osc.stop() } catch(e) {}
        }, 150)
      } catch(e) {}
    })

    this.oscillators = []
  }

  // 设置音量
  setVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value))
    }
  }

  // 淡入
  fadeIn(duration = 2) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime)
      this.masterGain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + duration)
    }
  }

  // 淡出
  fadeOut(duration = 2) {
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration)
    }
  }
}

// 导出单例
export const toneGenerator = new ToneGenerator()

// 根据体质获取对应音调
export function getToneByConstitution(constitutionKey) {
  const toneMap = {
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
  return toneMap[constitutionKey] || 'gong'
}
