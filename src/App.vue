<template>
  <div class="border-t flex divide-x divide-grey-500 h-screen">
    <xml-file-column class="col-span-2" />
    <graph-canvas class="col-span-8 flex-1" />
    <workspace-column class="col-span-2"/>
  </div>
</template>

<script>
import XmlFileColumn from '@/components/XmlFileColumn'
import GraphCanvas from '@/components/GraphCanvas'
import WorkspaceColumn from '@/components/WorkspaceColumn'
export default {
  name: 'App',
  inject: ['Swal'],
  components: {
    XmlFileColumn,
    GraphCanvas,
    WorkspaceColumn
  }
}
</script>
