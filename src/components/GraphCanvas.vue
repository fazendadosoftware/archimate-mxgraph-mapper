<template>
  <div class="overflow-auto text-xs relative flex flex-col">
    <div ref="graph" class="flex-1 overflow-auto" />
    <div ref="outline" class="absolute bottom-0 left-0 border border-gray-400" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, Ref, unref } from 'vue'
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

watch(selectedDiagram, selectedDiagram => {
  if (unref(selectedBookmark) !== null) toggleBookmarkSelection(selectedBookmark)
  chartData.value = selectedDiagram
})
watch(selectedBookmark, selectedBookmark => {
  if (unref(selectedDiagram) !== null) toggleDiagramSelection(unref(selectedDiagram) as IDiagram)
  chartData.value = selectedBookmark?.state?.graphXml ?? null
  console.log('SLEECTED BOOKMARK', selectedBookmark)
})
watch(chartData, chartData => drawGraph(chartData))
</script>
