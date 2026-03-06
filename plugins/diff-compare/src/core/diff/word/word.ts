import { DiffResult, IDiffStrategy } from '../types'
import { TextDiffStrategy } from '../text/myers'

export class WordDiffStrategy implements IDiffStrategy<string> {
  type = 'word' as const
  private textStrategy = new TextDiffStrategy()

  compute(source: string, target: string): DiffResult {
    // Word diff is essentially text diff on paragraphs
    return this.textStrategy.compute(source, target)
  }
}
