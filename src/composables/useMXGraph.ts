import mxgraph from '../helpers/mxgraph-shims'
import '../helpers/mxArchimate3Shapes'
import useSwal from './useSwal'
import { IElement, IConnector, IDiagram } from '../workers/diagrams'
import styles from '../assets/data/styles.json'
import { ref, unref, Ref, computed } from 'vue'

const { toast } = useSwal()

const styleIndex: Record<string, string> = styles

const { mxClient, mxUtils, mxGraph: MXGraph, mxCodec: MXCodec, mxOutline: MXOutline, mxUndoManager: MXUndoManager, mxEvent } = mxgraph

interface DrawGraphProps {
  graphContainer: Ref<Element | null>
  outlineContainer: Ref<Element | null>
  undoManager: any
  graph: Ref<any>
  outline: Ref<any>
  undoListener: any
}

const getStyle = (data: IElement | IConnector) => {
  const { type, style: _style } = data
  const style = styleIndex[type]
  if (type !== undefined && type !== '' && style === undefined) {
    console.warn(`No style defined for type ${type}`, JSON.parse(JSON.stringify(data)))
  }
  return style ?? _style
}

const drawGraph = (props: DrawGraphProps, data: unknown) => {
  const { graphContainer, outlineContainer, undoManager, graph, outline, undoListener } = props

  const graphContainerEl = unref(graphContainer)
  const outlineContainerEl = unref(outlineContainer)
  if (graphContainerEl === null || outlineContainerEl === null) return

  if (mxClient.isBrowserSupported() === false) mxUtils.error('Browser is not supported!', 200, false)
  else {
    try {
      if (unref(graph) !== null) { unref(graph).destroy(); unref(undoManager).clear() }
      const _graph = new MXGraph(graphContainerEl)
      _graph.getModel().beginUpdate()
      try {
        if (data === null) {
          throw Error('null data')
        } else if (typeof data === 'string') {
          const doc = mxUtils.parseXml(data)
          const codec = new MXCodec(doc)
          codec.decode(doc.documentElement, _graph.getModel())
        } else {
          const { elements = [], connectors = [] } = data as {elements: IElement[], connectors: IConnector[]}
          const vertexIndex: any = {}
          const defaultParent = _graph.getDefaultParent()

          elements
            .forEach((element: IElement) => {
              const { id, parentId, name, geometry } = element
              vertexIndex[id] = _graph.insertVertex(vertexIndex[parentId] ?? defaultParent, id, name, ...geometry, getStyle(element))
            })

          connectors
            .forEach((connector: IConnector) => {
              const { id, sourceId, targetId } = connector
              const sourceVertex = vertexIndex[sourceId]
              const targetVertex = vertexIndex[targetId]
              _graph.insertEdge(defaultParent, id, '', sourceVertex, targetVertex, getStyle(connector))
            })
        }
      } finally {
        _graph.getModel().endUpdate()
        graph.value = _graph
      }
      unref(outline)?.outline?.destroy()
      if (data !== null) {
        outline.value = new MXOutline(_graph, outlineContainerEl)
        _graph.getModel().addListener(mxEvent.UNDO, undoListener)
        _graph.getView().addListener(mxEvent.UNDO, undoListener)
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

const getXml = (graph: any): string => {
  if (unref(graph) === null) throw Error('invalid graph')
  const xml = mxUtils.getXml(new MXCodec().encode(unref(graph).getModel()))
  return xml
}

interface UseMXGraphProps {
  graph: Ref<Element | null>
  outline: Ref<Element | null>
}

const useMXGraph = (props: UseMXGraphProps) => {
  const graph: Ref<any> = ref(null)
  const outline = ref(null)
  const { graph: graphContainer, outline: outlineContainer } = props
  const undoManager = ref(new MXUndoManager())
  const undoListener = (sender: any, evt: any) => {
    unref(undoManager).undoableEditHappened(evt.getProperty('edit'))
  }
  const drawGraphProps: DrawGraphProps = { graphContainer, outlineContainer, undoManager, graph, outline, undoListener }
  return {
    drawGraph: (data: unknown) => drawGraph(drawGraphProps, data),
    getXml: () => getXml(graph),
    styleIndex: computed(() => styleIndex),
    undoManager,
    graphInstance: computed(() => unref(graph))
  }
}

const generateXmlFromDiagram = async (diagram: IDiagram): Promise<string> => {
  const el = document.createElement('div')
  const graph = new MXGraph(el)
  graph.getModel().beginUpdate()
  try {
    const { elements = [], connectors = [] } = diagram
    const vertexIndex: any = {}
    const defaultParent = graph.getDefaultParent()

    elements
      .forEach((element: IElement) => {
        const { id, parentId, name, geometry } = element
        vertexIndex[id] = graph.insertVertex(vertexIndex[parentId] ?? defaultParent, id, name, ...geometry, getStyle(element))
      })

    connectors
      .forEach((connector: IConnector) => {
        const { id, sourceId, targetId } = connector
        const sourceVertex = vertexIndex[sourceId]
        const targetVertex = vertexIndex[targetId]
        graph.insertEdge(defaultParent, id, '', sourceVertex, targetVertex, getStyle(connector))
      })
  } finally {
    graph.getModel().endUpdate()
  }
  const xml = getXml(graph)

  graph.destroy()
  el.remove()

  return xml
}

export default useMXGraph
export { styleIndex, generateXmlFromDiagram }
