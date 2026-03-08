/**
 * @fileoverview 文本差异比较策略
 * @module core/diff/text/text
 * @description 提供基于行的文本差异比较功能，支持字符级高亮
 */

import { diffArrays } from 'diff';
import { DiffResult, IDiffStrategy } from '../types';

/**
 * 文本差异比较策略
 * @class TextDiffStrategy
 * @implements IDiffStrategy<string>
 * @description 使用 diff 库的 diffArrays 实现高效的文本行级差异比较
 * @example
 * ```typescript
 * const strategy = new TextDiffStrategy();
 * const result = strategy.diff(
 *   ['line 1', 'line 2'],
 *   ['line 1', 'line 3']
 * );
 * ```
 */
export class TextDiffStrategy implements IDiffStrategy<string> {
  /** 策略类型标识 */
  type = 'text' as const

  /**
   * 执行文本差异比较
   * @param source - 源文本数组（按行分割）
   * @param target - 目标文本数组（按行分割）
   * @returns 差异比较结果数组
   * @description 将 diff 库的数组比较结果转换为统一的 DiffResult 格式
   */
  diff(source: string[], target: string[]): DiffResult<string>[] {
    const changes = diffArrays(source, target)
    const result: DiffResult<string>[] = []

    let i = 0
    let j = 0

    for (const part of changes) {
      if (!part.added && !part.removed) {
        // 相等部分
        for (const value of part.value) {
          result.push({
            type: 'equal',
            source: value,
            target: value
          })
          i++
          j++
        }
      } else if (part.removed) {
        // 删除部分
        for (const value of part.value) {
          result.push({
            type: 'delete',
            source: value
          })
          i++
        }
      } else if (part.added) {
        // 插入部分
        for (const value of part.value) {
          result.push({
            type: 'insert',
            target: value
          })
          j++
        }
      }
    }

    return result
  }
}
