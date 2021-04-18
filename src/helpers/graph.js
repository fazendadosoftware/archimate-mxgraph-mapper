window.mxLoadResources = false
window.mxForceIncludes = false
window.mxResourceExtension = '.txt'
window.mxLoadStylesheets = false

const mxgraph = require('mxgraph')()

// decode bug https://github.com/jgraph/mxgraph/issues/49
window.mxGraph = mxgraph.mxGraph
window.mxGraphModel = mxgraph.mxGraphModel
window.mxEditor = mxgraph.mxEditor
window.mxGeometry = mxgraph.mxGeometry
window.mxDefaultKeyHandler = mxgraph.mxDefaultKeyHandler
window.mxDefaultPopupMenu = mxgraph.mxDefaultPopupMenu
window.mxStylesheet = mxgraph.mxStylesheet
window.mxDefaultToolbar = mxgraph.mxDefaultToolbar
window.mxConnectionHandler = mxgraph.mxConnectionHandler
window.mxEdgeHandler = mxgraph.mxEdgeHandler

window.mxUtils = mxgraph.mxUtils
window.mxShape = mxgraph.mxShape
window.mxCellRenderer = mxgraph.mxCellRenderer

require('./shapes/mxArchimate3')

export default mxgraph