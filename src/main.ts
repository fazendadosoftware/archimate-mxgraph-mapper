import { createApp } from 'vue'
import App from './App.vue'
import VWave from 'v-wave'
import 'tailwindcss/tailwind.css'

const app = createApp(App)
app
  .use(VWave)
  .mount('#app')
