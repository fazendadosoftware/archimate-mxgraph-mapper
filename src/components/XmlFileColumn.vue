<template>
  <div class="flex flex-col p-2 space-y-2 bg-gradient-to-bl from-gray-100 to-gray-50">
    <search-input
      :placeholder="'Search file diagrams'">
      <template v-slot:action-button>
        <button
          v-wave
          class="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-0">
          <!-- Heroicon name: solid/refresh -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
          <input
            @change="loadFile"
            class="absolute w-full left-0 opacity-0"
            type="file"
            accept="text/xml,*.xml">
        </button>
      </template>
    </search-input>
    <div class="flex-1 flex flex-col space-y-2">
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
  computed: {
    ...mapState(['diagrams', 'selectedDiagram'])
  },
  methods: {
    ...mapActions(['loadDiagramsFromXml']),
    ...mapMutations(['setSelectedDiagram']),
    loadFile (event) {
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
        }
      }
      /*
      reader.onprogress= data => {
        if (data.lengthComputable) {
          const progress = parseInt( ((data.loaded / data.total) * 100), 10 )
          console.log(progress)
        }
      }
      */
      reader.readAsText(files[0])
    }
  }
}
</script>