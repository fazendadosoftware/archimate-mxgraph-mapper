import mxgraph from '../helpers/mxgraph-shims'
import '../helpers/mxArchimate3Shapes'
import useSwal from './useSwal'
import { Diagram, Element, Connector } from '../types'
import { ConnectorBuilder } from '../helpers/ConnectorBuilder'
import styles from '../assets/data/styles.json'
import { ref, unref, Ref, computed } from 'vue'

const { toast } = useSwal()

const styleIndex: Record<string, string> = styles
const { mxClient, mxUtils, mxGraph: MXGraph, mxCodec: MXCodec, mxOutline: MXOutline, mxUndoManager: MXUndoManager, mxEvent, mxPoint: MXPoint } = mxgraph

interface DrawGraphProps {
  graphContainer?: Ref<HTMLDivElement | null>
  outlineContainer?: Ref<HTMLDivElement | null>
  undoManager?: any
  graph?: Ref<any>
  outline?: Ref<any>
  undoListener?: any
  diagram: Diagram | string
  getXmlOnly?: boolean
}

const getStyle = (type: string | null) => type === null ? null : styleIndex[type] ?? null

const drawGraph = (props: DrawGraphProps) => {
  const { graphContainer, outlineContainer, undoManager, graph, outline, undoListener, diagram, getXmlOnly } = props

  const graphContainerEl = (graphContainer === undefined || getXmlOnly === true) ? document.createElement('div') : unref(graphContainer)
  const outlineContainerEl = unref(outlineContainer)

  if (mxClient.isBrowserSupported() === false) mxUtils.error('Browser is not supported!', 200, false)
  else {
    try {
      if (graph !== undefined && unref(graph) !== null) { unref(graph).destroy(); unref(undoManager).clear() }
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
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { id, parent, children, name, rect } = element
              const geometry = rect === null ? null : [rect.x0, rect.y0, rect.width, rect.height]
              // NOTE: disables parent-child rendering in the diagram
              // const parentNode = parent === null ? defaultParent : vertexIndex[parent] ?? defaultParent
              const parentNode = defaultParent
              const style = getStyle(element.type)
              if (style === null && ((element?.type) != null)) {
                throw Error(`null style for element type ${element?.type ?? 'undefined'}`)
              }
              if (style !== null && geometry !== null) vertexIndex[id] = _graph.insertVertex(parentNode, id, name, ...geometry, style)
            })

          const connectorBuilder = new ConnectorBuilder(diagram)
          /*
          const elementIndex = diagram.elements
            .reduce((accumulator: Record<string, Element>, element) => ({ ...accumulator, [element.id]: element }), {})
          const catiaConnectors = diagram.connectors
            .filter(connector => connector.start === 'EAID-FC7F83E1-5B24-43e3-9A88-5116D9E284C6')
            .sort((connectorA, connectorB) => {
              const A = connectorA?.sourcePoint?.x ?? 0
              const B = connectorB?.sourcePoint?.x ?? 0
              return A - B
            })
            .map(connector => {
              const { start, end, sourcePoint, targetPoint } = connector
              const { [start ?? '']: source, [end ?? '']: target } = elementIndex
              return {
                name: `${source.name ?? ''} -> ${target.name ?? ''}`,
                sourcePoint: sourcePoint?.x,
                targetPoint: targetPoint?.x,
                sourceRect: source.rect,
                targetRect: target.rect
              }
            })
          console.log('CATIA CONNECTORS', JSON.parse(JSON.stringify(catiaConnectors)))
          */
          diagram.connectors
            .forEach((connector: Connector) => {
              const sourceVertex = vertexIndex[connector.start]
              const targetVertex = vertexIndex[connector.end]
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
        if (graph !== undefined) graph.value = _graph
      }
      unref(outline)?.outline?.destroy()
      if (outline !== undefined) outline.value = new MXOutline(_graph, outlineContainerEl)
      _graph.getModel().addListener(mxEvent.UNDO, undoListener)
      _graph.getView().addListener(mxEvent.UNDO, undoListener)
      if (getXmlOnly === true) {
        const xml = getXml(_graph)
        _graph.destroy()
        undoManager?.clear?.()
        graphContainerEl?.remove?.()
        return xml
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
  graph: Ref<HTMLDivElement | null>
  outline?: Ref<HTMLDivElement | null>
}

const useMXGraph = (props: UseMXGraphProps) => {
  const graph: Ref<any> = ref(null)
  const outline = ref(null)
  const { graph: graphContainer, outline: outlineContainer } = props
  const undoManager = ref(new MXUndoManager())
  const undoListener = (sender: any, evt: any) => {
    unref(undoManager).undoableEditHappened(evt.getProperty('edit'))
  }
  const drawGraphProps: DrawGraphProps = { graphContainer, outlineContainer, undoManager, graph, outline, undoListener, diagram: '' }
  return {
    drawGraph: (data: Diagram, getXmlOnly?: boolean) => drawGraph({ ...drawGraphProps, getXmlOnly, diagram: data }),
    getXml: () => getXml(graph),
    styleIndex: computed(() => styleIndex),
    undoManager,
    graphInstance: computed(() => unref(graph))
  }
}

export default useMXGraph
export { styleIndex, drawGraph }
