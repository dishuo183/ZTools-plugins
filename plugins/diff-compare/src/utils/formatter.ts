import beautifier from 'js-beautify'
import hljs from 'highlight.js'

// 语言配置：value(用户选择) -> hljs(highlight.js用) / label(显示名称)
export const LANGUAGES: { value: string; hljs: string; label: string }[] = [
  { value: 'json', hljs: 'json', label: 'JSON' },
  { value: 'yaml', hljs: 'yaml', label: 'YAML' },
  { value: 'yml', hljs: 'yaml', label: 'YAML' },
  { value: 'html', hljs: 'xml', label: 'HTML' },
  { value: 'xml', hljs: 'xml', label: 'XML' },
  { value: 'css', hljs: 'css', label: 'CSS' },
  { value: 'javascript', hljs: 'javascript', label: 'JavaScript' },
  { value: 'js', hljs: 'javascript', label: 'JavaScript' },
  { value: 'typescript', hljs: 'typescript', label: 'TypeScript' },
  { value: 'ts', hljs: 'typescript', label: 'TypeScript' },
  { value: 'python', hljs: 'python', label: 'Python' },
  { value: 'py', hljs: 'python', label: 'Python' },
  { value: 'c', hljs: 'c', label: 'C' },
  { value: 'cpp', hljs: 'cpp', label: 'C++' },
  { value: 'c++', hljs: 'cpp', label: 'C++' },
  { value: 'java', hljs: 'java', label: 'Java' },
  { value: 'rust', hljs: 'rust', label: 'Rust' },
  { value: 'rs', hljs: 'rust', label: 'Rust' },
  { value: 'go', hljs: 'go', label: 'Go' },
  { value: 'golang', hljs: 'go', label: 'Go' },
  { value: 'sql', hljs: 'sql', label: 'SQL' },
  { value: 'markdown', hljs: 'markdown', label: 'Markdown' },
  { value: 'md', hljs: 'markdown', label: 'Markdown' },
  { value: 'shell', hljs: 'bash', label: 'Shell' },
  { value: 'sh', hljs: 'bash', label: 'Shell' },
  { value: 'bash', hljs: 'bash', label: 'Shell' },
  { value: 'ruby', hljs: 'ruby', label: 'Ruby' },
  { value: 'rb', hljs: 'ruby', label: 'Ruby' },
  { value: 'php', hljs: 'php', label: 'PHP' },
  { value: 'swift', hljs: 'swift', label: 'Swift' },
  { value: 'kotlin', hljs: 'kotlin', label: 'Kotlin' },
  { value: 'cs', hljs: 'csharp', label: 'C#' },
  { value: 'csharp', hljs: 'csharp', label: 'C#' },
]

// hljs语言名 -> 用户选择value的映射（从LANGUAGES自动生成）
export const HLJS_TO_VALUE: Record<string, string> = Object.fromEntries(
  LANGUAGES.map(l => [l.hljs, l.value])
)

/**
 * Enhanced code formatter supporting multiple programming languages.
 */
export function formatCode(text: string, lang: string = 'auto'): string {
  if (!text || typeof text !== 'string') return text || ''

  const trimmed = text.trim()
  if (!trimmed) return text

  const baseOptions: beautifier.CoreBeautifyOptions = {
    indent_size: 2,
    indent_char: ' ',
    max_preserve_newlines: 2,
    preserve_newlines: true,
    end_with_newline: false,
    wrap_line_length: 0,
    indent_empty_lines: false
  }

  const jsOptions: beautifier.JSBeautifyOptions = {
    ...baseOptions,
    brace_style: 'collapse',
    keep_array_indentation: false,
    break_chained_methods: false,
    space_before_conditional: true,
    unescape_strings: false,
    jslint_happy: false,
    e4x: false,
    comma_first: false,
  }

  const htmlOptions: beautifier.HTMLBeautifyOptions = {
    ...baseOptions,
    indent_inner_html: false,
    indent_scripts: 'normal',
  }

  const cssOptions: beautifier.CSSBeautifyOptions = {
    ...baseOptions,
    newline_between_rules: true,
    selector_separator_newline: true,
  }

  const l = (lang || 'auto').toLowerCase()

  try {
    // 1. JSON (Strict)
    if (l === 'json' || (l === 'auto' && (trimmed.startsWith('{') || trimmed.startsWith('[')))) {
      try {
        const obj = JSON.parse(trimmed)
        return JSON.stringify(obj, null, 2)
      } catch (e) {
        if (l === 'json') return beautifier.js(text, jsOptions)
      }
    }

    // 2. Web Languages
    if (['html', 'xml', 'svg', 'vue'].includes(l)) {
      return beautifier.html(text, htmlOptions)
    }

    if (['css', 'scss', 'less'].includes(l)) {
      return beautifier.css(text, cssOptions)
    }

    if (['javascript', 'typescript', 'js', 'ts', 'jsx', 'tsx'].includes(l)) {
      return beautifier.js(text, jsOptions)
    }

    // 3. C-Style / Brace Languages
    if (['c', 'cpp', 'java', 'rust', 'go', 'cs', 'php', 'swift', 'kotlin'].includes(l)) {
      return beautifier.js(text, {
        ...jsOptions,
        brace_style: 'expand',
      })
    }

    // 4. SQL
    if (l === 'sql') {
      return formatSql(text)
    }

    // 5. YAML
    if (l === 'yaml' || l === 'yml') {
      return formatYaml(text)
    }

    // Heuristic detection
    if (l === 'auto') {
      if (trimmed.startsWith('<')) return beautifier.html(text, htmlOptions)
      if (text.includes('{') && text.includes('}')) return beautifier.js(text, jsOptions)
      if (text.includes('SELECT ') && text.includes(' FROM ')) return formatSql(text)
    }

  } catch (err) {
    console.warn('Formatting failed:', err)
  }

  return text
}

/**
 * Detects the programming language of a given text using highlight.js.
 */
export function detectLanguage(text: string): string {
  if (!text || typeof text !== 'string') return 'text'
  const trimmed = text.trim()
  if (!trimmed) return 'text'

  try {
    const result = hljs.highlightAuto(trimmed)
    const language = result.language
    if (language) {
      return HLJS_TO_VALUE[language] || language
    }
  } catch (e) {
    console.warn('Language detection failed:', e)
  }

  return 'text'
}

function formatSql(sql: string): string {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'GROUP BY', 'ORDER BY',
    'LIMIT', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
    'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'ON', 'HAVING', 'UNION'
  ]

  let result = sql.replace(/\s+/g, ' ').trim()
  keywords.forEach(key => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi')
    result = result.replace(regex, (match) => `\n${match.toUpperCase()}`)
  })

  return result
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .join('\n')
}

function formatYaml(text: string): string {
  return text
    .split(/\r?\n/)
    .map(line => line.replace(/\s+$/, ''))
    .join('\n')
    .trim()
}
