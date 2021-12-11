import "./style.css";
import { create, zoomIdentity, easeLinear } from "d3";
import { geoMercator, geoPath, geoCentroid } from "d3-geo";
import { json } from "d3-fetch";
const jsonUrl = new URL("./test.json", import.meta.url).href;

const width = 600;
const height = 600;
const initialScale = 1 << 21;

async function render() {
  const featureCollection = await json(jsonUrl);

  const initialCenter = geoCentroid(featureCollection.features[0]);

  const svg = create("svg").attr("viewBox", [0, 0, width, height]);

  const projection = geoMercator()
    .scale(1 / (2 * Math.PI))
    .translate([0, 0]);

  const render = geoPath(projection);

  const transform = zoomIdentity
    .translate(width / 2, height / 2)
    .scale(-initialScale)
    .translate(...projection(initialCenter))
    .scale(-1);

  projection
    .scale(transform.k / (2 * Math.PI))
    .translate([transform.x, transform.y]);


  const path = svg
    .selectAll("path")
    .data(featureCollection.features, (feature) => feature)
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("pointer-events", "none")
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("d", (feature) => render(feature))
          .each(function (d) {
            d.properties.totalLength = this.getTotalLength();
          }),
      (update) => update,
      (exit) => exit.remove()
    );

  function repeat() {
    path
      .attr(
        "stroke-dasharray",
        (feature) =>
          `${feature.properties.totalLength} ${feature.properties.totalLength}`
      )
      .attr("stroke-dashoffset", (feature) => feature.properties.totalLength)
      .transition()
      .duration(10000)
      .ease(easeLinear)
      .attr("stroke-dashoffset", 0)
      .on("end", repeat);
  }
  repeat();

  document.body.appendChild(svg.node());
}

render().catch(console.error);
