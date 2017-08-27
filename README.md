# Maker.js

Your compass and straightedge, in JavaScript.

Create line drawings using familiar constructs from geometry and drafting. Initially designated for CNC and laser cutters, Maker.js can also help you programmatically draw shapes for any purpose. It runs in both Node.js and web browsers.

2D Export formats: 
[DXF](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.exporter.html#todxf), 
[SVG](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.exporter.html#tosvg),
[PDF](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.exporter.html#topdf) (Requires [PDFKit](https://pdfkit.org/))

3D Export formats: 
[OpenJsCad script](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.exporter.html#toopenjscad), 
[STL](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.exporter.html#tostl) (Requires [OpenJsCad](http://joostn.github.io/OpenJsCad/) or [openjscad-csg](https://www.npmjs.com/package/openjscad-csg))

[Demos](http://microsoft.github.io/maker.js/demos/) - [Documentation](http://microsoft.github.io/maker.js/docs/)

![Sample animation](http://microsoft.github.io/maker.js/images/anim-wheel.gif)

## Core concepts

* [paths](http://microsoft.github.io/maker.js/docs/basic-drawing/#Paths) - The primitive elements of a drawing are lines, arcs, and circles.
* [models](http://microsoft.github.io/maker.js/docs/basic-drawing/#Models) - Groups of paths to compose a shape.
* [layers](http://microsoft.github.io/maker.js/docs/advanced-drawing/#Layers) - Organization of models, such as by color or tool type.
* [chains](http://microsoft.github.io/maker.js/docs/working-with-chains/#content) - A series of lines and arcs that connect end-to-end continuously.

Learn more in [the tutorial](http://microsoft.github.io/maker.js/docs/basic-drawing/) or [API documentation](http://microsoft.github.io/maker.js/docs/api/).

## Features

* Drawings are a [simple JavaScript object](http://microsoft.github.io/maker.js/docs/basic-drawing/#It%27s%20Just%20JSON) which can be serialized / deserialized conventionally with JSON. This also makes a drawing easy to [clone](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Cloning).

* Other people's Models can be required the Node.js way, [modified](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Modifying%20models), and re-exported.

* Models can be [scaled](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Scaling), [measured](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.measure.html#modelextents), and [converted to different unit systems](http://microsoft.github.io/maker.js/docs/basic-drawing/#Units).

* Paths can be [distorted](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.path.html#distort).

* Models can be [rotated](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Rotating) or [mirrored](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Mirroring).

* Find [intersection points or intersection angles](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Intersection) of paths.

* [Traverse a model tree](http://microsoft.github.io/maker.js/docs/model-trees/#content) to reason over its children.

* Detect [chains](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.model.html#findchains) formed by paths connecting end to end.

* Get the [points along a path](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.path.html#topoints) or along a [chain of paths](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.chain.html#topoints).

* Easily add a curvature at the joint between any 2 paths, using a [traditional or a dogbone fillet](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Fillets).

* [Combine models](http://microsoft.github.io/maker.js/docs/advanced-drawing/#Combining%20with%20Boolean%20operations) with boolean operations to get unions, intersections, or punches.

* [Expand paths](http://microsoft.github.io/maker.js/docs/advanced-drawing/#Expanding%20paths) to simulate a stroke thickness, with the option to bevel joints.

* [Outline model](http://microsoft.github.io/maker.js/docs/advanced-drawing/#Outlining%20a%20model) to create a surrounding outline, with the option to bevel joints.

* Layout clones into [rows](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.layout.html#clonetorow), [columns](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.layout.html#clonetocolumn), [grids](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.layout.html#clonetogrid), [bricks](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.layout.html#clonetobrick), or [honeycombs](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.layout.html#clonetohoneycomb)

#### Built-in models

* [Belt](http://microsoft.github.io/maker.js/playground/?script=Belt)
* [Bezier Curve](http://microsoft.github.io/maker.js/playground/?script=BezierCurve)
* [Bolt Circle](http://microsoft.github.io/maker.js/playground/?script=BoltCircle)
* [Bolt Rectangle](http://microsoft.github.io/maker.js/playground/?script=BoltRectangle)
* [Connect the dots](http://microsoft.github.io/maker.js/playground/?script=ConnectTheDots)
* [Dogbone](http://microsoft.github.io/maker.js/playground/?script=Dogbone)
* [Dome](http://microsoft.github.io/maker.js/playground/?script=Dome)
* [Ellipse](http://microsoft.github.io/maker.js/playground/?script=Ellipse)
* [Elliptic Arc](http://microsoft.github.io/maker.js/playground/?script=EllipticArc)
* [Holes](http://microsoft.github.io/maker.js/playground/?script=Holes)
* [Oval](http://microsoft.github.io/maker.js/playground/?script=Oval)
* [OvalArc](http://microsoft.github.io/maker.js/playground/?script=OvalArc)
* [Polygon](http://microsoft.github.io/maker.js/playground/?script=Polygon)
* [Rectangle](http://microsoft.github.io/maker.js/playground/?script=Rectangle)
* [Ring](http://microsoft.github.io/maker.js/playground/?script=Ring)
* [RoundRectangle](http://microsoft.github.io/maker.js/playground/?script=RoundRectangle)
* [S curve](http://microsoft.github.io/maker.js/playground/?script=SCurve)
* [Slot](http://microsoft.github.io/maker.js/playground/?script=Slot)
* [Square](http://microsoft.github.io/maker.js/playground/?script=Square)
* [Star](http://microsoft.github.io/maker.js/playground/?script=Star)
* [Text](http://microsoft.github.io/maker.js/playground/?script=Text)

#### Import formats

* [Fonts](http://microsoft.github.io/maker.js/playground/?script=Text) (Requires [opentype.js](http://opentype.js.org/))
* [SVG Path Data](http://microsoft.github.io/maker.js/docs/importing/#SVG+path+data)
* [SVG Points](http://microsoft.github.io/maker.js/docs/importing/#SVG+points)

## Getting Started

### Try it now

Visit the [Maker.js Playground](http://microsoft.github.io/maker.js/playground/) a sample app to edit and run JavaScript from your browser.

Each of the [demos](http://microsoft.github.io/maker.js/demos/#content) will also open in the playground so that you can explore and modify their code.

### To use in a web browser

Download the browser-based version of Maker.js, then upload it to your website:
[http://microsoft.github.io/maker.js/target/js/browser.maker.js](http://microsoft.github.io/maker.js/target/js/browser.maker.js)

Add a script tag in your HTML:
```html
<script src="http://microsoft.github.io/maker.js/target/js/browser.maker.js" type="text/javascript"></script>
```

*Note: You may also need [additional libraries](http://microsoft.github.io/maker.js/docs/getting-started/#For+the+browser)*

In your JavaScript, use the require function to get a reference:
 
```javascript
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
* Create a demo for the [gallery](http://microsoft.github.io/maker.js/demos/#content).
* Create lessons or videos for the [documentation](http://microsoft.github.io/maker.js/docs/#content).
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
