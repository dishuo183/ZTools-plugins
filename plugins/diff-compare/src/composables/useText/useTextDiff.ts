/**
 * 文本差异比较Composable
 * 提供文本对比功能，包括差异计算、导航、同步滚动等
 */

import { ref, shallowRef, computed, watch, onUnmounted } from 'vue'
import { Change } from 'diff'

/**
 * 差异行数据类型
 */
interface DiffLine {
    /** 行类型：equal-相同, delete-删除, insert-插入, modify-修改 */
    type: 'equal' | 'delete' | 'insert' | 'modify'
    /** 行内容 */
    value: string
    /** 左侧行号（源文本） */
    leftLineNum?: number
    /** 右侧行号（目标文本） */
    rightLineNum?: number
    /** 行内差异变化列表 */
    inlineChanges?: Change[]
    /** 源文本值（用于修改行） */
    sourceValue?: string
    /** 目标文本值（用于修改行） */
    targetValue?: string
}

/**
 * 文本差异比较Composable
 * 提供完整的文本对比功能
 */
export function useTextDiff() {
    /** 源文本内容 */
    const sourceText = ref('')
    /** 目标文本内容 */
    const targetText = ref('')
    /** 差异比较结果行列表 */
    const diffLines = ref<DiffLine[]>([])
    /** 是否正在执行差异比较 */
    const isDiffing = ref(false)

    /** Web Worker 实例，用于后台执行差异计算 */
    let diffWorker: Worker | null = null
    /** 当前请求ID，用于处理异步响应匹配 */
    let currentRequestId = 0
    /** 防抖定时器 */
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    /**
     * 执行差异计算
     * 使用防抖优化性能，避免频繁计算
     * @param source - 源文本
     * @param target - 目标文本
     */
    const computeDiff = (source: string, target: string) => {
        if (debounceTimer) clearTimeout(debounceTimer)

        debounceTimer = setTimeout(() => {
            if (!diffWorker) {
                diffWorker = new Worker(new URL('@/core/diff/diff.worker.ts', import.meta.url), { type: 'module' })
                diffWorker.onmessage = (e) => {
                    const { requestId, result } = e.data
                    if (requestId === currentRequestId) {
                        const lines: DiffLine[] = []
                        let leftNum = 1
                        let rightNum = 1

                        for (const chunk of result) {
                            if (chunk.type === 'equal') {
                                lines.push({
                                    type: 'equal',
                                    value: chunk.source || '',
                                    leftLineNum: leftNum++,
                                    rightLineNum: rightNum++,
                                })
                            } else if (chunk.type === 'delete') {
                                lines.push({
                                    type: 'delete',
                                    value: chunk.source || '',
                                    leftLineNum: leftNum++,
                                })
                            } else if (chunk.type === 'insert') {
                                lines.push({
                                    type: 'insert',
                                    value: chunk.target || '',
                                    rightLineNum: rightNum++,
                                })
                            } else if (chunk.type === 'modify') {
                                const sourceLine = chunk.source || ''
                                const targetLine = chunk.target || ''
                                lines.push({
                                    type: 'modify',
                                    value: sourceLine,
                                    sourceValue: sourceLine,
                                    targetValue: targetLine,
                                    leftLineNum: leftNum++,
                                    rightLineNum: rightNum++,
                                })
                            }
                        }

                        diffLines.value = lines
                        isDiffing.value = false
                    }
                }
            }

            isDiffing.value = true
            const requestId = ++currentRequestId
            const sourceLines = source === '' ? [] : source.split('\n')
            const targetLines = target === '' ? [] : target.split('\n')
            diffWorker.postMessage({ type: 'text', source: sourceLines, target: targetLines, requestId })
        }, 300)
    }

    /**
     * 监听源文本和目标文本变化，自动重新计算差异
     */
    watch([sourceText, targetText], ([source, target]) => computeDiff(source, target), { immediate: true })

    /**
     * 组件卸载时清理Worker资源
     */
    onUnmounted(() => {
        if (diffWorker) {
            diffWorker.terminate()
            diffWorker = null
        }
    })

    /**
     * 左侧面板（源文本）的差异行
     * 包含相同、删除和修改的行
     */
    const leftLines = computed(() => {
        return diffLines.value
            .filter(line => line.type === 'equal' || line.type === 'delete' || line.type === 'modify')
            .map((line, idx) => ({
                type: line.type,
                value: line.type === 'modify' ? line.sourceValue || '' : line.value,
                lineNum: line.leftLineNum,
                idx,
            }))
    })

    /**
     * 右侧面板（目标文本）的差异行
     * 包含相同、插入和修改的行
     */
    const rightLines = computed(() => {
        return diffLines.value
            .filter(line => line.type === 'equal' || line.type === 'insert' || line.type === 'modify')
            .map((line, idx) => ({
                type: line.type,
                value: line.type === 'modify' ? line.targetValue || '' : line.value,
                lineNum: line.rightLineNum,
                idx,
            }))
    })

    /** 新增行数统计 */
    const insertedCount = computed(() => diffLines.value.filter(l => l.type === 'insert').length)
    /** 删除行数统计 */
    const deletedCount = computed(() => diffLines.value.filter(l => l.type === 'delete').length)
    /** 修改行数统计 */
    const modifiedCount = computed(() => diffLines.value.filter(l => l.type === 'modify').length)

    /** 差异行的索引列表（排除相同行） */
    const changeIndices = computed(() => {
        return diffLines.value
            .map((line, i) => (line.type !== 'equal' ? i : -1))
            .filter(i => i >= 0)
    })

    /** 总差异数 */
    const totalChanges = computed(() => changeIndices.value.length)

    /**
     * 统一格式的差异行（用于统一视图）
     */
    const unifiedDiffLines = computed(() => {
        const lines: Array<{
            type: 'equal' | 'delete' | 'insert'
            value: string
            leftNo?: number
            rightNo?: number
            inlineChanges?: Change[]
            idx: number
        }> = []

        for (const line of diffLines.value) {
            if (line.type === 'modify') {
                lines.push({
                    type: 'delete',
                    value: line.sourceValue || '',
                    leftNo: line.leftLineNum,
                    idx: lines.length,
                })
                lines.push({
                    type: 'insert',
                    value: line.targetValue || '',
                    rightNo: line.rightLineNum,
                    idx: lines.length,
                })
            } else {
                lines.push({
                    type: line.type,
                    value: line.value,
                    leftNo: line.leftLineNum,
                    rightNo: line.rightLineNum,
                    inlineChanges: line.inlineChanges,
                    idx: lines.length,
                })
            }
        }
        return lines
    })

    /**
     * 交换源文本和目标文本
     */
    const swapTexts = () => {
        const temp = sourceText.value
        sourceText.value = targetText.value
        targetText.value = temp
    }

    /** 每一行的高度（像素），用于计算滚动位置 */
    const LINE_HEIGHT = 24
    /** 当前差异项的索引位置 */
    const currentChangeIdx = ref(-1)
    /** 滚动回调函数列表，用于同步滚动 */
    const scrollCallbacks = ref<((scrollTop: number) => void)[]>([])

    /**
     * 注册滚动回调函数
     * @param callback - 滚动回调函数
     * @returns 取消注册的函数
     */
    const registerScrollCallback = (callback: (scrollTop: number) => void) => {
        scrollCallbacks.value.push(callback)
        return () => {
            const idx = scrollCallbacks.value.indexOf(callback)
            if (idx > -1) scrollCallbacks.value.splice(idx, 1)
        }
    }

    /**
     * 获取差异行的滚动位置
     * @param diffLineIdx - 差异行索引
     * @returns 滚动距离（像素）
     */
    const getScrollPosition = (diffLineIdx: number) => {
        return diffLineIdx * LINE_HEIGHT
    }

    /**
     * 滚动到指定的差异行
     * @param diffLineIdx - 差异行索引
     */
    const scrollToChange = (diffLineIdx: number) => {
        const scrollTop = getScrollPosition(diffLineIdx)
        scrollCallbacks.value.forEach(cb => cb(scrollTop))
    }

    /**
     * 跳转到上一个差异点
     */
    const goToPrevChange = () => {
        if (totalChanges.value === 0) return
        const newIdx = currentChangeIdx.value <= 0 ? totalChanges.value - 1 : currentChangeIdx.value - 1
        currentChangeIdx.value = newIdx
        scrollToChange(changeIndices.value[newIdx])
    }

    /**
     * 跳转到下一个差异点
     */
    const goToNextChange = () => {
        if (totalChanges.value === 0) return
        const newIdx = currentChangeIdx.value >= totalChanges.value - 1 ? 0 : currentChangeIdx.value + 1
        currentChangeIdx.value = newIdx
        scrollToChange(changeIndices.value[newIdx])
    }

    /**
     * 重置导航状态
     * 将当前差异索引重置为-1
     */
    const resetNavigation = () => {
        currentChangeIdx.value = -1
    }

    return {
        sourceText,
        targetText,
        diffLines,
        isDiffing,
        leftLines,
        rightLines,
        insertedCount,
        deletedCount,
        modifiedCount,
        changeIndices,
        totalChanges,
        unifiedDiffLines,
        swapTexts,
        currentChangeIdx,
        goToPrevChange,
        goToNextChange,
        resetNavigation,
        registerScrollCallback,
        getScrollPosition,
    }
}
