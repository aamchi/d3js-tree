$(window).load(function(){

   var width, height, i, duration, root, margin,
       tree, diagonal, svg, div_tt;

   $('#searchtxt').keypress(function(e) {
           if (e.which == 13){
               $('#searchbtn').click();
           }
   });

   $('#searchbtn').click(function() {
      searchNode();
   });

   $('#fileOption').change(function () {
      console.log("in testMenu fn, option = " + $(this).val());
      createTree($(this).val());
   });

function searchNode() {
   // reset the style
   d3.selectAll("text").style({'fill': 'black' });
   var s = $('#searchtxt').val();
   // create the node
   var node = "text[data-name*='" + s + "']";
   d3.selectAll(node).style({'fill': 'red' });
   return false;
}

// ************** Generate the tree diagram    *****************

function createTree(csvDataFile) {
  
  margin = {top: 20, right: 20, bottom: 20, left: 120},
     width = 1960 - margin.right - margin.left,
     height = 500 - margin.top - margin.bottom;
     
  i = 0,
     duration = 750,
     root;
  
  tree = d3.layout.tree()
     .size([height, width]);
  
  diagonal = d3.svg.diagonal()
     .projection(function(d) { return [d.y, d.x]; });
  
  svg = d3.select("body").append("svg")
     .attr("width", width + margin.right + margin.left)
     .attr("height", height + margin.top + margin.bottom)
    .append("g")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  // setup tooltip div
  div_tt = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  
  // read external data file and load into root
  d3.csv(csvDataFile, function(error, data) {
      // create name based map for nodes
      var dataMap = data.reduce(function(map, node) {
         map[node.key] = node;
         return map;
      }, {});
      // transform map into hierarchichal structure
      var treeData = [];
      data.forEach(function(node) {
         // add to parent
         var parent = dataMap[node.parent];
         if (parent) {
            // create child array if it doesn't exist
            (parent.children || (parent.children = []))
               // add node to child array
               .push(node);
         } else {
            // parent is null or missing
            treeData.push(node);
         }
      });
      // update root structure 
      root = treeData[0];
      root.x0 = height / 2;
      root.y0 = 0;
      update(root);
  });
  
  d3.select(self.frameElement).style("height", "500px");
}

function update(source) {

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
     links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 150; });

  // Update the nodes
  var node = svg.selectAll("g.node")
     .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
     .attr("class", "node")
     .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
     .on("click", click)
     .on("mouseover", function(d) {
        if (d.tooltip) {
           div_tt.transition()
              .duration(200)
              .style("opacity", .9);
           div_tt	.html(d.tooltip)
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
        }
     })
     .on("mouseout", function(d) {
        div_tt.transition()
           .duration(500)
           .style("opacity", 0);
     });

  nodeEnter.append("circle")
     .attr("r", 1e-6)
     .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeEnter.append("a")
     .attr("xlink:href", function(d) { return d.link ? d.link : null; })
     .attr("target", function(d) { return d.link ? "_blank" : null; })
    .append("text")
     .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
     .attr("y", function(d) { return d.children || d._children ? ".85em" : ".35em"; })
     .attr("text-anchor", function(d) { return d.children || d._children ? "end": "start"; })
     .attr("data-name", function(d) { return d.name.toLowerCase(); })
     .text(function(d) { return d.name; })
     .style("fill-opacity", 1e-6);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
     .duration(duration)
     .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ") "; });

  nodeUpdate.select("circle")
     .attr("r", 8)
     .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff" ; });

  nodeUpdate.select("text")
     .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
     .duration(duration)
     .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
     .remove();

  nodeExit.select("circle")
     .attr("r", 1e-6);

  nodeExit.select("text")
     .style("fill-opacity", 1e-6);

  // Update the links
  var link = svg.selectAll("path.link")
     .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
     .attr("class", "link")
     .attr("d", function(d) {
      var o = {x: source.x0, y: source.y0};
      return diagonal({source: o, target: o});
     });

  // Transition links to their new position.
  link.transition()
     .duration(duration)
     .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
     .duration(duration)
     .attr("d", function(d) {
      var o = {x: source.x, y: source.y};
      return diagonal({source: o, target: o});
     })
     .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
   d.x0 = d.x;
   d.y0 = d.y;
  });
}

// Toggle children on click.
function click(d) {
  if (d.children) {
   d._children = d.children;
   d.children = null;
  } else {
   d.children = d._children;
   d._children = null;
  }
  update(d);
}

}); // document.load

