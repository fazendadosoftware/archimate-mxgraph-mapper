<template>
  <div class="flex flex-col h-screen">
    <action-bar @authorize="authorize"/>
    <div class="flex-1 grid grid-cols-12 overflow-hidden">
      <div class="bg-red-400 col-span-2">FILE</div>
      <graph-canvas class="col-span-8" />
      <workspace-column class="col-span-2"/>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import GraphCanvas from '@/components/GraphCanvas'
import WorkspaceColumn from '@/components/WorkspaceColumn'
import ActionBar from '@/components/ActionBar'
export default {
  name: 'App',
  inject: ['Swal'],
  components: {
    ActionBar,
    GraphCanvas,
    WorkspaceColumn
  },
  computed: {
    ...mapState(['credentials'])
  },
  methods: {
    authorize () {
      this.Swal.fire('hi there!')
    }
  }
}
</script>
