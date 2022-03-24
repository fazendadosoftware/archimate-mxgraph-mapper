<template>
  <div class="flex flex-col pt-2 px-2 space-y-2 bg-gray-200">
    <authenticate-button />
    <search-input
      v-if="isAuthenticated"
      v-model="searchQuery"
      :refreshing="isLoading"
      :placeholder="'Search workspace diagrams'"
      @refresh="refresh" />
    <div class="flex-1 flex flex-col rounded-md overflow-hidden">
      <div class="flex-1 flex flex-col space-y-2 overflow-auto">
        <div
          v-for="bookmark in filteredBookmarks.filter((bookmark: any) => bookmarkHasXml(bookmark))"
          :key="bookmark.id"
          class="transition-colors px-2 py-1 text-xs rounded cursor-pointer border border-gray-300"
          :class="{
            'bg-yellow-300 bg-opacity-50 hover:bg-opacity-100': isSelected(bookmark),
            'bg-white hover:bg-yellow-100': !isSelected(bookmark),
            'pointer-events-none opacity-25': !bookmarkHasXml(bookmark)
          }"
          @click="toggleBookmarkSelection(bookmark)">
          <div>{{ bookmark.name }}</div>
          <div>
            <span>{{ getDate(bookmark.updatedAt) }}</span>
            <span v-if="!bookmarkHasXml(bookmark)" class="text-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="-mx-2 bg-white divide-y">
      <current-workspace class="p-2" />
      <toggle-diagram-overwrite class="p-2" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, unref } from 'vue'
import useWorkspace from '../composables/useWorkspace'
import useDiagrams from '../composables/useDiagrams'
import SearchInput from './SearchInput.vue'
import AuthenticateButton from './AuthenticateButton.vue'
import CurrentWorkspace from './CurrentWorkspace.vue'
import ToggleDiagramOverwrite from './ToggleDiagramOverwrite.vue'
import { getOverwriteSetting, setOverwriteSetting } from '../store'

const { isAuthenticated, filteredBookmarks, getDate, toggleBookmarkSelection, isSelected, searchQuery, fetchVisualizerBookmarks, buildFactSheetIndex, isLoading } = useWorkspace()
const { selectedDiagram } = useDiagrams()

const overwriteSetting = ref(getOverwriteSetting())

const toggleOverwriteSetting = () => {
  setOverwriteSetting(!getOverwriteSetting())
  overwriteSetting.value = getOverwriteSetting()
}

const bookmarkHasXml = (bookmark: any) => !!bookmark?.state?.graphXml
const refresh = async () => {
  await fetchVisualizerBookmarks()
  if (unref(selectedDiagram) !== null) await buildFactSheetIndex(unref(selectedDiagram))
}
</script>
