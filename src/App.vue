<template>
  <div class="border-t flex divide-x divide-grey-500 h-screen">
    <xml-file-column class="w-2/12 shadow-xl" style="min-width: 250px"/>
    <graph-canvas class="col-span-8 flex-1" />
    <workspace-column class="w-2/12 shadow-xl" style="min-width: 250px"/>
  </div>
</template>

<script lang="ts" setup>
import XmlFileColumn from './components/XmlFileColumn.vue'
import GraphCanvas from './components/GraphCanvas.vue'
import WorkspaceColumn from './components/WorkspaceColumn.vue'
</script>
