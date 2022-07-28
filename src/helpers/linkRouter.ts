import { Element, Connector, CoordinatePoint } from '../types'

export const getElementCenter = (element: Element): CoordinatePoint => {
  const { rect } = element
  if (rect === null) throw Error('invalid element geometry')
  const { x0, y0, width, height } = rect
  const x = x0 + width / 2
  const y = y0 + height / 2
  const elementCenter = { x, y }
  return elementCenter
}

// SX and SY are relative to the centre of the start object
// EX and EY are relative to the centre of the end object
// EDGE ranges in value from 1-4, with 1=Top, 2=Right, 3=Bottom, 4=Left (Outgoing Point of the Start Object)

export enum Edge {
  'TOP' = 1,
  'RIGHT' = 2,
  'BOTTOM' = 3,
  'LEFT' = 4
}

export const computePoints = (connector: Connector, source: Element, target: Element) => {
  if (source.rect === null || target.rect === null) throw Error('invalid source or target geometries')
  let exitPoint: CoordinatePoint | null = null
  let entryPoint: CoordinatePoint | null = null

  if (connector.S !== null) {
    switch (connector.edge) {
      case 1: // TOP EDGE
        exitPoint = {
          x: source.rect.x0 + source.rect.width / 2 + connector.S.x,
          y: source.rect.y0
        }
        break
      case 2: // RIGHT EDGE
        exitPoint = {
          x: source.rect.x0 + source.rect.width,
          y: Math.floor(source.rect.y0 + source.rect.height / 2 - connector.S.y) - 2 // OFFSET
        }
        break
      case 3: // BOTTOM EDGE
        exitPoint = {
          x: source.rect.x0 + source.rect.width / 2 + connector.S.x,
          y: source.rect.y0 + source.rect.height
        }
        break
      case 4:
        exitPoint = {
          x: source.rect.x0,
          y: source.rect.y0 + source.rect.height / 2 - connector.S.y
        }
        break
    }
  }

  // last point is the last point in path or exitPoint from source
  const lastPoint = connector.path[connector.path.length - 1] ?? exitPoint
  if (lastPoint === null) return { entryPoint: null, exitPoint: null }

  if (connector.E !== null) {
    entryPoint = {
      x: target.rect.x0 + target.rect.width / 2 + connector.E.x,
      y: target.rect.y0 + target.rect.height / 2 - connector.E.y
    }
    // Special cases with horizontal and vertical lines:
    if (entryPoint.x === lastPoint.x) {
      const rY1 = target.rect.y0
      const rY2 = target.rect.y0 + target.rect.height
      const dY1 = Math.abs(lastPoint.y - rY1)
      const dY2 = Math.abs(lastPoint.y - rY2)
      entryPoint.y = dY1 < dY2 ? rY1 : rY2
    } else if (entryPoint.y === lastPoint.y) {
      const rX1 = target.rect.x0
      const rX2 = target.rect.x0 + target.rect.width
      const dX1 = Math.abs(lastPoint.x - rX1)
      const dX2 = Math.abs(lastPoint.x - rX2)
      entryPoint.x = dX1 < dX2 ? rX1 : rX2
    } else {
      // It's not a straight line but a straight line that can be described with y=m*x+b

      // 1.) Find straight line between start and end pointhn
      // Ye-Ys
      // m = ----- b=Ys-m*Xs or b=Ye-m*Xe
      // Xe-Xs
      const m = (entryPoint.y - lastPoint.y) / (entryPoint.x - lastPoint.x)
      const b = lastPoint.y - m * lastPoint.x

      // 2.) Determination of the horizontal and vertical lines of the rectangle and the points of intersection
      // The lines that define the rectangle:
      const rY1 = target.rect.y0
      const rY2 = target.rect.y0 + target.rect.height
      const rX1 = target.rect.x0
      const rX2 = target.rect.x0 + target.rect.width

      // (rX1, rY1) -to-> (rX2, rY2)

      // Horizontal lines:
      // y - b
      // x = -----
      // m

      const lengthToPoint = []

      const sX1 = (rY1 - b) / m // S1(sX1|rY1)
      if (sX1 >= rX1 && sX1 <= rX2) {
        // Der Schnittpunkt sX1 ist am Rechteck
        // Distanz: d=SQRT((y2-y1)^2+(x2-x1)^2)
        const dS1 = Math.sqrt(Math.pow(rY1 - lastPoint.y, 2) + Math.pow(sX1 - lastPoint.x, 2))
        lengthToPoint.push({ distanz: dS1, x: sX1, y: rY1 })
      }

      const sX2 = (rY2 - b) / m // S2(sX2|rY2)
      if (sX2 >= rX1 && sX2 <= rX2) {
        // Der Schnittpunkt sX2 ist am Rechteck
        // Distanz: d=SQRT((y2-y1)^2+(x2-x1)^2)
        const dS2 = Math.sqrt(Math.pow(rY2 - lastPoint.y, 2) + Math.pow(sX2 - lastPoint.x, 2))
        lengthToPoint.push({ distanz: dS2, x: sX2, y: rY2 })
      }

      // Vertikale Geraden:
      //
      // y = m*x + b
      const sY1 = m * rX1 + b // S3(rX1|sY1)
      if (sY1 >= rY1 && sY1 <= rY2) {
        // Der Schnittpunkt sY1 ist am Rechteck
        // Distanz: d=SQRT((y2-y1)^2+(x2-x1)^2)
        const dS3 = Math.sqrt(Math.pow(sY1 - lastPoint.y, 2) + Math.pow(rX1 - lastPoint.x, 2))
        lengthToPoint.push({ distanz: dS3, x: rX1, y: sY1 })
      }

      const sY2 = m * rX2 + b // S4(rX2|sY2)
      if (sY2 >= rY1 && sY2 <= rY2) {
        // Der Schnittpunkt sY2 ist am Rechteck
        // Distanz: d=SQRT((y2-y1)^2+(x2-x1)^2)
        const dS4 = Math.sqrt(Math.pow(sY2 - lastPoint.y, 2) + Math.pow(rX2 - lastPoint.x, 2))
        lengthToPoint.push({ distanz: dS4, x: rX2, y: sY2 })
      }

      // Sortiere alle Punkte nach Distanz - der mit der kleinsten Entfernung isses
      lengthToPoint.sort((a, b) => a.distanz - b.distanz)
      const [shortestPoint = null] = lengthToPoint
      if (shortestPoint !== null) entryPoint = { x: shortestPoint.x, y: shortestPoint.y }
      else entryPoint = { x: lastPoint.x, y: lastPoint.y }
    }
  }

  // convert absolute coordinates into relative coordinates compatible with mxGraph
  if (exitPoint !== null) {
    exitPoint = {
      x: Math.abs(source.rect.x0 - exitPoint.x) / source.rect.width,
      y: Math.abs(source.rect.y0 - exitPoint.y) / source.rect.height
    }
  }

  if (entryPoint !== null) {
    entryPoint = {
      x: Math.abs(target.rect.x0 - entryPoint.x) / target.rect.width,
      y: Math.abs(target.rect.y0 - entryPoint.y) / target.rect.height
    }
  }

  return { exitPoint, entryPoint }
}
