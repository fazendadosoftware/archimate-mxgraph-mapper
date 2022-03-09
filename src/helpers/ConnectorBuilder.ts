import { Connector, Diagram, Element } from '../types'
import mxgraph from '../helpers/mxgraph-shims'

const { mxClient, mxUtils, mxGraph: MXGraph, mxCodec: MXCodec, mxOutline: MXOutline, mxUndoManager: MXUndoManager, mxEvent, mxPoint: MXPoint, mxStylesheet, mxConstants, mxPerimeter, mxEdgeStyle } = mxgraph

const connectorTypeIndex = {
  // ArchiMate_Realization: 'edgeStyle=elbowEdgeStyle;html=1;endArrow=block;elbow=vertical;endFill=0;dashed=1;',
  ArchiMate_Access: 'edgeStyle=elbowEdgeStyle;html=1;endArrow=open;elbow=vertical;endFill=0;dashed=1;dashPattern=1 4;',
  ArchiMate_Association: 'edgeStyle=elbowEdgeStyle;html=1;endArrow=none;elbow=vertical;',
  ArchiMate_Assignment: 'endArrow=block;html=1;endFill=1;startArrow=oval;startFill=1;edgeStyle=elbowEdgeStyle;elbow=vertical;',
  ArchiMate_Serving: 'edgeStyle=elbowEdgeStyle;html=1;endArrow=open;elbow=vertical;endFill=1;',
  ArchiMate_Composition: 'html=1;endArrow=diamondThin;endFill=1;edgeStyle=elbowEdgeStyle;elbow=vertical;endSize=10;'
}

const reversedRelations = [
  'ArchiMate_Composition',
  'ArchiMate_Aggregation'
]

export interface EntryStyleParams {
  entryX?: number
  entryY?: number
  entryDx?: number
  entryDy?: number
  entryPerimeter?: number
}

export interface ExitStyleParams {
  exitX?: number
  exitY?: number
  exitDx?: number
  exitDy?: number
  exitPerimeter?: number
}

// https://github.com/jgraph/mxgraph/blob/master/javascript/src/js/util/mxConstants.js
const ARCHIMATE_RELATION_INDEX: Record<string, any> = {
  DEFAULT: {
  },
  ArchiMate_Access: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ORTHOGONAL,
    // [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    // [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_ENDARROW]: mxConstants.ARROW_OPEN,
    [mxConstants.STYLE_ENDFILL]: '0',
    [mxConstants.STYLE_DASHED]: '1',
    [mxConstants.STYLE_DASH_PATTERN]: '1 4'
    /*
    edgeStyle: EdgeStyle.ELBOW,
    endArrow: ArrowType.OPEN,
    elbow: 'vertical',
    endFill: 0,
    dashed: 1,
    dashPattern: '1 4'
    */
  },
  ArchiMate_Aggregation: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_STARTARROW]: mxConstants.ARROW_DIAMOND_THIN,
    [mxConstants.STYLE_STARTFILL]: '0',
    [mxConstants.STYLE_STARTSIZE]: '0',
    [mxConstants.STYLE_ENDARROW]: mxConstants.NONE
    /*
    startArrow: ArrowType.DIAMOND_THIN,
    startFill: 0,
    startSize: 10,
    endArrow: ArrowType.NONE,
    edgeStyle: EdgeStyle.ELBOW,
    elbow: 'vertical'
    */
  },
  ArchiMate_Assignment: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_STARTARROW]: mxConstants.ARROW_OVAL,
    [mxConstants.STYLE_STARTFILL]: '1',
    [mxConstants.STYLE_ENDARROW]: mxConstants.ARROW_BLOCK,
    [mxConstants.STYLE_ENDFILL]: '1'
    /*
    startArrow: ArrowType.OVAL,
    startFill: 1,
    endArrow: ArrowType.BLOCK,
    endFill: 1,
    edgeStyle: EdgeStyle.ELBOW,
    elbow: 'vertical'
    */
  },
  ArchiMate_Association: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_ENDARROW]: mxConstants.NONE
    /*
    edgeStyle: EdgeStyle.ELBOW,
    endArrow: ArrowType.NONE,
    elbow: 'vertical'
    */
  },
  ArchiMate_Composition: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_STARTARROW]: mxConstants.ARROW_DIAMOND_THIN,
    [mxConstants.STYLE_STARTFILL]: '1',
    [mxConstants.STYLE_STARTSIZE]: '10',
    [mxConstants.STYLE_ENDARROW]: mxConstants.NONE
    /*
    startArrow: ArrowType.DIAMOND_THIN,
    startFill: 1,
    startSize: 10,
    endArrow: ArrowType.NONE,
    edgeStyle: EdgeStyle.ELBOW,
    elbow: 'vertical'
    */
  },
  ArchiMate_Serving: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_ENDARROW]: mxConstants.ARROW_OPEN,
    [mxConstants.STYLE_ENDFILL]: '1'
    /*
    edgeStyle: EdgeStyle.ELBOW,
    endArrow: ArrowType.OPEN,
    elbow: 'vertical',
    endFill: 1
    */
  },
  ArchiMate_Realization: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_ENDARROW]: mxConstants.ARROW_BLOCK,
    [mxConstants.STYLE_ENDFILL]: '0',
    [mxConstants.STYLE_DASHED]: '1'
    /*
    edgeStyle: EdgeStyle.ELBOW,
    endArrow: ArrowType.BLOCK,
    elbow: 'vertical',
    endFill: 0,
    dashed: 1
    */
  }
}

export class ConnectorBuilder {
  private readonly _diagramElementIndex: Record<string, Element> = {}

  constructor (diagram: Diagram) {
    this._diagramElementIndex = diagram.elements
      .reduce((accumulator, element) => ({ ...accumulator, [element.id]: element }), {})
  }

  getConnectorStyle (connector: Connector) {
    const connectorStyleParams = ARCHIMATE_RELATION_INDEX[connector?.type ?? 'DEFAULT']
    if (connector.sourcePoint !== null && connector.targetPoint !== null) {
      const { [connector.start]: source = null, [connector.end]: target = null } = this._diagramElementIndex
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (source !== null && source.rect !== null) {
        const { width, height } = source.rect
        const { x: dX, y: dY } = connector.sourcePoint
        const exitX = 0.5 - dX / width
        const exitY = 0.5 - dY / height
        connectorStyleParams.exitX = connector.edge === 4
          ? 0
          : connector.edge === 2
            ? 1
            : 1 - exitX
        connectorStyleParams.exitY = connector.edge === 1
          ? 0
          : connector.edge === 3
            ? 1
            : exitY
      }
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (target !== null && target.rect !== null) {
        const { width, height } = target.rect
        const { x: dX, y: dY } = connector.targetPoint
        const entryX = 0.5 - dX / width
        const entryY = 0.5 - dY / height
        connectorStyleParams.entryX = connector.edge === 4
          ? 1
          : connector.edge === 2
            ? 0
            : 1 - entryX
        connectorStyleParams.entryY = connector.edge === 1
          ? 1
          : connector.edge === 3
            ? 0
            : entryY
      }
    }

    const connectorStyle = Object.entries({ html: 1, ...connectorStyleParams }).map(([key, value]) => `${key}=${value as string}`).join(';')
    return connectorStyle
  }

  static getConnectorStyle (connector: Connector, elementIndex?: Record<string, Element>) {
    const connectorStyleParams = ARCHIMATE_RELATION_INDEX[connector?.type ?? 'DEFAULT']
    if (connector.sourcePoint !== null && connector.targetPoint !== null && elementIndex !== undefined) {
      const { [connector.start]: source = null, [connector.end]: target = null } = elementIndex
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (source !== null && source.rect !== null) {
        const { width, height } = source.rect
        const { x: dX, y: dY } = connector.sourcePoint
        const entryX = 0.5 + dX / width
        const entryY = 0.5 + dY / height
        // connectorStyleParams.entryX = entryX
        // connectorStyleParams.entryY = entryY
      }
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (target !== null && target.rect !== null) {
        const { width, height } = target.rect
        const { x: dX, y: dY } = connector.targetPoint
        const exitX = 0.5 + dX / width
        const exitY = 0.5 + dY / height
        // connectorStyleParams.exitX = exitX
        // connectorStyleParams.exitY = exitY
      }
    }
    connectorStyleParams.exitX = 1
    connectorStyleParams.exitY = 0
    connectorStyleParams.entryX = 0
    connectorStyleParams.entryY = 1
    const connectorStyle = Object.entries({ html: 1, ...connectorStyleParams }).map(([key, value]) => `${key}=${value as string}`).join(';')
    // return 'startArrow=diamondThin;startFill=1;startSize=10;endArrow=none;html=1;rounded=0;strokeColor=black;exitX=1;exitY=0.75;exitDx=0;exitDy=0;edgeStyle=elbowEdgeStyle;'
    // console.log('CONNECTOR STYLE', connectorStyle)
    return connectorStyle
  }
}
