import { Connector, Diagram, Element } from '../types'
import { ConnectorDirection } from './xmlToJsonMapper'
import mxgraph from '../helpers/mxgraph-shims'

const mxConstants = mxgraph.mxConstants as Record<string, string>

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
    // [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    // [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_STARTARROW]: mxConstants.ARROW_DIAMOND_THIN,
    [mxConstants.STYLE_STARTFILL]: '1',
    [mxConstants.STYLE_STARTSIZE]: '10',
    [mxConstants.STYLE_ENDARROW]: mxConstants.NONE
  },
  ArchiMate_Serving: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ORTHOGONAL,
    // [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    // [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_ENDARROW]: mxConstants.ARROW_OPEN,
    [mxConstants.STYLE_ENDFILL]: '1'
  },
  ArchiMate_Realization: {
    [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ORTHOGONAL,
    // [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ELBOW,
    // [mxConstants.STYLE_ELBOW]: mxConstants.ELBOW_VERTICAL,
    [mxConstants.STYLE_ENDARROW]: mxConstants.ARROW_BLOCK,
    [mxConstants.STYLE_ENDFILL]: '0',
    [mxConstants.STYLE_DASHED]: '1'
  }
}

const getConnectorStyleParams = (connector: Connector) => {
  const connectorStyleParams = { ...ARCHIMATE_RELATION_INDEX[connector?.type ?? 'DEFAULT'] }
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
}
