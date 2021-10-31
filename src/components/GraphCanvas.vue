<template>
  <div class="overflow-auto text-xs flex flex-col relative">
    <div
      v-if="selectedDiagram !== null"
      class="border-b border-gray-200 sticky top-0 bg-white z-50">
      <nav class="-mb-px flex space-x-4 px-2" aria-label="Tabs">
        <!-- Current: "border-indigo-500 text-indigo-600", Default: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" -->
        <div
          v-for="tab in viewTabs"
          :key="tab.key"
          class="border-transparent text-gray-500 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-xs cursor-pointer"
          :class="{
            'border-indigo-500 text-indigo-600': view === tab.key,
            'hover:text-gray-700 hover:border-gray-300': view !== tab.key
          }"
          @click="view = tab.key">
          {{ tab.label }}
        </div>
      </nav>
    </div>
    <div v-show="view === 'diagram'" ref="graph" class="flex-1 overflow-auto" />
    <div v-show="view === 'diagram'" ref="outline" class="absolute bottom-0 left-0 border border-gray-400" />
    <div v-if="view === 'diagram' && selectedDiagram !== null" class="absolute top-24 mt-4 right-0">
      <span class="relative z-0 inline-flex shadow-sm rounded-md transform rotate-90">
        <button
          type="button"
          :disabled="!undoManager.canUndo()"
          class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-0 focus:border-0 transition-opacity"
          :class="{
            'opacity-50 cursor-default': !undoManager.canUndo(),
            'opacity-100 cursor-pointer': undoManager.canUndo()
          }"
          @click="undoManager.undo()">
          <span class="sr-only">Undo</span>
          <!-- Heroicon name: solid/reply -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform -rotate-90" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          :disabled="!undoManager.canRedo()"
          class="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-0 focus:border-0 transition-opacity"
          :class="{
            'opacity-50 cursor-default': !undoManager.canRedo(),
            'opacity-100 cursor-pointer': undoManager.canRedo()
          }"
          @click="undoManager.redo()">
          <span class="sr-only">Undo</span>
          <!-- Heroicon name: solid/reply -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform -rotate-90 -scale-x-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          :disabled="!isAuthenticated || isSavingBookmark || selectedDiagram === null"
          class="-ml-px relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-0 focus:border-0 transition-opacity"
          :class="{
            'opacity-50 cursor-default': !isAuthenticated || isSavingBookmark,
            'opacity-100 cursor-pointer': isAuthenticated && !isSavingBookmark
          }"
          @click="save()">
          <span class="sr-only">SaveBookmark</span>
          <!-- Heroicon name: solid/reply -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform -rotate-90" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            <path fill-rule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </span>
    </div>
    <div
      v-if="view === 'elementList'"
      class="flex-1 overflow-auto bg-gray-200">
      <element-list v-if="selectedDiagram" :diagram="selectedDiagram" />
    </div>
    <div
      v-if="view === 'connectorList'"
      class="flex-1 overflow-auto bg-gray-200">
      <connector-list v-if="selectedDiagram" :diagram="selectedDiagram" />
    </div>
    <div
      v-if="view === 'styleList'"
      class="flex-1 overflow-auto bg-gray-200">
      <style-list v-if="selectedDiagram" :diagram="selectedDiagram" />
    </div>
    <div
      v-if="view === 'factSheetList'"
      class="flex-1 overflow-auto bg-gray-200">
      <fact-sheet-list v-if="selectedDiagram" :diagram="selectedDiagram" />
    </div>
    <div class="absolute top-0 right-0 p-2 italic text-gray-400">
      <div>{{ name }} v{{ version }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, unref } from 'vue'
import ElementList from './ElementList.vue'
import ConnectorList from './ConnectorList.vue'
import StyleList from './StyleList.vue'
import FactSheetList from './FactSheetList.vue'
import useDiagrams from '../composables/useDiagrams'
import useWorkspace from '../composables/useWorkspace'
import useMXGraph from '../composables/useMXGraph'
import { IDiagram } from '../workers/diagrams'
import pkg from '../../package.json'

const { name, version } = pkg
const graph = ref(null)
const outline = ref(null)

const { drawGraph, undoManager, getXml } = useMXGraph({ graph, outline })
const { selectedDiagram, toggleDiagramSelection } = useDiagrams()
const { isAuthenticated, selectedBookmark, toggleBookmarkSelection, isSavingBookmark, saveBookmark, buildFactSheetIndex, fetchVisualizerBookmarks } = useWorkspace()

watch([isAuthenticated, selectedDiagram], ([isAuthenticated, selectedDiagram]) => {
  if (isAuthenticated && selectedDiagram !== null) buildFactSheetIndex(selectedDiagram)
})

watch(selectedDiagram, () => {
  if (unref(selectedBookmark) !== null) toggleBookmarkSelection(unref(selectedBookmark))
})

watch(selectedBookmark, () => {
  if (unref(selectedDiagram) !== null) toggleDiagramSelection(unref(selectedDiagram) as IDiagram)
})

watch([selectedDiagram, selectedBookmark], ([selectedDiagram, selectedBookmark]) => {
  if (selectedBookmark?.state?.graphXml) view.value = 'diagram'
  const chartData = selectedDiagram ?? selectedBookmark?.state?.graphXml
  if (chartData !== undefined) drawGraph(chartData)
})

const viewTabs = [
  { key: 'diagram', label: 'Diagram' },
  { key: 'elementList', label: 'Element List' },
  { key: 'connectorList', label: 'Connector List' },
  { key: 'styleList', label: 'Style List' },
  { key: 'factSheetList', label: 'FactSheet list' }
]
const view = ref('diagram')

const save = async () => {
  const diagram = unref(selectedDiagram)
  if (diagram === null) return
  await saveBookmark(diagram, getXml())
  await fetchVisualizerBookmarks()
}
</script>
