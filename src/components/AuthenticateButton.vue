<template>
  <button
    v-if="!isAuthenticated"
    v-wave
    :disabled="authenticating"
    type="button"
    class="relative border-box inline-flex justify-center items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 focus:outline-none focus:ring-0"
    :class="{
      'opacity-50 animate-pulse': authenticating,
      'hover:bg-indigo-700': !authenticating
    }">
    {{!authenticating ? 'Load LeanIX Credentials File' : 'Authenticating...'}}
    <input
      @change="loadFile"
      :disabled="authenticating"
      class="absolute w-full h-full left-0 opacity-0"
      type="file"
      accept="application/json,*.json">
  </button>
  <button
    v-else
    @click="setAccessToken()"
    type="button"
    class="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-0">
    Logout
  </button>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'
export default {
  data () {
    return {
      authenticating: false
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated'])
  },
  methods: {
    ...mapActions(['getAccessToken', 'fetchVisualizerBookmarks']),
    ...mapMutations(['setAccessToken']),
    loadFile (event) {
      const { target: { files } } = event
      if (!files.length) return
      let reader = new FileReader()
      reader.onload = async e => {
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
      }
      reader.readAsText(files[0])
    }
  }
}
</script>
