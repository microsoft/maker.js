# Maker.js

Your compass and straightedge, in JavaScript.

Create line drawings using familiar constructs from geometry and drafting. Initially designated for CNC and laser cutters, Maker.js can also help you programmatically draw shapes for any purpose. It runs in both Node.js and web browsers.

2D Export formats: 
[DXF](https://maker.js.org/docs/api/modules/makerjs.exporter.html#todxf), 
[SVG](https://maker.js.org/docs/api/modules/makerjs.exporter.html#tosvg),
[PDF](https://maker.js.org/docs/api/modules/makerjs.exporter.html#topdf),
[Jscad CAG object](https://maker.js.org/docs/api/modules/makerjs.exporter.html#tojscadcag)

3D Export formats:
[Jscad Script](https://maker.js.org/docs/api/modules/makerjs.exporter.html#tojscadscript),
[Jscad CSG object](https://maker.js.org/docs/api/modules/makerjs.exporter.html#tojscadcsg),
[STL](https://maker.js.org/docs/api/modules/makerjs.exporter.html#tojscadstl)

[Demos](https://maker.js.org/demos/) - [Documentation](http://maker.js.org/docs/)

![Sample animation](https://maker.js.org/images/anim-wheel.gif)

## Core concepts

* [paths](https://maker.js.org/docs/basic-drawing/#Paths) - The primitive elements of a drawing are lines, arcs, and circles.
* [models](https://maker.js.org/docs/basic-drawing/#Models) - Groups of paths to compose a shape.
* [layers](https://maker.js.org/docs/advanced-drawing/#Layers) - Organization of models, such as by color or tool type.
* [chains](https://maker.js.org/docs/working-with-chains/#content) - A series of lines and arcs that connect end-to-end continuously.

Learn more in [the tutorial](https://maker.js.org/docs/basic-drawing/) or [API documentation](https://maker.js.org/docs/api/).

## Features

* Drawings are a [simple JavaScript object](https://maker.js.org/docs/basic-drawing/#It%27s%20Just%20JSON) which can be serialized / deserialized conventionally with JSON. This also makes a drawing easy to [clone](https://maker.js.org/docs/intermediate-drawing/#Cloning).

* Other people's Models can be required the Node.js way, [modified](https://maker.js.org/docs/intermediate-drawing/#Modifying%20models), and re-exported.

* Models can be [scaled](https://maker.js.org/docs/intermediate-drawing/#Scaling), [distorted](https://maker.js.org/docs/intermediate-drawing/#Distorting), [measured](https://maker.js.org/docs/api/modules/makerjs.measure.html#modelextents), and [converted to different unit systems](https://maker.js.org/docs/basic-drawing/#Units).

* Paths can be [distorted](https://maker.js.org/docs/api/modules/makerjs.path.html#distort).

* Models can be [rotated](https://maker.js.org/docs/intermediate-drawing/#Rotating) or [mirrored](https://maker.js.org/docs/intermediate-drawing/#Mirroring).

* Find [intersection points or intersection angles](https://maker.js.org/docs/intermediate-drawing/#Intersection) of paths.

* [Traverse a model tree](https://maker.js.org/docs/model-trees/#content) to reason over its children.

* Detect [chains](https://maker.js.org/docs/api/modules/makerjs.model.html#findchains) formed by paths connecting end to end.

* Get the [points along a path](https://maker.js.org/docs/api/modules/makerjs.path.html#topoints) or along a [chain of paths](https://maker.js.org/docs/api/modules/makerjs.chain.html#topoints).

* Easily add a curvature at the joint between any 2 paths, using a [traditional or a dogbone fillet](https://maker.js.org/docs/intermediate-drawing/#Fillets).

* [Combine models](https://maker.js.org/docs/advanced-drawing/#Combining%20with%20Boolean%20operations) with boolean operations to get unions, intersections, or punches.

* [Expand paths](https://maker.js.org/docs/advanced-drawing/#Expanding%20paths) to simulate a stroke thickness, with the option to bevel joints.

* [Outline model](https://maker.js.org/docs/advanced-drawing/#Outlining%20a%20model) to create a surrounding outline, with the option to bevel joints.

* Layout clones into [rows](http://maker.js.org/docs/api/modules/makerjs.layout.html#clonetorow), [columns](https://maker.js.org/docs/api/modules/makerjs.layout.html#clonetocolumn), [grids](https://maker.js.org/docs/api/modules/makerjs.layout.html#clonetogrid), [bricks](https://maker.js.org/docs/api/modules/makerjs.layout.html#clonetobrick), or [honeycombs](https://maker.js.org/docs/api/modules/makerjs.layout.html#clonetohoneycomb)

#### Built-in models

* [Belt](https://maker.js.org/playground/?script=Belt)
* [Bezier Curve](https://maker.js.org/playground/?script=BezierCurve)
* [Bolt Circle](https://maker.js.org/playground/?script=BoltCircle)
* [Bolt Rectangle](https://maker.js.org/playground/?script=BoltRectangle)
* [Connect the dots](https://maker.js.org/playground/?script=ConnectTheDots)
* [Dogbone](https://maker.js.org/playground/?script=Dogbone)
* [Dome](https://maker.js.org/playground/?script=Dome)
* [Ellipse](https://maker.js.org/playground/?script=Ellipse)
* [Elliptic Arc](https://maker.js.org/playground/?script=EllipticArc)
* [Holes](https://maker.js.org/playground/?script=Holes)
* [Oval](https://maker.js.org/playground/?script=Oval)
* [OvalArc](https://maker.js.org/playground/?script=OvalArc)
* [Polygon](https://maker.js.org/playground/?script=Polygon)
* [Rectangle](https://maker.js.org/playground/?script=Rectangle)
* [Ring](https://maker.js.org/playground/?script=Ring)
* [RoundRectangle](https://maker.js.org/playground/?script=RoundRectangle)
* [S curve](https://maker.js.org/playground/?script=SCurve)
* [Slot](https://maker.js.org/playground/?script=Slot)
* [Square](https://maker.js.org/playground/?script=Square)
* [Star](https://maker.js.org/playground/?script=Star)
* [Text](https://maker.js.org/playground/?script=Text)

#### Import formats

* [Fonts](https://maker.js.org/playground/?script=Text) (Requires [opentype.js](https://opentype.js.org/))
* [SVG Path Data](https://maker.js.org/docs/importing/#SVG+path+data)
* [SVG Points](https://maker.js.org/docs/importing/#SVG+points)

## Getting Started

### Try it now

Visit the [Maker.js Playground](https://maker.js.org/playground/) a sample app to edit and run JavaScript from your browser.

Each of the [demos](https://maker.js.org/demos/#content) will also open in the playground so that you can explore and modify their code.

### To use in a web browser

Download the browser-based version of Maker.js, then upload it to your website:
[https://maker.js.org/target/js/browser.maker.js](https://maker.js.org/target/js/browser.maker.js)

Add a script tag in your HTML:
```html
<script src="https://maker.js.org/target/js/browser.maker.js" type="text/javascript"></script>
```

*Note: You may also need [additional libraries](https://maker.js.org/docs/getting-started/#For+the+browser)*

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

In your JavaScript, use the `require` function to get a reference:
```
var makerjs = require('makerjs');
```

### To use in Node.js

To depend on Maker.js, run this from the command line:
```bash
npm install makerjs --save
```

In your JavaScript, use the `require` function to get a reference:
 
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
* Add features to the [Playground app](https://maker.js.org/playground/).
* Create a new Maker.js app, and we will link to it here.
* Find some TODO's in the [core source code](https://github.com/Microsoft/maker.js/tree/master).
* Create unit tests for the core.

Some of these may require a [contributor agreement](https://github.com/Microsoft/maker.js/blob/master/CONTRIBUTING.md).

### Credits
Maker.js depends on:
* [clone](https://github.com/pvorb/node-clone) by Paul Vorbach
* [bezier-js](https://github.com/Pomax/bezierjs) by Pomax
* [graham_scan](https://github.com/brian3kb/graham_scan_js) by Brian Barnett
* [kdbush](https://github.com/mourner/kdbush) by Vladimir Agafonkin
---

Maker.js is a Microsoft Garage project. The Microsoft Garage turns fresh ideas into real projects. Learn more at [http://microsoft.com/garage](http://microsoft.com/garage).
