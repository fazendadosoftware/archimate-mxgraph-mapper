<template>
  <div class="overflow-auto text-xs">
    <div class="h-full" ref="graphContainer"/>
  </div>
</template>

<script>
import graph from '@/graph'
import { mapState } from 'vuex'
const { mxClient, mxUtils, mxGraph, mxCodec } = graph

export default {
  computed: {
    ...mapState(['selectedBookmark']),
    graphXml () {
      return this.selectedBookmark?.state?.graphXml
    }
  },
  watch: {
    // https://jgraph.github.io/mxgraph/docs/js-api/files/io/mxCodec-js.html
    graphXml (xml) {
      if (!mxClient.isBrowserSupported()) {
         mxUtils.error('Browser is not supported!', 200, false)
      } else {
        const graph = new mxGraph(this.$refs.graphContainer)
        graph.getModel().beginUpdate()
        try {
          const doc = mxUtils.parseXml(xml)
          const codec = new mxCodec(doc)
          codec.decode(doc.documentElement, graph.getModel())
        } finally {
          graph.getModel().endUpdate()
        }
      }
    }
  }
}
</script>