<template>
  <div class="border-t flex divide-x divide-grey-500 h-screen">
    <xml-file-column class="w-2/12 shadow-xl" style="min-width: 250px"/>
    <graph-canvas class="col-span-8 flex-1" />
    <workspace-column class="w-2/12 shadow-xl" style="min-width: 250px"/>
  </div>
</template>

<script>
import XmlFileColumn from '@/components/XmlFileColumn'
import GraphCanvas from '@/components/GraphCanvas'
import WorkspaceColumn from '@/components/WorkspaceColumn'
export default {
  name: 'App',
  components: {
    XmlFileColumn,
    GraphCanvas,
    WorkspaceColumn
  }
}
</script>
