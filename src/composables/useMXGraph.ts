import mxgraph from '../helpers/mxgraph-shims'
import '../helpers/mxArchimate3Shapes'
import useSwal from './useSwal'
import { Diagram, Element, Connector } from '../types'
import { ConnectorDirection } from '../helpers/xmlToJsonMapper'
import { ConnectorBuilder } from '../helpers/ConnectorBuilder'
import styles from '../assets/data/styles.json'
import { ref, unref, Ref, computed } from 'vue'

const { toast } = useSwal()

const styleIndex: Record<string, string> = styles
const { mxClient, mxUtils, mxGraph: MXGraph, mxCodec: MXCodec, mxOutline: MXOutline, mxUndoManager: MXUndoManager, mxEvent, mxPoint: MXPoint } = mxgraph

interface DrawGraphProps {
  graphContainer: Ref<Element | null>
  outlineContainer: Ref<Element | null>
  undoManager: any
  graph: Ref<any>
  outline: Ref<any>
  undoListener: any
}

const getStyle = (type: string | null) => type === null ? null : styleIndex[type] ?? null

const drawGraph = (props: DrawGraphProps, diagram: Diagram | string) => {
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
        if (diagram === null) {
          throw Error('null data')
        } else if (typeof diagram === 'string') {
          const doc = mxUtils.parseXml(diagram)
          const codec = new MXCodec(doc)
          codec.decode(doc.documentElement, _graph.getModel())
        } else {
          const vertexIndex: any = {}
          const defaultParent = _graph.getDefaultParent()
          diagram.elements
            .forEach((element: Element) => {
              const { id, parent, name, rect } = element
              const geometry = rect === null ? null : [rect.x0, rect.y0, rect.width, rect.height]
              const parentNode = parent === null ? defaultParent : vertexIndex[parent] ?? defaultParent
              const style = getStyle(element.type)
              if (style === null && ((element?.type) != null)) {
                throw Error(`null style for element type ${element?.type ?? 'undefined'}`)
              }
              if (style !== null && geometry !== null) vertexIndex[id] = _graph.insertVertex(parentNode, id, name, ...geometry, style)
            })

          const connectorBuilder = new ConnectorBuilder(diagram)
          diagram.connectors
            .forEach((connector: Connector) => {
              const isReversed = connector?.direction === ConnectorDirection.REVERSE
              const sourceVertex = vertexIndex[isReversed ? connector.end : connector.start]
              const targetVertex = vertexIndex[isReversed ? connector.start : connector.end]
              const style = connectorBuilder.getConnectorStyle(connector)
              if (style !== null) {
                const edge = _graph.insertEdge(defaultParent, connector.id, '', sourceVertex, targetVertex, style)
                if (connector.path.length > 0) {
                  edge.getGeometry().points = connector.path.map(({ x, y }) => new MXPoint(x, y))
                }
              }
            })
        }
      } finally {
        _graph.getModel().endUpdate()
        graph.value = _graph
        // console.log(getXml(_graph))
      }
      unref(outline)?.outline?.destroy()
      if (diagram !== null) {
        outline.value = new MXOutline(_graph, outlineContainerEl)
        _graph.getModel().addListener(mxEvent.UNDO, undoListener)
        _graph.getView().addListener(mxEvent.UNDO, undoListener)
      }
      // console.log(getXml(_graph))
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
    drawGraph: (data: Diagram) => drawGraph(drawGraphProps, data),
    // drawTestGraph: () => drawtTestGraph(drawGraphProps),
    getXml: () => getXml(graph),
    styleIndex: computed(() => styleIndex),
    undoManager,
    graphInstance: computed(() => unref(graph))
  }
}

const generateXmlFromDiagram = async (diagram: Diagram): Promise<string> => {
  const el = document.createElement('div')
  const graph = new MXGraph(el)
  graph.getModel().beginUpdate()
  try {
    const { elements = [], connectors = [] } = diagram
    const vertexIndex: any = {}
    const defaultParent = graph.getDefaultParent()

    elements
      .forEach((element: Element) => {
        const { id, parent, name, rect } = element
        const parentNode = parent === null ? defaultParent : vertexIndex[parent] ?? defaultParent
        const geometry = rect === null ? null : [rect.x0, rect.y0, rect.width, rect.height]
        const style = getStyle(element.type)
        if (geometry !== null && style !== null) vertexIndex[id] = graph.insertVertex(parentNode, id, name, ...geometry, style)
      })

    connectors
      .forEach((connector: Connector) => {
        const { id, start, end } = connector
        const sourceVertex = vertexIndex[start]
        const targetVertex = vertexIndex[end]
        const style = getStyle(connector.type)
        if (style !== null) graph.insertEdge(defaultParent, id, '', sourceVertex, targetVertex, style)
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
