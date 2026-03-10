/**
 * 国际化配置模块
 * 支持中文、英文、日文三种语言
 */

import { createI18n } from 'vue-i18n'
import zh from './locales/zh'
import en from './locales/en'
import ja from './locales/ja'

/**
 * 消息类型定义，用于类型安全
 */
export type MessageSchema = typeof zh

/**
 * 创建国际化实例
 * - legacy: false 使用 Composition API 风格
 * - locale: 默认语言为中文
 * - fallbackLocale: 备用语言为英文
 */
const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    zh,
    en,
    ja
  }
})

export default i18n
