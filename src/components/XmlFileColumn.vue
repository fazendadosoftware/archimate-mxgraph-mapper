<template>
  <div class="flex flex-col space-y-2 bg-gray-200">
    <search-input-component
      v-model="searchQuery"
      class="mt-2 px-2"
      :placeholder="'Search file diagrams'">
      <template #action-button>
        <label class="cursor-pointer">
          <span
            v-wave
            class="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-0">
            <template v-if="!loading">
              <!-- Heroicon name: solid/upload -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <input
                class="hidden"
                type="file"
                accept=".xml"
                @change="loadFile">
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
          </span>
        </label>
      </template>
    </search-input-component>
    <div class="border-b" />
    <div class="px-2 flex-1 flex flex-col space-y-2 overflow-auto">
      <button
        v-for="diagram in filteredDiagrams"
        :key="diagram.id"
        class="transition-colors px-2 py-1 text-xs rounded cursor-pointer border border-gray-300"
        :class="{
          'bg-yellow-300 bg-opacity-50 hover:bg-opacity-100': isSelected(diagram),
          'bg-white hover:bg-yellow-100': !isSelected(diagram)
        }"
        @click="toggleDiagramSelection(diagram)">
        {{ diagram.name }}
      </button>
    </div>
    <div v-if="hasDiagrams && isImported === false && isAuthenticated" class="flex justify-center p-2 bg-white border-t border-gray-300">
      <button
        v-wave
        class="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:ring-0"
        :class="{
          'opacity-50 pointer-events-none': isImporting
        }"
        @click="importAll">
        {{ isImporting ? `Importing... ${percentageComplete}` : `Import ${filteredDiagrams.length} diagrams` }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { unref, onBeforeUnmount, ref, computed, watch } from 'vue'
import Bottleneck from 'bottleneck'
import SearchInput from './SearchInput.vue'
import useDiagrams from '../composables/useDiagrams'
import useWorkspace from '../composables/useWorkspace'
import { drawGraph } from '../composables/useMXGraph'
import useSwal from '../composables/useSwal'

const SearchInputComponent = SearchInput as any
const { loadFile, loading, filteredDiagrams, searchQuery, isSelected, toggleDiagramSelection, hasDiagrams } = useDiagrams()
const { isAuthenticated, upsertBookmark, fetchVisualizerBookmarks } = useWorkspace()
const { toast } = useSwal()

const limiter = new Bottleneck({ maxConcurrent: 8 })
const jobCount = ref(0)
const percentageComplete = computed(() => Math.round((unref(jobCount) / unref(filteredDiagrams).length) * 100) + '%')
const isImporting = ref(false)
const isImported = ref(false)

watch(filteredDiagrams, () => { isImported.value = false })

limiter.on('error', err => {
  console.error(err)
  toast.fire({
    icon: 'error',
    title: 'Error while uploading diagram',
    text: 'Check console for more details'
  })
})

limiter.on('failed', async (error, jobInfo) => {
  const id = jobInfo.options.id
  console.warn(`Job ${id} failed: ${error}`)
  if (jobInfo.retryCount === 0) { // Here we only retry once
    console.log(`Retrying job ${id} in 25ms!`)
    return 25
  }
})

// limiter.on('received', () => jobCount.value++)

limiter.on('done', () => jobCount.value++)

onBeforeUnmount(() => limiter.removeAllListeners())

const importAll = async () => {
  isImporting.value = true
  jobCount.value = 0

  try {
    const mappedDiagrams = await Promise.all(
      unref(filteredDiagrams)
        .map(async diagram => ({ diagram, xml: await drawGraph({ diagram, getXmlOnly: true }) }))
    )
    await Promise.all(
      mappedDiagrams.map(({ diagram, xml }) => limiter.schedule({ id: `${diagram.id}` }, () => upsertBookmark(diagram, xml as string, true)))
    )
    toast.fire({
      icon: 'success',
      title: 'Success',
      text: `Imported ${unref(filteredDiagrams).length} diagrams into the workspace`
    })
  } finally {
    await fetchVisualizerBookmarks()
    isImporting.value = false
    isImported.value = true
  }
}
</script>
