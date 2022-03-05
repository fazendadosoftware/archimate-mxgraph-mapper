import { Connector, Diagram, Element } from '../types'

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

export enum ArrowType {
  NONE = 'none',
  CLASSIC = 'classic',
  CLASSIC_THIN = 'classicThin',
  OPEN = 'open',
  OPEN_ASYNC = 'openAsync',
  BLOCK = 'block',
  BLOCK_THIN = 'blockThin',
  ASYNC = 'async',
  OVAL = 'oval',
  DIAMOND = 'diamond',
  DIAMOND_THIN = 'diamondThin',
  BOX = 'box',
  HALF_CIRCLE = 'halfCircle',
  DASH = 'dash',
  CROSS = 'cross',
  CIRCLE_PLUS = 'circlePlus',
  CIRCLE = 'circle',
  BASE_DASH = 'baseDash',
  ERONE = 'ERone',
  ERMANDONE = 'ERmandOne',
  ERMANY = 'ERmany',
  ERONETOMANY = 'ERoneToMany',
  ERZEROTOONE = 'ERzeroToOne',
  ERZEROTOMANY = 'ERzeroToMany',
  DOUBLE_BLOCK = 'doubleBlock'
}

export enum EdgeStyle {
  ORTHOGONAL = 'orthogonalEdgeStyle',
  ELBOW = 'elbowEdgeStyle',
  ISOMETRIC = 'isometricEdgeStyle',
  ENTITY_RELATION = 'entityRelationEdgeStyle'
}

export interface StartEdgeParams {
  startArrow?: ArrowType
  startFill?: number
  startSize?: number
}

export interface EndEdgeParams {
  endArrow?: ArrowType
  endFill?: number
  endSize?: number
}

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

export interface EdgeStyleParams {
  edgeStyle?: EdgeStyle
  elbow?: 'vertical'
  rounded?: 0 | 1
  curved?: 0 | 1
}
export interface LineStyleParams {
  dashed?: number
  dashPattern?: string
}

export interface ConnectorStyleParams
  extends
  EntryStyleParams,
  ExitStyleParams,
  EndEdgeParams,
  StartEdgeParams,
  EdgeStyleParams,
  LineStyleParams {
}

const ARCHIMATE_RELATION_INDEX: Record<string, ConnectorStyleParams> = {
  DEFAULT: {
  },
  ArchiMate_Access: {
    edgeStyle: EdgeStyle.ELBOW,
    endArrow: ArrowType.OPEN,
    elbow: 'vertical',
    endFill: 0,
    dashed: 1,
    dashPattern: '1 4'
  },
  ArchiMate_Aggregation: {
    startArrow: ArrowType.DIAMOND_THIN,
    startFill: 0,
    startSize: 10,
    endArrow: ArrowType.NONE,
    edgeStyle: EdgeStyle.ELBOW,
    elbow: 'vertical'
  },
  ArchiMate_Assignment: {
    startArrow: ArrowType.OVAL,
    startFill: 1,
    endArrow: ArrowType.BLOCK,
    endFill: 1,
    edgeStyle: EdgeStyle.ELBOW,
    elbow: 'vertical'
  },
  ArchiMate_Association: {
    edgeStyle: EdgeStyle.ELBOW,
    endArrow: ArrowType.NONE,
    elbow: 'vertical'
  },
  ArchiMate_Composition: {
    startArrow: ArrowType.DIAMOND_THIN,
    startFill: 1,
    startSize: 10,
    endArrow: ArrowType.NONE,
    edgeStyle: EdgeStyle.ELBOW,
    elbow: 'vertical'
  },
  ArchiMate_Serving: {
    edgeStyle: EdgeStyle.ELBOW,
    endArrow: ArrowType.OPEN,
    elbow: 'vertical',
    endFill: 1
  },
  ArchiMate_Realization: {
    edgeStyle: EdgeStyle.ELBOW,
    endArrow: ArrowType.BLOCK,
    elbow: 'vertical',
    endFill: 0,
    dashed: 1
  }
}

export class ConnectorBuilder {
  private readonly _diagram: Diagram
  private readonly _diagramElementIndex: Record<string, Element> = {}

  constructor (diagram: Diagram) {
    this._diagram = diagram
    this._diagramElementIndex = diagram.elements
      .reduce((accumulator, element) => ({ ...accumulator, [element.id]: element }), {})
  }

  getConnectorStyle (connector: Connector) {
    const connectorStyleParams = ARCHIMATE_RELATION_INDEX[connector?.type ?? 'DEFAULT']
    if (connector.sourcePoint !== null) {
      const { [connector.start]: source = null } = this._diagramElementIndex
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (source !== null && source.rect !== null) {
        const { x0, width } = source.rect
        const { x } = connector.sourcePoint
        const offsetX = x - x0
        const a = offsetX / width
        console.log('SOURCE', x0, x, offsetX, width, a)
      }
    }
    const connectorStyle = Object.entries({ html: 1, ...connectorStyleParams }).map(([key, value]) => `${key}=${value as string}`).join(';')
    return connectorStyle
  }
}
