import { TextDiffStrategy } from './text/myers'
import { ExcelDiffStrategy } from './excel/excel'
import { WordDiffStrategy } from './word/word'
import { ImageDiffStrategy } from './image/image'
import { DiffType, IDiffStrategy } from './types'

const strategies: Record<DiffType, IDiffStrategy> = {
    text: new TextDiffStrategy(),
    excel: new ExcelDiffStrategy(),
    word: new WordDiffStrategy(),
    image: new ImageDiffStrategy()
}

self.onmessage = (e: MessageEvent) => {
    const { type, source, target, requestId } = e.data as {
        type: DiffType
        source: any
        target: any
        requestId: number
    }

    try {
        const strategy = strategies[type] || strategies.text
        const result = strategy.compute(source, target)
        self.postMessage({ requestId, result })
    } catch (error) {
        self.postMessage({ requestId, error: String(error) })
    }
}
