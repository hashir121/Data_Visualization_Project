"use strict";

////////converting the dates to string
var parseDate = d3.timeParse("%d/%m/%Y");

loadDataBargraph();

/////////////////////loading for bar graph Visualization
function loadDataBargraph() {
  var vardates = [];
  var varyears = [];

  d3.csv("birdstrikes.csv").then((csvdata) => {
    var copydata = csvdata;
    const datanest = d3
      .nest()
      .key(function (d) {
        const [day, month, year] = d["Flight Date"].split("/").slice();

        //  console.log(year, month, day);
        const date = new Date(year, month, 0);
        return date;
      })
      .sortKeys(d3.ascending)
      .rollup(function (leaves) {
        return {
          sum: d3.sum(leaves, (d) => {
            return 1;
          }),
        };
      })
      .entries(csvdata);

    console.log(datanest);
    // /////////////////////extracting dates
    // var count = 0;
    // //////////extracting dates
    // copydata.forEach(function (d) {
    //   vardates[count] = d["Flight Date"];
    //   // vardates[count] = parseDate(vardates[count]);
    //   // varyears[count] = new Date(vardates[count]);
    //   // varyears[count] = varyears[count].getFullYear();
    //   count++;
    // });

    // //    console.log(vardates);
    // //  console.log(varyears);

    // ///////////extracting count
    // const yearcount = {};

    // for (const element of vardates) {
    //   if (yearcount[element]) {
    //     yearcount[element] += 1;
    //   } else {
    //     yearcount[element] = 1;
    //   }
    // }

    // console.log(yearcount);

    // //////////creating an list of object that the bar graph requires
    // var listcount = { Year: 0, StrikesNo: 0 };

    // listcount.Year = yearcount.Keys;
    // listcount.StrikesNo = yearcount.Value;

    // let finaldata = [];

    // for (let key in yearcount) {
    //   // listcount["Year"].push(key);
    //   // listcount["StrikesNo"].push(yearcount[key]);
    //   // console.log(key);
    //   let listobject = {};
    //   listobject["Year"] = key;
    //   listobject["StrikeNo"] = yearcount[key];
    //   finaldata.push(listobject);
    // }
    // //    console.log("FInal data");
    // console.log(finaldata);

    // // set the dimensions and margins of the graph
    var margin = { top: 50, right: 30, bottom: 70, left: 70 },
      width = 700 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    // ////////////////visualizing in column 1 of the html page
    // // append the svg object to the body of the page
    var svg = d3
      .select("#column1")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg
      .append("text")
      .html("Frequency of Strikes")
      .attr("transform", "translate(-50,250)rotate(-90)");
    svg
      .append("text")
      .html("Years")
      .attr("transform", "translate(200,430)rotate(360)");
    let tooltip1 = svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 50);

    var x = d3
      .scaleTime()
      .range([0, width])
      .domain([new Date(1990, 0, 0), new Date(2003, 0, 0)]);
    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
    // .selectAll("text")
    // .attr("transform", "translate(-10,0)rotate(-45)")
    // .style("text-anchor", "end");
    var xScale = x;
    var xAxis = svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
    // Add Y axis
    var y = d3.scaleLinear().domain([0, 200]).range([height, 0]);
    svg.append("g").call(d3.axisLeft(y));

    // Add a clipPath: everything out of this area won't be drawn.
    var clip = svg
      .append("defs")
      .append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("width", width)
      .attr("height", height)
      .attr("x", 0)
      .attr("y", 0);

    var brush = d3
      .brushX() // Add the brush feature using the d3.brush function
      .extent([
        [0, 0],
        [width, height],
      ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
      .on("end", updateChart); // Each time the brush selection changes, trigger the 'updateChart' function

    // Create the scatter variable: where both the circles and the brush take place
    var scatter = svg.append("g").attr("clip-path", "url(#clip)");

    // Bars
    scatter
      .selectAll("mybar")
      .data(datanest)
      .enter()
      .append("rect")
      .classed("brushrect", true)
      .attr("x", function (d) {
        return x(new Date(d.key));
      })
      .attr("width", 5)
      .on("mouseover", function (e, d) {
        //console.log(this);
        tooltip1.text("Strike No: " + d.value.sum);
        //  console.log(d.StrikeNo);
        d3.select(this).attr("class", "highlight");
      })
      .on("mouseout", function (e, d) {
        tooltip1.text("");
        d3.select(this).attr("class", "highlightback");
      })
      .attr("fill", "lightblue")
      // no bar at the beginning thus:
      .attr("height", function (d) {
        return height - y(0);
      }) // always equal to 0
      .attr("y", function (d) {
        return y(0);
      })
      .attr("y", function (d) {
        return y(d.value.sum);
      })
      .attr("height", function (d) {
        return height - y(d.value.sum);
      });

    // Add the brushing
    scatter.append("g").attr("class", "brush").call(brush);

    var idleTimeout;
    function idled() {
      idleTimeout = null;
    }
    function updateChart(e) {
      let extent = e.selection;

      // If no selection, back to initial coordinate. Otherwise, update X axis domain
      if (!extent) {
        if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350)); // This allows to wait a little bit
        x.domain([new Date(1990, 0, 0), new Date(2003, 0, 0)]);
      } else {
        x.domain([x.invert(extent[0]), x.invert(extent[1])]);
        scatter.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
      }

      // Update axis and circle position
      xAxis.transition().duration(1000).call(d3.axisBottom(x));
      scatter
        .selectAll(".brushrect")
        .transition()
        .duration(1000)
        .attr("x", function (d) {
          return x(new Date(d.key));
        })
        .attr("y", function (d) {
          return y(d.value.sum);
        })
        .attr("height", function (d) {
          return height - y(d.value.sum);
        })
        .attr("width", 5);
    }

    // // Animation
    // svg
    //   .selectAll("rect")
    //   .transition()
    //   .duration(800)
    //   .attr("y", function (d) {
    //     return y(d.value.sum);
    //   })
    //   .attr("height", function (d) {
    //     return height - y(d.value.sum);
    //   })
    //   .delay(function (d, i) {
    //     // console.log(i);
    //     return i * 1;
    //   });

    ////////if mouse over change color
    function onmouseover(e, d) {
      tooltip1.text("Strike No: " + d.StrikeNo);
      console.log(d.StrikeNo);
      d3.select(this).attr("class", "highlight");
    }

    ////////on mouse out
    function onmouseout(d, i) {
      tooltip1.text("");
      d3.select(this).attr("class", "highlightback");
    }
    // var newdata = [];
    // for (let i = 0; i < 400; i++) {
    //   newdata.push(csvdata[i]);
    // }

    //////////////calling forcedtree layout
    ForcedTreeLayout(csvdata);
    //  ForcedTreeLayoutTime(csvdata);

    CallRadial(csvdata);

    ///////////////////////////////creating cost time graph
    ScatterPlot(csvdata);
    console.log("hello");
  });
}

///////////////////////////creating forced tree layout///////////////////////////////////////////
/////////////////////////////to make hierarchy graph for damage////////////////////////////////////////////
function ForcedTreeLayout(csvdata) {
  // // console.log("Data from above");
  // console.log(csvdata);

  var copydata = csvdata;

  var listobj = copydata.map((d) => {
    return {
      state: d["Origin State"],
      airport: d["Airport Name"],
      effect: d["Effect Amount of damage"],
    };
  });

  // console.log("list obj");
  // console.log(listobj);
  const grouped = d3.rollup(
    listobj,
    (v) => v.length,
    (d) => d.state,
    (d) => d.airport,
    (d) => d.effect
  );

  var svg = d3
    .select("#column2")
    .enter()
    .append("circle")
    .style("stroke", "gray")
    .style("fill", "black")
    .attr("r", 20)
    .attr("cx", 500)
    .attr("cy", 400);

  var root = d3.hierarchy(grouped);

  console.log("root");
  console.log(root);
  chart(root);
}

///////////////////////////creating forced tree layout///////////////////////////////////////////
/////////////////////////////to make hierarchy graph for Timeof day////////////////////////////////////////////
function ForcedTreeLayoutTime(csvdata) {
  // // console.log("Data from above");
  // console.log(csvdata);

  var copydata = csvdata;

  var listobj = copydata.map((d) => {
    return {
      state: d["Origin State"],
      airport: d["Airport Name"],
      time: d["Time of day"],
    };
  });

  // console.log("list obj");
  // console.log(listobj);
  const grouped = d3.rollup(
    listobj,
    (v) => v.length,
    (d) => d.state,
    (d) => d.airport,
    (d) => d.time
  );

  // console.log("Grouped");
  // console.log( grouped);
  // const root = d3.hierarchy(grouped);

  // console.log("Heirarchy");
  // console.log(root);
  //  chart(root, 500,250)
  // // console.log(grouped)

  // var nodes = d3
  //   .nest()
  //   .key(function (d) {
  //     return d.random;
  //   })
  //   .key(function (d) {
  //     return d.state;
  //   })
  //   .key(function (d) {
  //     return d.airport;
  //   })
  //   .entries(listobj);
  var svg = d3
    .select("#column2")
    .enter()
    .append("circle")
    .style("stroke", "gray")
    .style("fill", "black")
    .attr("r", 20)
    .attr("cx", 500)
    .attr("cy", 400);
  //Legends
  svg
    .append("circle")
    .attr("cx", 100)
    .attr("cy", 0)
    .attr("r", 4)
    .style("fill", "#003f5c");
  // .on('click', root);

  svg
    .append("circle")
    .attr("cx", 100)
    .attr("cy", 10)
    .attr("r", 4)
    .style("fill", "#58508d");
  // .on('click', state);

  svg
    .append("circle")
    .attr("cx", 100)
    .attr("cy", 20)
    .attr("r", 4)
    .style("fill", "#bc5090");
  // .on('click', airportname);

  svg
    .append("circle")
    .attr("cx", 100)
    .attr("cy", 30)
    .attr("r", 4)
    .style("fill", "#ff6361");
  // .on('click', damage);

  svg
    .append("text")
    .attr("x", 30)
    .attr("y", 0)
    .text("Root")
    .style("font-size", "10px")
    .attr("alignment-baseline", "middle");
  svg
    .append("text")
    .attr("x", 30)
    .attr("y", 10)
    .text("States")
    .style("font-size", "10px")
    .attr("alignment-baseline", "middle");
  svg
    .append("text")
    .attr("x", 30)
    .attr("y", 20)
    .text("Airport Name")
    .style("font-size", "10px")
    .attr("alignment-baseline", "middle");
  svg
    .append("text")
    .attr("x", 30)
    .attr("y", 30)
    .text("Damage Dealt")
    .style("font-size", "10px")
    .attr("alignment-baseline", "middle");

  ///Legends
  var root = d3.hierarchy(grouped);

  console.log("root");
  console.log(root);
  chart2(root);
}

const drag = (simulation) => {
  //console.log(event);
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3
    .drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
};

////////////////////////
function nospace(data) {
  //console.log(data);
  if (data) {
    return data.replace(/\s/g, "");
  } else {
    return null;
  }
}

//////////////////creating layout
function chart(data) {
  let listselected = [];
  // // var root = d3.hierarchy(data);
  // console.log("root: " + data);
  const links = data.links();
  const nodes = data.descendants();
  // const colorScale = d3
  //   .scaleLinear()
  //   .domain(["Night", "Day", "Dusk", "Dawn"])
  //   .range(["red", "green"]);
  const sizeScale = d3.scaleLinear().domain([0, 2000]).range([5, 40]);
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(0)
        .strength(1)
    )
    .force("charge", d3.forceManyBody().strength(-50))
    .force("x", d3.forceX())
    .force("y", d3.forceY());

  // set the dimensions and margins of the graph
  var margin = { top: 250, right: 10, bottom: 17, left: 350 },
    width = 800 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3
    .select("#column2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .call(
      d3.zoom().on("zoom", function (e) {
        svg.attr("transform", e.transform);
      })
    )
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  //Legends
  svg
    .append("circle")
    .attr("cx", 320)
    .attr("cy", -232)
    .attr("r", 4)
    .style("fill", "black");
  // .on('click', root);

  svg
    .append("circle")
    .attr("cx", 320)
    .attr("cy", -221)
    .attr("r", 4)
    .style("fill", "navy");
  // .on('click', state);

  svg
    .append("circle")
    .attr("cx", 320)
    .attr("cy", -210)
    .attr("r", 4)
    .style("fill", "blue");
  // .on('click', airportname);

  svg
    .append("circle")
    .attr("cx", 320)
    .attr("cy", -200)
    .attr("r", 4)
    .style("fill", "lightblue");
  // .on('click', damage);

  svg
    .append("text")
    .attr("x", 330)
    .attr("y", -230)
    .text("Root")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");
  svg
    .append("text")
    .attr("x", 330)
    .attr("y", -220)
    .text("States")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");
  svg
    .append("text")
    .attr("x", 330)
    .attr("y", -210)
    .text("Airport Name")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");
  svg
    .append("text")
    .attr("x", 330)
    .attr("y", -200)
    .text("Damage Dealt")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");

  ///Legends
  const link = svg
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .enter()
    .append("line");

  const node = svg
    .append("g")
    .attr("fill", "#darkblue")
    .attr("stroke", "#darkblue")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", function (d) {
      if (d.data[0]) return "node " + nospace(d.data[0]);
      return null;
    })

    //    .attr("fill", (d) => (d.children ? null : "lightblue"))
    .attr("fill", function (d) {
      if (d.depth == 1) {
        return "navy";
      } else if (d.depth == 2) {
        return "blue";
      } else if (d.depth == 3) {
        return "lightblue";
      }
    })
    .on("mouseover", function (e, d) {
      console.log(node);
      d3.selectAll(".node").style("opacity", 0.1);
      d3.selectAll("." + nospace(d.data[0])).style("opacity", 1);
      listselected.push(d.data[0]);

      //  highlightselected(listselected);

      //d3.selectAll("." + nospace(d.data[0])).style("r", 10);
    })
    .on("mouseleave", function (e, d) {
      d3.selectAll(".node").style("opacity", 1);
    })
    // .attr("stroke", (d) => (d.children ? null : "lightblue"))
    .attr("r", (d) => (d.children ? 3 : sizeScale(d.data[1])))
    .call(drag(simulation));
  document.onclick = function (event) {
    d3.selectAll(".node").style("opacity", 1);
  };
  // console.log(node);
  //console.log("Hellop");
  node.append("title").text((d) => {
    if (!d.children) return `${d.data[0]}, strikes ${d.data[1]}`;
    else return `${d.data[0]}`;
  });

  // .on("mouseout", function (d) {});

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });

  // invalidation.then(() => simulation.stop());
  console.log("Hello world");
  return svg.node();
}

//////////////////creating layout for time
function chart2(data) {
  // // var root = d3.hierarchy(data);
  // console.log("root: " + data);
  const links = data.links();
  const nodes = data.descendants();
  // const colorScale = d3
  //   .scaleLinear()
  //   .domain(["Night", "Day", "Dusk", "Dawn"])
  //   .range(["red", "green"]);
  const sizeScale = d3.scaleLinear().domain([0, 2000]).range([5, 40]);
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(0)
        .strength(1)
    )
    .force("charge", d3.forceManyBody().strength(-50))
    .force("x", d3.forceX())
    .force("y", d3.forceY());

  // set the dimensions and margins of the graph
  var margin = { top: 250, right: 10, bottom: 17, left: 350 },
    width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3
    .select("#column5")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const link = svg
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .enter()
    .append("line");

  const node = svg
    .append("g")
    .attr("fill", "#darkblue")
    .attr("stroke", "#darkblue")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("fill", function (d) {
      if (d.depth == 1) {
        return "navy";
      } else if (d.depth == 2) {
        return "blue";
      } else if (d.depth == 3) {
        return "lightblue";
      }
    })
    .attr("stroke", (d) => (d.children ? null : "lightblue"))
    .attr("r", (d) => (d.children ? 3 : sizeScale(d.data[1])))
    .call(drag(simulation));

  node.append("title").text((d) => {
    if (!d.children) return `${d.data[0]}, strikes ${d.data[1]}`;
    else return `${d.data[0]}`;
  });

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });

  // invalidation.then(() => simulation.stop());

  return svg.node();
}

function CallRadial(data) {
  var copydata = data;
  var listobj = copydata.map((d) => {
    return {
      state: d["Origin State"],
      airport: d["Airport Name"],
      aircraft: d["Aircraft Make Model"],
      cost: d["Cost Total $"],
    };
  });

  // console.log("list obj");
  // console.log(listobj);
  const grouped = d3.rollup(
    listobj,
    (v) => v.length,
    (d) => d.state,
    (d) => d.airport,
    (d) => d.aircraft,
    (d) => d.cost
  );
  let root = d3.hierarchy(grouped);

  let createRadialTree = function (input) {
    let height = 500;
    let width = 900;

    let svg = d3
      .select("#column3")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(
        d3.zoom().on("zoom", function (e) {
          svg.attr("transform", e.transform);
        })
      )
      .append("g");
    //Legends
    svg
      .append("circle")
      .attr("cx", 35)
      .attr("cy", 30)
      .attr("r", 4)
      .style("fill", "black");
    // .on('click', root);

    svg
      .append("circle")
      .attr("cx", 35)
      .attr("cy", 40)
      .attr("r", 4)
      .style("fill", "#92DCE5");
    // .on('click', state);

    svg
      .append("circle")
      .attr("cx", 35)
      .attr("cy", 50)
      .attr("r", 4)
      .style("fill", "#077187");
    // .on('click', airportname);

    svg
      .append("circle")
      .attr("cx", 35)
      .attr("cy", 60)
      .attr("r", 4)
      .style("fill", "#360568");
    // .on('click', damage);

    svg
      .append("circle")
      .attr("cx", 35)
      .attr("cy", 70)
      .attr("r", 4)
      .style("fill", "#BF9ACA");
    // .on('click', damage);

    svg
      .append("text")
      .attr("x", 40)
      .attr("y", 30)
      .text("Root")
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle")
      .attr("position", "fixed");
    svg
      .append("text")
      .attr("x", 40)
      .attr("y", 40)
      .text("States")
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
    svg
      .append("text")
      .attr("x", 40)
      .attr("y", 50)
      .text("Airport Name")
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
    svg
      .append("text")
      .attr("x", 40)
      .attr("y", 60)
      .text("Aircraft Model")
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
    svg
      .append("text")
      .attr("x", 40)
      .attr("y", 70)
      .text("Total Cost")
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");

    ///Legends
    let diameter = height * 0.75;
    let radius = diameter / 2;

    let tree = d3
      .tree()
      .size([2 * Math.PI, radius])
      .separation(function (a, b) {
        return (a.parent == b.parent ? 1 : 2) / a.depth;
      });

    let data = d3.hierarchy(input);

    let treeData = tree(data);

    let nodes = treeData.descendants();
    console.log(nodes);
    let links = treeData.links();

    console.log(nodes);
    let graphGroup = svg
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    graphGroup
      .selectAll(".link")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr(
        "d",
        d3
          .linkRadial()
          .angle((d) => d.x)
          .radius((d) => d.y)
      );

    let node = graphGroup
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return `rotate(${(d.x * 180) / Math.PI - 90})` + `translate(${d.y}, 0)`;
      })
      .append("circle")
      .attr("class", function (d) {
        if (d.data[0]) return "node " + nospace(d.data[0]);
        return null;
      })
      .attr("r", 3)

      .attr("fill", function (d) {
        if (d.depth == 1) {
          return "#92DCE5";
        } else if (d.depth == 2) {
          return "#077187";
        } else if (d.depth == 3) {
          return "#360568";
        } else if (d.depth == 4) {
          return "#BF9ACA";
        }
      });
    ////////////appending names
    node.append("title").text((d) => {
      if (!d.children) return `${d.data.data[0]}`;
      else {
        return `${d.data.data[0]}`;
      }
    });
  };

  ///////////calling create node
  createRadialTree(root);
}

////////////////////////////Creating dot/line plot for timeline////////////////////
///////////////////////////To make scatter plot///////////////////////////////////** */
function ScatterPlot(csvdata) {
  var copydata = csvdata;
  const nestedData = d3
    .nest()
    .key(function (d) {
      const [day, month, year] = d["Flight Date"].split("/").slice();
      // here map by any date
      const date = new Date(year, month, 0);
      // console.log(date);
      return date;
    })
    .sortKeys(d3.ascending)
    .rollup(function (leaves) {
      return {
        costs: d3.group(leaves, (d) => {
          return d["Cost Total $"];
        }),
      };
    })
    .entries(copydata);

  console.log(nestedData);
  let dataGrouped = [];
  nestedData.forEach((d) => {
    Array.from(d.value.costs, ([key, values]) => {
      dataGrouped.push({
        date: d.key,
        cost: key,
      });
    });
  });
  dataGrouped = dataGrouped.filter((d) => d.cost != "0");
  let sortedAsc = dataGrouped.sort(function (a, b) {
    return new Date(a.date) - new Date(b.date);
  });
  console.log(sortedAsc);

  var margin = { top: 50, right: 30, bottom: 70, left: 90 },
    width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3
    .select("#column4")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg
    .append("text")
    .html("Cost")
    .attr("transform", "translate(-70,250)rotate(-90)");
  svg
    .append("text")
    .html("Years")
    .attr("transform", "translate(270,430)rotate(360)");
  let tooltip1 = svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 50);

  var x = d3
    .scaleTime()
    .range([0, width])
    .domain([new Date(1990, 0, 0), new Date(2003, 0, 0)]);
  // .domain(d3.extent(csvdata,function(d){return d.key}));
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
  // .selectAll("text")
  // //   .attr("transform", "translate(-10,0)rotate(-45)")
  // .style("text-anchor", "end");
  var xScale = x;
  var xAxis = svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
  // const dataCosts = Array.from(nestedData.values());
  //  console.log(dataCosts);
  // Add Y axis
  var y = d3.scaleLinear().domain([0, 8000000]).range([height, 0]);
  svg.append("g").call(d3.axisLeft(y));

  // Add a clipPath: everything out of this area won't be drawn.
  var clip = svg
    .append("defs")
    .append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0);

  var brush = d3
    .brushX() // Add the brush feature using the d3.brush function
    .extent([
      [0, 0],
      [width, height],
    ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
    .on("end", updateChart); // Each time the brush selection changes, trigger the 'updateChart' function

  // Create the scatter variable: where both the circles and the brush take place
  var scatter = svg.append("g").attr("clip-path", "url(#clip)");

  // Add the line
  scatter
    .append("path")
    .datum(sortedAsc)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .classed("brushline", true)
    .attr(
      "d",
      d3
        .line(sortedAsc)
        .x(function (d) {
          return x(new Date(d.date));
        })
        .y(function (d) {
          return y(d.cost);
        })
    );

  scatter.append("g").attr("class", "brush").call(brush);

  var idleTimeout;
  function idled() {
    idleTimeout = null;
  }
  function updateChart(e) {
    let extent = e.selection;

    // If no selection, back to initial coordinate. Otherwise, update X axis domain
    if (!extent) {
      if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350)); // This allows to wait a little bit
      x.domain([new Date(1990, 0, 0), new Date(2003, 0, 0)]);
    } else {
      x.domain([x.invert(extent[0]), x.invert(extent[1])]);
      scatter.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
    }

    // Update axis and circle position
    xAxis.transition().duration(1000).call(d3.axisBottom(x));
    scatter
      .selectAll(".brushline")
      .transition()
      .duration(1000)
      .attr(
        "d",
        d3
          .line(sortedAsc)
          .x(function (d) {
            return x(new Date(d.date));
          })
          .y(function (d) {
            return y(d.cost);
          })
      );
  }
}
