/**
 * 应用程序入口文件
 * 负责初始化 Vue 应用、Pinia 状态管理和国际化配置
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'virtual:svg-icons-register'
import '@/assets/styles/main.scss'
import App from './App.vue'
import i18n from './i18n'

/**
 * 创建 Vue 应用实例
 */
const app = createApp(App)

/**
 * 创建 Pinia 状态管理实例
 */
const pinia = createPinia()

/**
 * 安装插件并挂载应用
 * - pinia: Vue 3 状态管理库
 * - i18n: 国际化支持
 */
app.use(pinia)
.use(i18n)
.mount('#app')
