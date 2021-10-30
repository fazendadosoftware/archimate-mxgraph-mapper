import mxgraph from '../helpers/mxgraph-shims'
import '../helpers/mxArchimate3Shapes'
import useSwal from './useSwal'
import { IElement, IConnector } from '../workers/diagrams'
import styles from '../assets/data/styles.json'
import { ref, unref, Ref, computed } from 'vue'

const { toast } = useSwal()

const styleIndex: Record<string, string> = styles

const { mxClient, mxUtils, mxGraph: MXGraph, mxCodec: MXCodec, mxOutline: MXOutline, mxUndoManager: MXUndoManager, mxEvent, mxUtils: { getXml } } = mxgraph

interface DrawGraphProps {
  graphContainer: Ref<Element | null>
  outlineContainer: Ref<Element | null>
  undoManager: any
  graph: Ref<any>
  outline: Ref<any>
  undoListener: any
}

const getStyle = (type: string) => {
  if (styleIndex[type] === undefined) console.warn(`No style defined for type ${type}`)
  if (type !== '' && styleIndex[type] === undefined) console.warn(`No style defined for type ${type}`)
  return styleIndex[type] ?? ''
}

const drawGraph = (props: DrawGraphProps, data: unknown) => {
  const { graphContainer, outlineContainer, undoManager, graph, outline, undoListener } = props

  const graphContainerEl = unref(graphContainer)
  const outlineContainerEl = unref(outlineContainer)
  if (graphContainerEl === null || outlineContainerEl === null) return

  if (mxClient.isBrowserSupported() === false) mxUtils.error('Browser is not supported!', 200, false)
  else {
    try {
      if (unref(graph) !== null) { unref(graph).destroy(); undoManager.clear() }
      graph.value = new MXGraph(graphContainerEl)
      unref(graph).getModel().beginUpdate()
      try {
        if (data === null) {
          console.log('null')
        } else if (typeof data === 'string') {
          const doc = mxUtils.parseXml(data)
          const codec = new MXCodec(doc)
          codec.decode(doc.documentElement, unref(graph).getModel())
        } else {
          const { elements = [], connectors = [] } = data as {elements: IElement[], connectors: IConnector[]}
          const vertexIndex: any = {}
          elements
            .forEach((element: IElement) => {
              const { id, parentId, name, type, geometry } = element
              vertexIndex[id] = unref(graph).insertVertex(vertexIndex[parentId] ?? unref(graph).getDefaultParent(), id, name, ...geometry, getStyle(type))
            })
          connectors
            .forEach((connector: IConnector) => {
              const { id, type, sourceId, targetId } = connector
              const sourceVertex = vertexIndex[sourceId]
              const targetVertex = vertexIndex[targetId]
              unref(graph).insertEdge(unref(graph).getDefaultParent(), id, '', sourceVertex, targetVertex, getStyle(type))
            })
        }
      } finally {
        unref(graph).getModel().endUpdate()
      }
      unref(outline)?.outline?.destroy()
      if (data !== null) {
        outline.value = new MXOutline(unref(graph), outlineContainerEl)
        unref(graph).getModel().addListener(mxEvent.UNDO, undoListener)
        unref(graph).getView().addListener(mxEvent.UNDO, undoListener)
      }
    } catch (error) {
      console.error(error)
      void toast.fire({
        icon: 'error',
        title: 'Error while loading graph!',
        text: 'Check console for more details...'
      })
    }
  }
}

interface UseMXGraphProps {
  graph: Ref<Element | null>
  outline: Ref<Element | null>
}

const useMXGraph = (props: UseMXGraphProps) => {
  const graph = ref(null)
  const outline = ref(null)
  const { graph: graphContainer, outline: outlineContainer } = props
  const undoManager = new MXUndoManager()
  const undoListener = (sender: any, evt: any) => undoManager.undoableEditHappened(evt.getProperty('edit'))
  const drawGraphProps: DrawGraphProps = { graphContainer, outlineContainer, undoManager, graph, outline, undoListener }
  return {
    drawGraph: (data: unknown) => drawGraph(drawGraphProps, data),
    styleIndex: computed(() => styleIndex),
    undoManager
  }
}

export default useMXGraph
export { styleIndex }
