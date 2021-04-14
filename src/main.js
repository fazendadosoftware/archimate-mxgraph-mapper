import { createApp } from 'vue'
import VWave from 'v-wave'
import Swal from 'sweetalert2'
import App from '@/App'
import '@/assets/css/main.css'

const app = createApp(App)
  .use(VWave)

app.config.globalProperties.$Swal = Swal
app.mount('#app')
