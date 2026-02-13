/**
 * 本地存储封装工具
 * 统一管理 localStorage 操作，避免 key 分散在代码各处
 */

// 存储键名统一管理
export const STORAGE_KEYS = {
  CONSTITUTION: 'wuyin_current_constitution',
  HISTORY: 'wuyin_history',
  VIP: 'wuyin_vip',
  RESEARCH: 'wuyin_research',
  DAILY_USAGE: 'wuyin_daily_usage',
  FEEDBACK: 'wuyin_feedback',
  ANSWERS: 'wuyin_answers',
  ANSWERS_TEMP: 'wuyin_answers_temp',
  PLAYBACK_CACHE: 'wuyin_playback_cache'      // 播放数据缓存（防丢失）
}

/**
 * 存储工具对象
 */
export const storage = {
  /**
   * 获取数据
   * @param {string} key - STORAGE_KEYS 中的 key
   * @returns {any} 解析后的数据，失败返回 null
   */
  get(key) {
    try {
      const storageKey = STORAGE_KEYS[key]
      if (!storageKey) {
        console.warn(`[storage] Unknown key: ${key}`)
        return null
      }
      const data = localStorage.getItem(storageKey)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('[storage] Get error:', e)
      return null
    }
  },

  /**
   * 保存数据
   * @param {string} key - STORAGE_KEYS 中的 key
   * @param {any} value - 要保存的数据
   */
  set(key, value) {
    try {
      const storageKey = STORAGE_KEYS[key]
      if (!storageKey) {
        console.warn(`[storage] Unknown key: ${key}`)
        return
      }
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch (e) {
      console.error('[storage] Set error:', e)
    }
  },

  /**
   * 删除指定 key
   * @param {string} key - STORAGE_KEYS 中的 key
   */
  remove(key) {
    try {
      const storageKey = STORAGE_KEYS[key]
      if (!storageKey) return
      localStorage.removeItem(storageKey)
    } catch (e) {
      console.error('[storage] Remove error:', e)
    }
  },

  /**
   * 清空所有数据（危险操作！）
   */
  clear() {
    try {
      localStorage.clear()
    } catch (e) {
      console.error('[storage] Clear error:', e)
    }
  }
}

/**
 * 播放数据缓存系统 - 防止数据丢失
 * 艹！用户杀App、关网页时 onUnmounted 根本不触发，必须定期保存！
 */
export const playbackCache = {
  /**
   * 缓存播放数据
   * @param {object} data - 播放数据
   */
  save(data) {
    const cache = storage.get('PLAYBACK_CACHE') || {}
    const sessionId = data.sessionId || cache.sessionId || Date.now().toString()

    storage.set('PLAYBACK_CACHE', {
      ...cache,
      ...data,
      sessionId,
      lastUpdate: new Date().toISOString()
    })
  },

  /**
   * 获取缓存的播放数据
   * @returns {object|null} 缓存数据
   */
  get() {
    return storage.get('PLAYBACK_CACHE')
  },

  /**
   * 清除缓存
   */
  clear() {
    storage.remove('PLAYBACK_CACHE')
  },

  /**
   * 同步到历史记录
   * @returns {boolean} 是否成功同步
   */
  syncToHistory() {
    const cache = this.get()
    if (!cache || !cache.listenDuration) return false

    const history = storage.get('HISTORY') || []
    if (history.length === 0) return false

    // 更新最新记录
    if (!history[0].feedback) {
      history[0].feedback = {}
    }
    history[0].feedback.listenDuration = cache.listenDuration
    history[0].feedback.musicType = cache.musicType
    history[0].feedback.lastUpdate = cache.lastUpdate

    storage.set('HISTORY', history)
    return true
  }
}

// 兼容旧代码的默认导出
export default storage
