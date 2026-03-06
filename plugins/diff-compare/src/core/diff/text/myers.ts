import { DiffChunk, DiffResult, IDiffStrategy } from '../types'

export class TextDiffStrategy implements IDiffStrategy<string> {
  type = 'text' as const

  compute(source: string, target: string): DiffResult {
    const sourceLines = source === '' ? [] : source.split(/\r?\n/)
    const targetLines = target === '' ? [] : target.split(/\r?\n/)

    let chunks = this.myersDiff(sourceLines, targetLines)
    chunks = this.processIntraLineDiff(chunks)

    return {
      type: 'text',
      chunks,
      sourceLineCount: sourceLines.length,
      targetLineCount: targetLines.length
    }
  }

  /**
   * Post-process chunks to find adjacent delete/insert pairs and compute intra-line diff
   */
  private processIntraLineDiff(chunks: DiffChunk[]): DiffChunk[] {
    const result: DiffChunk[] = []
    
    for (let i = 0; i < chunks.length; i++) {
      const current = chunks[i]
      const next = chunks[i + 1]

      if (current.type === 'delete' && next && next.type === 'insert') {
        // Potential modified line pair
        // For simplicity in this first pass, we only pair 1:1. 
        // A more advanced version would handle N:M pairings.
        const intraSource = current.value
        const intraTarget = next.value

        // Heuristic: if lines are somewhat similar, compute intra-line diff
        const subChunks = this.computeIntraLine(intraSource, intraTarget)
        
        result.push({
          type: 'modified',
          value: intraSource, // Source side
          value2: intraTarget, // Target side (newly added to type)
          subChunks
        })
        
        // Skip the 'insert' chunk as we merged it
        i++
      } else {
        result.push(current)
      }
    }
    return result
  }

  /**
   * Compute character-level diff between two strings
   */
  private computeIntraLine(a: string, b: string): DiffChunk[] {
    const charsA = [...a]
    const charsB = [...b]
    return this.myersDiff(charsA, charsB)
  }

  /**
   * Basic Myers shortest edit script (SES) algorithm
   * Works on any array type T
   */
  private myersDiff<T>(a: T[], b: T[]): DiffChunk[] {
    const n = a.length
    const m = b.length
    const max = n + m
    if (max === 0) return []

    // Use Int32Array for better performance
    // The range of k is [-d, d], so we need 2 * max + 1 entries.
    // We map k to index k + max.
    const v = new Int32Array(2 * max + 1)
    v[max + 1] = 0
    
    const trace: Int32Array[] = []

    for (let d = 0; d <= max; d++) {
      const vCopy = new Int32Array(v)
      trace.push(vCopy)

      for (let k = -d; k <= d; k += 2) {
        let x: number
        const idx = k + max
        const down = (k === -d || (k !== d && v[idx - 1] < v[idx + 1]))
        if (down) {
          x = v[idx + 1]
        } else {
          x = v[idx - 1] + 1
        }
        let y = x - k

        while (x < n && y < m && a[x] === b[y]) {
          x++
          y++
        }
        v[idx] = x

        if (x >= n && y >= m) {
          return this.backtrack(trace, a, b, max)
        }
      }
    }
    return []
  }

  /**
   * Backtrack through the trace to build the sequence of edits
   */
  private backtrack<T>(trace: Int32Array[], a: T[], b: T[], max: number): DiffChunk[] {
    const result: DiffChunk[] = []
    let x = a.length
    let y = b.length

    for (let d = trace.length - 1; d >= 0; d--) {
      const v = trace[d]
      const k = x - y
      const idx = k + max
      let prevK: number

      if (k === -d || (k !== d && v[idx - 1] < v[idx + 1])) {
        prevK = k + 1
      } else {
        prevK = k - 1
      }

      const prevX = v[prevK + max]
      const prevY = prevX - prevK

      while (x > prevX && y > prevY) {
        result.push({ type: 'equal', value: String(a[x - 1]) })
        x--
        y--
      }

      if (d > 0) {
        if (x === prevX) {
          result.push({ type: 'insert', value: String(b[y - 1]) })
          y--
        } else {
          result.push({ type: 'delete', value: String(a[x - 1]) })
          x--
        }
      }
    }

    return result.reverse()
  }
}
