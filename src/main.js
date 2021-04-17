import { createApp } from 'vue'
import VWave from 'v-wave'
import Swal from 'sweetalert2'
import { store } from './store'
import App from '@/App'
import '@/assets/css/main.css'

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})

const app = createApp(App)
  .use(store)
  .use(VWave)
  .provide('Swal', Swal)
  .provide('Toast', Toast)

// app.config.globalProperties.$Swal = Swal
app.mount('#app')
