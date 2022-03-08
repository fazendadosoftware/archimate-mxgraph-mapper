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
const { mxClient, mxUtils, mxGraph: MXGraph, mxCodec: MXCodec, mxOutline: MXOutline, mxUndoManager: MXUndoManager, mxEvent, mxPoint: MXPoint, mxStylesheet, mxConstants, mxPerimeter, mxEdgeStyle } = mxgraph

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
              const { sourcePoint = null, targetPoint = null } = connector
              // NOTE: connector is reversed if for the "ArchiMate_Composition"
              const isReversed = connector?.direction === ConnectorDirection.REVERSE
              const sourceVertex = vertexIndex[isReversed ? connector.end : connector.start]
              const targetVertex = vertexIndex[isReversed ? connector.start : connector.end]
              // TODO: we need to construct dynamic styles for connectors
              // const style = getStyle(connector.type)
              const style = connectorBuilder.getConnectorStyle(connector)
              if (style !== null) {
                const edge = _graph.insertEdge(defaultParent, connector.id, '', sourceVertex, targetVertex, style)
                // https://jgraph.github.io/mxgraph/docs/js-api/files/model/mxGeometry-js.html#mxGeometry.setTerminalPoint
                // if (sourcePoint !== null) edge.geometry.setTerminalPoint(new MXPoint(sourcePoint.x, sourcePoint.y), true)
                // if (targetPoint !== null) edge.geometry.setTerminalPoint(new MXPoint(targetPoint.x, targetPoint.y), false)
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

/*
const drawtTestGraph = (props: DrawGraphProps) => {
  const vertexStyle: any = {}
  vertexStyle[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE
  vertexStyle[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter
  vertexStyle[mxConstants.STYLE_STROKECOLOR] = 'gray'
  vertexStyle[mxConstants.STYLE_ROUNDED] = true
  vertexStyle[mxConstants.STYLE_FILLCOLOR] = '#EEEEEE'
  vertexStyle[mxConstants.STYLE_GRADIENTCOLOR] = 'white'
  vertexStyle[mxConstants.STYLE_FONTCOLOR] = '#774400'
  vertexStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER
  vertexStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE
  vertexStyle[mxConstants.STYLE_FONTSIZE] = '12'
  vertexStyle[mxConstants.STYLE_FONTSTYLE] = 1

  const edgeStyle: any = {}
  edgeStyle[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_CONNECTOR
  edgeStyle[mxConstants.STYLE_STROKECOLOR] = '#6482B9'
  edgeStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER
  edgeStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE
  edgeStyle[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector
  edgeStyle[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_CLASSIC
  edgeStyle[mxConstants.STYLE_FONTSIZE] = '10'

  const { graphContainer, outlineContainer, undoManager, graph, outline, undoListener } = props
  const graphContainerEl = unref(graphContainer)
  const outlineContainerEl = unref(outlineContainer)
  if (graphContainerEl === null || outlineContainerEl === null) return
  if (unref(graph) !== null) { unref(graph).destroy(); unref(undoManager).clear() }
  const _graph = new MXGraph(graphContainerEl)
  _graph.getStylesheet().putDefaultVertexStyle(vertexStyle)
  _graph.getStylesheet().putDefaultEdgeStyle(edgeStyle)
  _graph.getModel().beginUpdate()
  const defaultParent = _graph.getDefaultParent()
  const connector: Connector = {
    id: '60m2Q7WvLiZZtOymNE9S-9',
    category: 'something',
    type: 'ArchiMate_Composition',
    start: '60m2Q7WvLiZZtOymNE9S-5',
    end: '60m2Q7WvLiZZtOymNE9S-6',
    isExternal: false,
    direction: 'undefined',
    sourcePoint: null,
    targetPoint: null
  }
  const connectorStyle = ConnectorBuilder.getConnectorStyle(connector)
  // geometryNode: x0, y0, width, height
  const vertexA = _graph.insertVertex(defaultParent, '60m2Q7WvLiZZtOymNE9S-5', 'A', ...[40, 40, 120, 60], 'rounded=0;whiteSpace=wrap;html=1;')
  const vertexB = _graph.insertVertex(defaultParent, '60m2Q7WvLiZZtOymNE9S-6', 'B', ...[280, 40, 120, 60], 'rounded=0;whiteSpace=wrap;html=1;')
  const _connector = _graph.insertEdge(defaultParent, '60m2Q7WvLiZZtOymNE9S-9', '', vertexA, vertexB, connectorStyle)
  _graph.getModel().endUpdate()
  unref(outline)?.outline?.destroy()
  outline.value = new MXOutline(_graph, outlineContainerEl)
  _graph.getModel().addListener(mxEvent.UNDO, undoListener)
  _graph.getView().addListener(mxEvent.UNDO, undoListener)
  const xml = mxUtils.getXml(new MXCodec().encode(_graph.getModel()))
  console.log(xml)
}
*/

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
