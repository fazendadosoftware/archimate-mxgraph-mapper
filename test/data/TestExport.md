Diagrams are composed by some properties (e.g. "id", "name", "type", "project"), elements and links.
Elements and links represent the nodes (archimate3 shapes) and edges (connections) of the graph/chart.

Issue:
Some diagrams contain links to external elements. For instance, diagram EAID_2AB8FEF0_2003_4130_B641_C72FC484A137 - "AutoCAD LT - Service interaction Diagram", contains the link EAID_8F471368_6A1B_4dc2_90F0_64BF026892B0 whose "end" node EAID_40970527_9C02_479c_B334_815B36027BB6 is not a diagram element, but an external packaged Element named "AutoCAD Layout Design". The main issue here is that there is no geometry representation for those "external" elements included in the export file, i.e. our mapping tool will not know the size and where to place the corresponding shape.

How to check it:
Diagram EAID_2AB8FEF0_2003_4130_B641_C72FC484A137 - "AutoCAD LT - Service interaction Diagram" contains 11 elements (check line 6344 of "TextExport.xml" file, count the number of "element" child tags inside the "elements" tag - line 6353). You'll notice 2 things:
1. All those 11 "element" tags include a "geometry" attribute, which gives us the coordinates and dimensions of the corresponding shape in the canvas/diagram,
2. None of this 11 "element" tags has the id "EAID_40970527_9C02_479c_B334_815B36027BB6" - the one from the linked external package ""AutoCAD Layout Design"
3. 