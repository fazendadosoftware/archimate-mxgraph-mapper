<template>
  <div class="overflow-auto text-xs relative">
    <div class="h-full" ref="graphContainer"/>
    <div class="absolute bottom-0 left-0 border" ref="outlineContainer"/>
  </div>
</template>

<script>
import MXGraph from '@/helpers/graph'
import { mapState } from 'vuex'

const { mxClient, mxUtils, mxGraph, mxCodec, mxOutline } = MXGraph
let graph = null
let outline = null

const styles = {
  ArchiMate_ApplicationComponent: 'html=1;outlineConnect=0;whiteSpace=wrap;fillColor=#99ffff;shape=mxgraph.archimate3.application;appType=comp;archiType=square;',
  ArchiMate_ApplicationFunction: 'html=1;outlineConnect=0;whiteSpace=wrap;fillColor=#99ffff;shape=mxgraph.archimate3.application;appType=func;archiType=rounded;',
  ArchiMate_ApplicationService: 'html=1;outlineConnect=0;whiteSpace=wrap;fillColor=#99ffff;shape=mxgraph.archimate3.application;appType=serv;archiType=rounded',
  ArchiMate_DataObject: 'html=1;outlineConnect=0;whiteSpace=wrap;fillColor=#99ffff;shape=mxgraph.archimate3.businessObject;overflow=fill',
  // used ArchiMate_TechnologyArtifact since ArchiMate_TechnologyObject is not in the mxgraph's shape catalog
  ArchiMate_TechnologyObject: 'html=1;outlineConnect=0;whiteSpace=wrap;fillColor=#AFFFAF;shape=mxgraph.archimate3.application;appType=artifact;archiType=square;',
  ArchiMate_TechnologyService: 'html=1;outlineConnect=0;whiteSpace=wrap;fillColor=#AFFFAF;shape=mxgraph.archimate3.application;appType=serv;archiType=rounded',
  ArchiMate_SystemSoftware: 'html=1;outlineConnect=0;whiteSpace=wrap;fillColor=#AFFFAF;shape=mxgraph.archimate3.tech;techType=sysSw;',
  Activity: 'html=1;outlineConnect=0;whiteSpace=wrap;fillColor=#ffff99;shape=mxgraph.archimate3.application;appType=func;archiType=rounded;',
  Class: 'html=1;outlineConnect=0;whiteSpace=wrap;fillColor=#ffff99;shape=mxgraph.archimate3.businessObject;overflow=fill;',
  Note: 'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;',
  // Relations
  ArchiMate_Access: 'edgeStyle=elbowEdgeStyle;html=1;endArrow=open;elbow=vertical;endFill=0;dashed=1;dashPattern=1 4;',
  ArchiMate_Assignment: 'endArrow=block;html=1;endFill=1;startArrow=oval;startFill=1;edgeStyle=elbowEdgeStyle;elbow=vertical;',
  ArchiMate_Realization: 'edgeStyle=elbowEdgeStyle;html=1;endArrow=block;elbow=vertical;endFill=0;dashed=1;',
  ArchiMate_Serving: 'edgeStyle=elbowEdgeStyle;html=1;endArrow=open;elbow=vertical;endFill=1;'
}

const getStyle = type => {
  if (type && !styles[type]) console.warn(`No style defined for type ${type}`)
  const style = styles[type] || ''
  return style
}

export default {
  inject: {
    $toast: 'Toast'
  },
  data () {
    return {
      graph: null
    }
  },
  computed: {
    ...mapState(['selectedBookmark', 'selectedDiagram']),
    graphXml () {
      return this.selectedBookmark?.state?.graphXml
    },
  },
  watch: {
    // https://jgraph.github.io/mxgraph/docs/js-api/files/io/mxCodec-js.html
    graphXml (xml = null) {
      if (xml === null) return
      if (!mxClient.isBrowserSupported()) {
         mxUtils.error('Browser is not supported!', 200, false)
      } else {
        try {
          if (graph !== null) graph.destroy()
          graph = new mxGraph(this.$refs.graphContainer)
          graph.getModel().beginUpdate()
          try {
            const doc = mxUtils.parseXml(xml)
            const codec = new mxCodec(doc)
            codec.decode(doc.documentElement, graph.getModel())
          } finally {
            graph.getModel().endUpdate()
          }
          if (outline !== null) outline.outline.destroy()
          outline = new mxOutline(graph, this.$refs.outlineContainer)
        } catch (error) {
          console.error(error)
          this.$toast.fire({
            icon: 'error',
            title: 'Error while loading graph!',
            text: 'Check console for more details...'
          })
        }
      }
    },
    selectedDiagram (diagram = null) {
      if (diagram === null) return
      const { elements = [], connectors = [] } = diagram
      const vertexIndex = {}
      if (!mxClient.isBrowserSupported()) {
         mxUtils.error('Browser is not supported!', 200, false)
      } else {
        if (graph !== null) graph.destroy()
        graph = new mxGraph(this.$refs.graphContainer)
        graph.getModel().beginUpdate()
        try {
          elements
            .forEach(element => {
              const { id, parentId, name, type, geometry } = element
              vertexIndex[id] = graph.insertVertex(vertexIndex[parentId] || graph.getDefaultParent(), id, name, ...geometry, getStyle(type))
            })
          connectors
            .forEach(connector => {
              const { id, type, sourceId, targetId } = connector
              const sourceVertex = vertexIndex[sourceId]
              const targetVertex = vertexIndex[targetId]
              graph.insertEdge(graph.getDefaultParent(), id, '', sourceVertex, targetVertex, getStyle(type))
            })
        } finally {
          graph.getModel().endUpdate()
        }
        if (outline !== null) outline.outline.destroy()
        outline = new mxOutline(graph, this.$refs.outlineContainer)
      }
    }
  }
}
</script>