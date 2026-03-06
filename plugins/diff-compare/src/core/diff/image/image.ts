import { DiffResult, IDiffStrategy } from '../types'

export class ImageDiffStrategy implements IDiffStrategy<string> {
  type = 'image' as const

  compute(source: string, target: string): DiffResult {
    // Image diff is essentially pixel diff
    return {
        type: this.type,
        chunks: [],
    }
  }
}
