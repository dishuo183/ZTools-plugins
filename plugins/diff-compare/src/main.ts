import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/assets/styles/main.scss'
import App from './App.vue'
import i18n from './i18n'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
.use(i18n)
.mount('#app')
