/**
 * 主题管理Composable
 * 提供主题模式切换、暗黑模式检测等功能
 */

import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 全局窗口类型扩展
 */
declare global {
    interface Window {
        ztools?: {
            isDarkColors?: () => boolean
        }
    }
}

/**
 * 主题模式类型
 */
export type ThemeMode = 'system' | 'light' | 'dark'

/**
 * 主题管理Composable
 * 管理应用的主题切换和系统主题检测
 */
export function useTheme() {
    /** 当前主题模式 */
    const themeMode = ref<ThemeMode>('system')
    /** 是否为暗黑模式 */
    const isDark = ref(true)
    /** 媒体查询列表，用于监听系统主题变化 */
    let mediaQuery: MediaQueryList | null = null

    /**
     * 获取系统主题
     * @returns 是否为暗黑模式
     */
    const getSystemTheme = (): boolean => {
        if (window.ztools?.isDarkColors) {
            return window.ztools.isDarkColors()
        }
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
    }

    /**
     * 更新主题应用状态
     */
    const updateTheme = () => {
        let dark: boolean
        if (themeMode.value === 'system') {
            dark = getSystemTheme()
        } else {
            dark = themeMode.value === 'dark'
        }
        isDark.value = dark
        document.documentElement.classList.toggle('dark', dark)
    }

    /**
     * 设置主题模式
     * @param mode - 主题模式
     */
    const setThemeMode = (mode: ThemeMode) => {
        themeMode.value = mode
        if(window.ztools?.dbStorage?.setItem){
            window.ztools.dbStorage.setItem('theme-mode', mode)
        }else{
            localStorage.setItem('theme-mode', mode)
        }
        updateTheme()
    }

    /**
     * 循环切换主题模式
     * 顺序：system -> light -> dark -> system
     */
    const cycleTheme = () => {
        const modes: ThemeMode[] = ['system', 'light', 'dark']
        const currentIndex = modes.indexOf(themeMode.value)
        const nextIndex = (currentIndex + 1) % modes.length
        setThemeMode(modes[nextIndex])
    }

    /**
     * 初始化主题
     * 从存储中读取保存的主题设置并应用
     */
    const initTheme = () => {
        const saved = window.ztools?.dbStorage?.getItem('theme-mode') as ThemeMode | null ?? localStorage.getItem('theme-mode') as ThemeMode | null
        if (saved && ['system', 'light', 'dark'].includes(saved)) {
            themeMode.value = saved
        }
        updateTheme()
    }

    /**
     * 处理系统主题变化事件
     * 仅当主题模式为 system 时更新主题
     */
    const handleSystemThemeChange = () => {
        if (themeMode.value === 'system') {
            updateTheme()
        }
    }

    /**
     * 组件挂载时初始化主题并监听系统主题变化
     */
    onMounted(() => {
        initTheme()

        mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
        mediaQuery?.addEventListener('change', handleSystemThemeChange)
    })

    /**
     * 组件卸载时移除事件监听
     */
    onUnmounted(() => {
        mediaQuery?.removeEventListener('change', handleSystemThemeChange)
    })

    return {
        themeMode,
        isDark,
        setThemeMode,
        cycleTheme
    }
}