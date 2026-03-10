/**
 * 设置状态管理模块
 * 提供应用设置的全局状态管理功能
 */

import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

/**
 * 设置状态存储
 * 管理应用的配置选项
 */
export const useSettingsStore = defineStore('settings', () => {
    /**
     * 是否自动格式化代码
     * 使用 shallowRef 优化性能，因为不需要深层响应
     */
    const autoFormat = shallowRef(true)

    /**
     * 设置自动格式化选项
     * @param value - 是否启用自动格式化
     */
    const setAutoFormat = (value: boolean) => {
        autoFormat.value = value
    }

    return {
        autoFormat,
        setAutoFormat
    }
})
