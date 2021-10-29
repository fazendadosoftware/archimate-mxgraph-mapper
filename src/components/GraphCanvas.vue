<template>
  <div class="overflow-auto text-xs relative flex flex-col">
    <div>{{ meta?.name }}</div>
    <div ref="graph" class="flex-1 overflow-auto" />
    <div ref="outline" class="absolute bottom-0 left-0 border border-gray-400" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, Ref, unref, computed } from 'vue'
import useDiagrams from '../composables/useDiagrams'
import useWorkspace from '../composables/useWorkspace'
import useMXGraph from '../composables/useMXGraph'
import { IDiagram } from '../workers/diagrams'

const graph = ref(null)
const outline = ref(null)
const chartData: Ref<any> = ref(null)

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
  if (chartData !== undefined) drawGraph(chartData)
})

/*
watch(chartData, chartData => {
  // console.log('CHART DATA', chartData)
  drawGraph(chartData)
})
*/

const meta = computed(() => typeof unref(chartData) === 'string' ? unref(selectedBookmark) : (unref(selectedDiagram)))
</script>
