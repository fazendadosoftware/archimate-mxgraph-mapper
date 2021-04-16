import { createApp } from 'vue'
import VWave from 'v-wave'
import Swal from 'sweetalert2'
import { store } from './store'
import App from '@/App'
import '@/assets/css/main.css'

const app = createApp(App)
  .use(store)
  .use(VWave)
  .provide('Swal', Swal)

// app.config.globalProperties.$Swal = Swal
app.mount('#app')
