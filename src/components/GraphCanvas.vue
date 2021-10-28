<template>
  <div class="overflow-auto text-xs relative flex flex-col">
    <div ref="graph" class="flex-1 overflow-auto" />
    <div ref="outline" class="absolute bottom-0 left-0 border border-gray-400" />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import useDiagrams from '../composables/useDiagrams'
import useMXGraph from '../composables/useMXGraph'

const graph = ref(null)
const outline = ref(null)

const { drawGraph } = useMXGraph({ graph, outline })
const { selectedDiagram } = useDiagrams()

watch([selectedDiagram], ([selectedDiagram]) => {
  drawGraph(selectedDiagram)
})
</script>
