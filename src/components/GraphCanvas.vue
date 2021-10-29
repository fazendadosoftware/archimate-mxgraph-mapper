<template>
  <div class="overflow-auto text-xs flex flex-col relative">
    <div v-if="meta !== null" class="absolute top-0 p-2 bg-transparent">
      <div class="font-semibold">
        {{ meta?.type }}
      </div>
      <div class="text-xl font-semibold">
        {{ meta?.name }}
      </div>
    </div>
    <div ref="graph" class="flex-1 overflow-auto" />
    <div ref="outline" class="absolute bottom-0 left-0 border border-gray-400" />
    <div class="absolute top-0 right-0 p-2 italic text-gray-400">
      <div>{{ name }} v{{ version }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, Ref, unref, computed } from 'vue'
import useDiagrams from '../composables/useDiagrams'
import useWorkspace from '../composables/useWorkspace'
import useMXGraph from '../composables/useMXGraph'
import { IDiagram } from '../workers/diagrams'
import pkg from '../../package.json'

const { name, version } = pkg
const graph = ref(null)
const outline = ref(null)
const meta: Ref<any> = ref(null)

const { drawGraph } = useMXGraph({ graph, outline })
const { selectedDiagram, toggleDiagramSelection } = useDiagrams()
const { selectedBookmark, toggleBookmarkSelection } = useWorkspace()

watch(selectedDiagram, () => {
  if (unref(selectedBookmark) !== null) toggleBookmarkSelection(unref(selectedBookmark))
})

watch(selectedBookmark, () => {
  if (unref(selectedDiagram) !== null) toggleDiagramSelection(unref(selectedDiagram) as IDiagram)
})

watch([selectedDiagram, selectedBookmark], ([selectedDiagram, selectedBookmark]) => {
  const chartData = selectedDiagram ?? selectedBookmark?.state?.graphXml
  if (chartData !== undefined) {
    meta.value = selectedDiagram ?? selectedBookmark
    drawGraph(chartData)
  }
})

/*
watch(chartData, chartData => {
  // console.log('CHART DATA', chartData)
  drawGraph(chartData)
})
*/
</script>
