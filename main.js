import './style.css';
import { create, zoom as d3Zoom, zoomIdentity } from 'd3';
import { geoMercator, geoPath } from 'd3-geo';
import { json } from 'd3-fetch';
import { tile as d3Tile } from 'd3-tile';
const jsonUrl = new URL('./test.json', import.meta.url).href;

const url = (x, y, z) => `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/${z}/${x}/${y}${devicePixelRatio > 1 ? "@2x" : ""}?access_token=pk.eyJ1IjoibWJvc3RvY2siLCJhIjoiY2s5ZWRlbTM4MDE0eDNocWJ2aXR2amNmeiJ9.LEyjnNDr_BrxRmI4UDyJAQ`;
const width = 600;
const height = 600;
const initialCenter = [-98 - 35 / 60, 39 + 50 / 60];
const initialScale = 1 << 12;
// const topology = await json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
const featureCollection = await json(jsonUrl);

const svg = create("svg")
    .attr("viewBox", [0, 0, width, height]);

const projection = geoMercator()
    .scale(1 / (2 * Math.PI))
    .translate([0, 0]);

const render = geoPath(projection);

const tile = d3Tile()
    .extent([[0, 0], [width, height]])
    .tileSize(512);

const zoom = d3Zoom()
    .scaleExtent([1 << 10, 1 << 15])
    .extent([[0, 0], [width, height]])
    .on("zoom", ({ transform }) => zoomed(transform));

let image = svg.append("g")
    .attr("pointer-events", "none")
    .selectAll("image");

const path = svg.append("path")
    .attr("pointer-events", "none")
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round");

svg
    .call(zoom)
    .call(zoom.transform, zoomIdentity
        .translate(width / 2, height / 2)
        .scale(-initialScale)
        .translate(...projection(initialCenter))
        .scale(-1));

function zoomed(transform) {
    const tiles = tile(transform);

    image = image.data(tiles, d => d).join("image")
        // .attr("xlink:href", d => url(...d))
        .attr("x", ([x]) => (x + tiles.translate[0]) * tiles.scale)
        .attr("y", ([, y]) => (y + tiles.translate[1]) * tiles.scale)
        .attr("width", tiles.scale)
        .attr("height", tiles.scale);

    projection
        .scale(transform.k / (2 * Math.PI))
        .translate([transform.x, transform.y]);

    path.attr("d", render(featureCollection));
}

document.querySelector('#app').appendChild(svg.node());