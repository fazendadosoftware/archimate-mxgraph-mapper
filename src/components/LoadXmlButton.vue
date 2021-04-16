<template>
  <button
    v-wave
    type="button"
    class="relative border-box inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-0">
    Load Archimate XML File
    <input
      @change="event => loadFile('archimate')"
      class="absolute w-full left-0 opacity-0"
      type="file"
      accept="application/json,*.json">
  </button>
</template>


<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'
export default {
  computed: {
    ...mapGetters(['isAuthenticated']),
  },
  methods: {
    ...mapActions(['getAccessToken', 'fetchVisualizerBookmarks']),
    ...mapMutations(['setAccessToken']),
    loadFile (event, type) {
      const { target: { files } } = event
      if (!files.length) return
      let reader = new FileReader()
      reader.onload = async e => {
        if (type === 'credentials') {
          let { host = null, apitoken = null, apiToken = null } = JSON.parse(e.target.result)
          apiToken = apiToken || apitoken
          if (!host || !apiToken) {
            alert('Invalid credentials file, must be JSON with apitoken and host entries.')
            return
          }
          try {
            this.authenticating = true
            await this.getAccessToken({ host, apiToken })
            await this.fetchVisualizerBookmarks()
          } catch (error) {
            console.error(error)
          } finally {
            this.authenticating = false
          }
        } else if (type === 'archimate') {
          alert('archimate!')
        }
      }
      reader.readAsText(files[0])
    }
  }
}
</script>