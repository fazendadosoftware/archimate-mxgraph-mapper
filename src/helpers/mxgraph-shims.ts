import MXGraph from 'mxgraph'
export {}

declare global {
  interface Window {
    mxLoadResources: any
    mxForceIncludes: any
    mxResourceExtension: any
    mxLoadStylesheets: any
    mxGraph: any
    mxGraphModel: any
    mxEditor: any
    mxGeometry: any
    mxDefaultKeyHandler: any
    mxDefaultPopupMenu: any
    mxStylesheet: any
    mxDefaultToolbar: any
    mxConnectionHandler: any
    mxEdgeHandler: any
    mxUtils: any
    mxShape: any
    mxCellRenderer: any
  }
}

window.mxLoadResources = false
window.mxForceIncludes = false
window.mxResourceExtension = '.txt'
window.mxLoadStylesheets = false

const mxGraph = MXGraph()

// decode bug https://github.com/jgraph/mxGraph/issues/49
window.mxGraph = mxGraph.mxGraph
window.mxGraphModel = mxGraph.mxGraphModel
window.mxEditor = mxGraph.mxEditor
window.mxGeometry = mxGraph.mxGeometry
window.mxDefaultKeyHandler = mxGraph.mxDefaultKeyHandler
window.mxDefaultPopupMenu = mxGraph.mxDefaultPopupMenu
window.mxStylesheet = mxGraph.mxStylesheet
window.mxDefaultToolbar = mxGraph.mxDefaultToolbar
window.mxConnectionHandler = mxGraph.mxConnectionHandler
window.mxEdgeHandler = mxGraph.mxEdgeHandler

window.mxUtils = mxGraph.mxUtils
window.mxShape = mxGraph.mxShape
window.mxCellRenderer = mxGraph.mxCellRenderer

export default mxGraph
