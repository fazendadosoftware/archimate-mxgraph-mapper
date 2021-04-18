<template>
  <div class="overflow-auto text-xs relative flex flex-col">
    <div
      v-if="selectedDiagram !== null"
      class="border-b border-gray-200 sticky top-0 bg-white z-50">
        <nav class="-mb-px flex space-x-4 px-2" aria-label="Tabs">
          <!-- Current: "border-indigo-500 text-indigo-600", Default: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" -->
          <div
            v-for="tab in viewTabs"
            :key="tab.key"
            @click="view = tab.key"
            class="border-transparent text-gray-500 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-xs cursor-pointer"
            :class="{
              'border-indigo-500 text-indigo-600': view === tab.key,
              'hover:text-gray-700 hover:border-gray-300': view !== tab.key
            }">
            {{tab.label}}
          </div>
        </nav>
    </div>
    <div v-show="view === 'diagram'" class="flex-1 overflow-auto" ref="graphContainer"/>
    <div v-if="view === 'diagram'" class="absolute bottom-0 left-0 border" ref="outlineContainer"/>
    <div v-if="view === 'diagram' && selectedDiagram !== null" class="absolute top-24 mt-4 right-0">
      <span class="relative z-0 inline-flex shadow-sm rounded-md transform rotate-90">
        <button
          type="button"
          :disabled="!undoManager.canUndo()"
          @click="undoManager.undo()"
          class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-0 focus:border-0 transition-opacity"
          :class="{
            'opacity-50 cursor-default': !undoManager.canUndo(),
            'opacity-100 cursor-pointer': undoManager.canUndo()
          }">
          <span class="sr-only">Undo</span>
          <!-- Heroicon name: solid/reply -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform -rotate-90" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          :disabled="!undoManager.canRedo()"
          @click="undoManager.redo()"
          class="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-0 focus:border-0 transition-opacity"
          :class="{
            'opacity-50 cursor-default': !undoManager.canRedo(),
            'opacity-100 cursor-pointer': undoManager.canRedo()
          }">
          <span class="sr-only">Undo</span>
          <!-- Heroicon name: solid/reply -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform -rotate-90 -scale-x-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          @click="saveBookmark"
          class="-ml-px relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-0 focus:border-0"
          :class="{
            'opacity-50 cursor-default': false,
            'opacity-100 cursor-pointer': true
          }">
          <span class="sr-only">Redo</span>
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
  </div>
</template>

<script>
import MXGraph from '@/helpers/graph'
import { mapState } from 'vuex'
import ElementList from '@/components/ElementList'
import ConnectorList from '@/components/ConnectorList'

const { mxClient, mxUtils, mxGraph, mxCodec, mxOutline, mxUndoManager, mxEvent } = MXGraph
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
  components: {
    ElementList,
    ConnectorList
  },
  data () {
    return {
      graph: null,
      viewTabs: [
        { key: 'diagram', label: 'Diagram' },
        { key: 'elementList', label: 'Element List' },
        { key: 'connectorList', label: 'Connector List' }
      ],
      view: 'diagram',
      undoManager: new mxUndoManager()
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
      this.view = 'diagram'
      if (!mxClient.isBrowserSupported()) {
         mxUtils.error('Browser is not supported!', 200, false)
      } else {
        try {
          if (graph !== null) {
            graph.destroy()
            this.undoManager.clear()
          }
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
        if (graph !== null) {
          graph.destroy()
          this.undoManager.clear()
        }
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
        graph.getModel().addListener(mxEvent.UNDO, this.undoListener)
        graph.getView().addListener(mxEvent.UNDO, this.undoListener)
      }
    }
  },
  methods: {
    undoListener (sender, evt) {
      this.undoManager.undoableEditHappened(evt.getProperty('edit'))
    },
    saveBookmark () {
      alert('sabing')
    }
  }
}
</script>