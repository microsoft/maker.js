# Maker.js

Your compass and straightedge, in JavaScript.

Create line drawings using familiar constructs from geometry and drafting. Initially designated for CNC and laser cutters, Maker.js can also help you programmatically draw shapes for any purpose. It runs in both Node.js and web browsers.

2D Export formats: 
[DXF](http://maker.js.org/docs/api/modules/makerjs.exporter.html#todxf), 
[SVG](http://maker.js.org/docs/api/modules/makerjs.exporter.html#tosvg),
[PDF](http://maker.js.org/docs/api/modules/makerjs.exporter.html#topdf) (Requires [PDFKit](https://pdfkit.org/))

3D Export formats: 
[OpenJsCad script](http://maker.js.org/docs/api/modules/makerjs.exporter.html#toopenjscad), 
[STL](http://maker.js.org/docs/api/modules/makerjs.exporter.html#tostl) (Requires [OpenJsCad](http://joostn.github.io/OpenJsCad/) or [openjscad-csg](https://www.npmjs.com/package/openjscad-csg))

[Demos](http://maker.js.org/demos/) - [Documentation](http://maker.js.org/docs/)

![Sample animation](http://maker.js.org/images/anim-wheel.gif)

## Core concepts

* [paths](http://maker.js.org/docs/basic-drawing/#Paths) - The primitive elements of a drawing are lines, arcs, and circles.
* [models](http://maker.js.org/docs/basic-drawing/#Models) - Groups of paths to compose a shape.
* [layers](http://maker.js.org/docs/advanced-drawing/#Layers) - Organization of models, such as by color or tool type.
* [chains](http://maker.js.org/docs/working-with-chains/#content) - A series of lines and arcs that connect end-to-end continuously.

Learn more in [the tutorial](http://maker.js.org/docs/basic-drawing/) or [API documentation](http://maker.js.org/docs/api/).

## Features

* Drawings are a [simple JavaScript object](http://maker.js.org/docs/basic-drawing/#It%27s%20Just%20JSON) which can be serialized / deserialized conventionally with JSON. This also makes a drawing easy to [clone](http://maker.js.org/docs/intermediate-drawing/#Cloning).

* Other people's Models can be required the Node.js way, [modified](http://maker.js.org/docs/intermediate-drawing/#Modifying%20models), and re-exported.

* Models can be [scaled](http://maker.js.org/docs/intermediate-drawing/#Scaling), [measured](http://maker.js.org/docs/api/modules/makerjs.measure.html#modelextents), and [converted to different unit systems](http://maker.js.org/docs/basic-drawing/#Units).

* Paths can be [distorted](http://maker.js.org/docs/api/modules/makerjs.path.html#distort).

* Models can be [rotated](http://maker.js.org/docs/intermediate-drawing/#Rotating) or [mirrored](http://maker.js.org/docs/intermediate-drawing/#Mirroring).

* Find [intersection points or intersection angles](http://maker.js.org/docs/intermediate-drawing/#Intersection) of paths.

* [Traverse a model tree](http://maker.js.org/docs/model-trees/#content) to reason over its children.

* Detect [chains](http://maker.js.org/docs/api/modules/makerjs.model.html#findchains) formed by paths connecting end to end.

* Get the [points along a path](http://maker.js.org/docs/api/modules/makerjs.path.html#topoints) or along a [chain of paths](http://maker.js.org/docs/api/modules/makerjs.chain.html#topoints).

* Easily add a curvature at the joint between any 2 paths, using a [traditional or a dogbone fillet](http://maker.js.org/docs/intermediate-drawing/#Fillets).

* [Combine models](http://maker.js.org/docs/advanced-drawing/#Combining%20with%20Boolean%20operations) with boolean operations to get unions, intersections, or punches.

* [Expand paths](http://maker.js.org/docs/advanced-drawing/#Expanding%20paths) to simulate a stroke thickness, with the option to bevel joints.

* [Outline model](http://maker.js.org/docs/advanced-drawing/#Outlining%20a%20model) to create a surrounding outline, with the option to bevel joints.

* Layout clones into [rows](http://maker.js.org/docs/api/modules/makerjs.layout.html#clonetorow), [columns](http://maker.js.org/docs/api/modules/makerjs.layout.html#clonetocolumn), [grids](http://maker.js.org/docs/api/modules/makerjs.layout.html#clonetogrid), [bricks](http://maker.js.org/docs/api/modules/makerjs.layout.html#clonetobrick), or [honeycombs](http://maker.js.org/docs/api/modules/makerjs.layout.html#clonetohoneycomb)

#### Built-in models

* [Belt](http://maker.js.org/playground/?script=Belt)
* [Bezier Curve](http://maker.js.org/playground/?script=BezierCurve)
* [Bolt Circle](http://maker.js.org/playground/?script=BoltCircle)
* [Bolt Rectangle](http://maker.js.org/playground/?script=BoltRectangle)
* [Connect the dots](http://maker.js.org/playground/?script=ConnectTheDots)
* [Dogbone](http://maker.js.org/playground/?script=Dogbone)
* [Dome](http://maker.js.org/playground/?script=Dome)
* [Ellipse](http://maker.js.org/playground/?script=Ellipse)
* [Elliptic Arc](http://maker.js.org/playground/?script=EllipticArc)
* [Holes](http://maker.js.org/playground/?script=Holes)
* [Oval](http://maker.js.org/playground/?script=Oval)
* [OvalArc](http://maker.js.org/playground/?script=OvalArc)
* [Polygon](http://maker.js.org/playground/?script=Polygon)
* [Rectangle](http://maker.js.org/playground/?script=Rectangle)
* [Ring](http://maker.js.org/playground/?script=Ring)
* [RoundRectangle](http://maker.js.org/playground/?script=RoundRectangle)
* [S curve](http://maker.js.org/playground/?script=SCurve)
* [Slot](http://maker.js.org/playground/?script=Slot)
* [Square](http://maker.js.org/playground/?script=Square)
* [Star](http://maker.js.org/playground/?script=Star)
* [Text](http://maker.js.org/playground/?script=Text)

#### Import formats

* [Fonts](http://maker.js.org/playground/?script=Text) (Requires [opentype.js](http://opentype.js.org/))
* [SVG Path Data](http://maker.js.org/docs/importing/#SVG+path+data)
* [SVG Points](http://maker.js.org/docs/importing/#SVG+points)

## Getting Started

### Try it now

Visit the [Maker.js Playground](http://maker.js.org/playground/) a sample app to edit and run JavaScript from your browser.

Each of the [demos](http://maker.js.org/demos/#content) will also open in the playground so that you can explore and modify their code.

### To use in a web browser

Download the browser-based version of Maker.js, then upload it to your website:
[http://maker.js.org/target/js/browser.maker.js](http://maker.js.org/target/js/browser.maker.js)

Add a script tag in your HTML:
```html
<script src="http://maker.js.org/target/js/browser.maker.js" type="text/javascript"></script>
```

*Note: You may also need [additional libraries](http://maker.js.org/docs/getting-started/#For+the+browser)*

In your JavaScript, use the require function to get a reference:
 
```javascript
var makerjs = require('makerjs');
```

### To use via CDN

Add a script tag to your HTML:
```
<script src="https://cdn.jsdelivr.net/npm/makerjs@0/target/js/browser.maker.js"></script>
```
To work with Bezier Curves, you will also need a copy of [Bezier.js by Pomax](http://pomax.github.io/bezierjs/)
```
<script src="https://cdn.jsdelivr.net/npm/bezier-js@2/bezier.js"></script>
```
To work with fonts, you will need both Bezier.js(above) and a copy of [Opentype.js by Frederik De Bleser](https://github.com/nodebox/opentype.js)
```
<script src="https://cdn.jsdelivr.net/npm/opentype.js@0/dist/opentype.js"></script>
```

In your JavaScript, use the require function to get a reference:
```
var makerjs = require('makerjs');
```

### To use in Node.js

To depend on Maker.js, run this from the command line:
```bash
npm install makerjs --save
```

In your JavaScript, use the require function to get a reference:
 
```javascript
var makerjs = require('makerjs');
```

## Contributing
There are many ways to contribute to Maker.js:
* [★ Star Maker.js on GitHub](https://github.com/Microsoft/maker.js)
* Submit bugs and feature requests [on GitHub](https://github.com/Microsoft/maker.js/issues).
* Create a demo for the [gallery](http://maker.js.org/demos/#content).
* Create lessons or videos for the [documentation](http://maker.js.org/docs/#content).
* Enhance the [website](https://github.com/Microsoft/maker.js/tree/gh-pages).
* Add features to the [Playground app](https://github.com/Microsoft/maker.js/tree/master/playground).
* Create a new Maker.js app, and we will link to it here.
* Find some TODO's in the [core source code](https://github.com/Microsoft/maker.js/tree/master/src).
* Create unit tests for the core.

Some of these may require a [contributor agreement](https://github.com/Microsoft/maker.js/blob/master/CONTRIBUTING.md).

### Credits
Maker.js depends on:
* [Clone](https://github.com/pvorb/node-clone) by Paul Vorbach
* [Bezier-js](https://github.com/Pomax/bezierjs) by Pomax
* [Graham_scan](https://github.com/brian3kb/graham_scan_js) by Brian Barnett
---

Maker.js is a Microsoft Garage project. The Microsoft Garage turns fresh ideas into real projects. Learn more at [http://microsoft.com/garage](http://microsoft.com/garage).
