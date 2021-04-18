<template>
  <div class="flex flex-col space-y-2 bg-gradient-to-bl from-gray-100 to-gray-50">
    <search-input
      class="mt-2 px-2"
      :placeholder="'Search file diagrams'">
      <template v-slot:action-button>
        <button
          v-wave
          class="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-0">
          <template v-if="!loading">
            <!-- Heroicon name: solid/upload -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            <input
              @change="loadFile"
              class="absolute w-full h-full left-0 opacity-0"
              type="file"
              accept="text/xml,*.xml">
          </template>
          <template v-else>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 animate-spin transform -rotate-180"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
          </template>
        </button>
      </template>
    </search-input>
    <div class="px-2 flex-1 flex flex-col space-y-2 overflow-auto">
      <div
        v-for="diagram in diagrams"
        :key="diagram.id"
        @click="setSelectedDiagram(diagram)"
        class="transition-colors p-2 text-xs rounded-md cursor-pointer border"
        :class="{
          'bg-yellow-300': selectedDiagram !== null && selectedDiagram.id === diagram.id,
          'bg-white hover:bg-yellow-200': selectedDiagram === null || selectedDiagram?.id !== diagram.id
        }">
        {{diagram.name}}
      </div>
    </div>
    <div class="flex flex-col border border-gray-400 p-2 py-1 bg-gray-600 text-white">
      <div class="text-sm py-2 font-medium">Stylesheet</div>
      <div class="flex space-x-2 mb-2">
        <button
          v-wave
          @click="downloadStyles"
          class="w-1/2 inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:ring-0">
          Download
          <svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          v-wave
          class="relative w-1/2 inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-0">
          Upload
          <svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
          <input
            @change="uploadStylesFile"
            :disabled="false"
            class="absolute w-full h-full left-0 opacity-0"
            type="file"
            accept="application/json,*.json">
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import SearchInput from '@/components/SearchInput'

export default {
  components: {
    SearchInput
  },
  inject: {
    $toast: 'Toast'
  },
  data () {
    return {
      loading: false
    }
  },
  computed: {
    ...mapState(['diagrams', 'selectedDiagram', 'styles'])
  },
  methods: {
    ...mapActions(['loadDiagramsFromXml']),
    ...mapMutations(['setSelectedDiagram', 'setStyles', 'setDiagrams']),
    loadFile (event) {
      this.loading = true
      // reset diagram list
      this.setDiagrams()
      const { target: { files } } = event
      if (!files.length) return
      let reader = new FileReader()
      reader.onload = async e => {
        const xml = e.target.result
        try {
          await this.loadDiagramsFromXml(xml)
        } catch (error) {
          console.error(error)
          this.$toast.fire({
            icon: 'error',
            title: 'Error while loading xml file!',
            text: 'Check console for more details...'
          })
        } finally {
          this.loading = false
        }
      }
      reader.readAsText(files[0])
    },
    downloadStyles () {
      const content = JSON.stringify(this.styles, null, 2)
      const contentType = 'application/json'
      const fileName = 'stylesheet.json'
      const a = document.createElement('a')
      const file = new Blob([content], {type: contentType})
      a.href = URL.createObjectURL(file)
      a.download = fileName
      a.click()
      a.remove()
    },
    uploadStylesFile () {
      const { target: { files } } = event
      if (!files.length) return
      let reader = new FileReader()
      reader.onload = async e => {
        try {
         const styles = JSON.parse(e.target.result)
         this.setStyles(styles)
         this.$toast.fire({
            icon: 'success',
            title: 'New styles set!'
          })
        } catch (error) {
          console.error(error)
          this.$toast.fire({
            icon: 'error',
            title: 'Error while loading json file!',
            text: 'Check console for more details...'
          })
        }
      }
      reader.readAsText(files[0])
    }
  }
}
</script>