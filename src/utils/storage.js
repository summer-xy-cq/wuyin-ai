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
  ANSWERS_TEMP: 'wuyin_answers_temp'
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

// 兼容旧代码的默认导出
export default storage
