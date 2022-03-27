import { Connector, Diagram, Element } from '../types'
import { ConnectorDirection } from './xmlToJsonMapper'
import mxgraph from '../helpers/mxgraph-shims'
import { computePoints } from './linkRouter'

const mxConstants = mxgraph.mxConstants as Record<string, string>

/*
*  1 = Direct                    Mode=1
*  2 = Auto Routing              Mode=2
*  3 = Custom Line               Mode=3
*  4 = Tree Vertical             Mode=3;TREE=V
*  5 = Tree Horizontal           Mode=3;TREE=H
*  6 = Lateral Vertical          Mode=3;TREE=LV
*  7 = Lateral Horizontal        Mode=3;TREE=LH
*  8 = Orthogonal Square         Mode=3;TREE=OS
*  9 = Orthogonal Rounded        Mode=3;TREE=OR
*/

// https://github.com/jgraph/mxgraph/blob/master/javascript/src/js/util/mxConstants.js
const ARCHIMATE_RELATION_INDEX: Record<string, any> = {
  DEFAULT: {
  },
  ArchiMate_Access: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ORTHOGONAL,
    [mxConstants.STYLE_ENDARROW]: mxConstants.ARROW_OPEN,
    [mxConstants.STYLE_ENDFILL]: '0',
    [mxConstants.STYLE_DASHED]: '1',
    [mxConstants.STYLE_DASH_PATTERN]: '1 4'
  },
  ArchiMate_Aggregation: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ORTHOGONAL,
    // [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    // [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_STARTARROW]: mxConstants.ARROW_DIAMOND_THIN,
    [mxConstants.STYLE_STARTFILL]: '0',
    [mxConstants.STYLE_STARTSIZE]: '0',
    [mxConstants.STYLE_ENDARROW]: mxConstants.NONE
  },
  ArchiMate_Assignment: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ORTHOGONAL,
    // [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    // [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_STARTARROW]: mxConstants.ARROW_OVAL,
    [mxConstants.STYLE_STARTFILL]: '1',
    [mxConstants.STYLE_ENDARROW]: mxConstants.ARROW_BLOCK,
    [mxConstants.STYLE_ENDFILL]: '1'
  },
  ArchiMate_Association: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ORTHOGONAL,
    // [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    // [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_ENDARROW]: mxConstants.NONE
  },
  ArchiMate_Composition: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ORTHOGONAL,
    [mxConstants.STYLE_STARTARROW]: mxConstants.ARROW_DIAMOND_THIN,
    [mxConstants.STYLE_STARTFILL]: '1',
    [mxConstants.STYLE_STARTSIZE]: '10',
    [mxConstants.STYLE_ENDARROW]: mxConstants.NONE
  },
  ArchiMate_Serving: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ORTHOGONAL,
    [mxConstants.STYLE_ENDARROW]: mxConstants.ARROW_OPEN,
    [mxConstants.STYLE_ENDFILL]: '1'
  },
  ArchiMate_Realization: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ORTHOGONAL,
    [mxConstants.STYLE_ENDARROW]: mxConstants.ARROW_BLOCK,
    [mxConstants.STYLE_ENDFILL]: '0',
    [mxConstants.STYLE_DASHED]: '1'
  }
}

const getConnectorStyleParams = (connector: Connector) => {
  const connectorStyleParams = { ...ARCHIMATE_RELATION_INDEX[connector?.type ?? 'DEFAULT'] }
  switch (connector.mode) {
    // Direct 
    case 1:
      connectorStyleParams[mxConstants.STYLE_EDGE] = mxConstants.NONE
      break
    // Auto Routing
    case 2:
      break
    case 3:
      switch (connector.tree) {
        // Orthogonal Square
        case 'OS':
          connectorStyleParams[mxConstants.STYLE_EDGE] = mxConstants.EDGESTYLE_ORTHOGONAL
          break
        // Orthogonal Rounded
        case 'OR':
          connectorStyleParams[mxConstants.STYLE_EDGE] = mxConstants.EDGESTYLE_ORTHOGONAL
          connectorStyleParams[mxConstants.STYLE_CURVED] = 1
          break
        // Lateral Vertical / Tree Vertical
        case 'LV':
        case 'V':
          connectorStyleParams[mxConstants.STYLE_EDGE] = mxConstants.EDGESTYLE_ELBOW
          connectorStyleParams[mxConstants.STYLE_ELBOW] = mxConstants.ELBOW_VERTICAL
          break
        // Lateral Horizontal / Tree Horizontal
        case 'LH':
        case 'H':
          connectorStyleParams[mxConstants.STYLE_EDGE] = mxConstants.EDGESTYLE_ELBOW
          connectorStyleParams[mxConstants.STYLE_ELBOW] = mxConstants.ELBOW_HORIZONTAL
          break
        // Custom Line
        default:
          connectorStyleParams[mxConstants.STYLE_EDGE] = mxConstants.NONE
      }
      break
    default:
      console.log('UNKNOWN CONNECTOR MODE', connector.mode, connector.tree)
  }

  if (connector.direction === ConnectorDirection.REVERSE) {
    if (connectorStyleParams[mxConstants.STYLE_ENDARROW] !== undefined) {
      connectorStyleParams[mxConstants.STYLE_STARTARROW] = connectorStyleParams[mxConstants.STYLE_ENDARROW]
      connectorStyleParams[mxConstants.STYLE_STARTFILL] = connectorStyleParams[mxConstants.STYLE_ENDFILL]
      connectorStyleParams[mxConstants.STYLE_ENDARROW] = undefined
      connectorStyleParams[mxConstants.STYLE_ENDFILL] = undefined
    } else if (connectorStyleParams[mxConstants.STYLE_STARTARROW] !== undefined) {
      connectorStyleParams[mxConstants.STYLE_ENDARROW] = connectorStyleParams[mxConstants.STYLE_STARTARROW]
      connectorStyleParams[mxConstants.STYLE_ENDFILL] = connectorStyleParams[mxConstants.STYLE_STARTFILL]
      connectorStyleParams[mxConstants.STYLE_STARTARROW] = undefined
      connectorStyleParams[mxConstants.STYLE_STARTFILL] = undefined
    }
  } else if (connector.direction === ConnectorDirection.BIDIRECTIONAL) {
    if (connectorStyleParams[mxConstants.STYLE_ENDARROW] !== undefined) {
      connectorStyleParams[mxConstants.STYLE_STARTARROW] = connectorStyleParams[mxConstants.STYLE_ENDARROW]
      connectorStyleParams[mxConstants.STYLE_STARTFILL] = connectorStyleParams[mxConstants.STYLE_ENDFILL]
    } else if (connectorStyleParams[mxConstants.STYLE_STARTARROW] !== undefined) {
      connectorStyleParams[mxConstants.STYLE_ENDARROW] = connectorStyleParams[mxConstants.STYLE_STARTARROW]
      connectorStyleParams[mxConstants.STYLE_ENDFILL] = connectorStyleParams[mxConstants.STYLE_STARTFILL]
    }
  }
  return connectorStyleParams
}

export class ConnectorBuilder {
  private readonly _diagramElementIndex: Record<string, Element> = {}

  constructor (diagram: Diagram) {
    this._diagramElementIndex = diagram.elements
      .reduce((accumulator, element) => ({ ...accumulator, [element.id]: element }), {})
  }

  getConnectorStyle (connector: Connector) {
    const isHidden = connector?.styleParams?.Hidden === '1'
    const connectorStyleParams = getConnectorStyleParams(connector)
    if (isHidden || connector.targetIsOwnedBehaviorOfSource) connectorStyleParams.strokeColor = 'none'

    const { [connector.start]: source = null, [connector.end]: target = null } = this._diagramElementIndex
    if (source === null || source.rect === null) throw Error(`invalid source node: ${JSON.stringify(source)}`)
    if (target === null || target.rect === null) throw Error(`invalid target node: ${JSON.stringify(target)}`)

    const { exitPoint, entryPoint } = computePoints(connector, source, target)

    if (exitPoint !== null) {
      connectorStyleParams.exitX = exitPoint.x
      connectorStyleParams.exitY = exitPoint.y
    }
    if (entryPoint !== null) {
      connectorStyleParams.entryX = entryPoint.x
      connectorStyleParams.entryY = entryPoint.y
    }

    const connectorStyle = Object.entries({ html: 1, ...connectorStyleParams }).map(([key, value]) => `${key}=${value as string}`).join(';')
    return connectorStyle
  }
}
