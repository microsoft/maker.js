# Maker.js

Maker.js, a Microsoft Garage project, is a JavaScript library for creating line drawings for CNC and laser cutters. It runs in both Node.js and web browsers.

[Demos](http://microsoft.github.io/maker.js/demos/) - [Documentation](http://microsoft.github.io/maker.js/docs/)

## Features

### Drawing with JavaScript code

Draw using three primitive paths: [Line, Circle, and Arc](http://microsoft.github.io/maker.js/docs/basic-drawing/#Paths).

Paths can be [grouped into Models](http://microsoft.github.io/maker.js/docs/basic-drawing/#Models) to form more complex drawings.

Behind the scenes, drawings are a [simple Javascript object](http://microsoft.github.io/maker.js/docs/basic-drawing/#It%27s%20Just%20JSON) which can be serialized / deserialized conventionally with JSON.

Other people's Models can be required the Node.js way, [modified](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Modifying%20models), and re-exported.

Models can be [scaled](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Scaling), [measured](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.measure.html#modelextents), and [converted to different unit systems](http://microsoft.github.io/maker.js/docs/basic-drawing/#Units).

Models can be [rotated](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Rotating) or [mirrored](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Mirroring).

Find [intersection points or intersection angles](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.path.html#intersection) of paths.

Easily add a curvature at the joint between any 2 paths, using a [traditional fillet](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.path.html#fillet) or a [dogbone fillet](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.path.html#dogbone).

[Combine models](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.model.html#combine) with boolean operations to get unions, intersections, or punches.

Detect [chains](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.model.html#findchains) or [loops](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.model.html#findloops) formed by paths connecting end to end.

[Expand paths](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.model.html#expandpaths) to simulate a stroke thickness, with the option to bevel joints.

[Outline model](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.model.html#outline) to create a surrounding outline, with the option to bevel joints.

### Output formats

2D: [DXF](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.exporter.html#todxf), [SVG](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.exporter.html#tosvg),
NEW: [PDF](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.exporter.html#topdf)

3D: [OpenJsCad script](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.exporter.html#toopenjscad), [STL](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.exporter.html#tostl) (Must include [OpenJsCad](http://joostn.github.io/OpenJsCad/) or [openjscad-csg](https://www.npmjs.com/package/openjscad-csg))

### Built-in models

* [Bolt Circle](http://microsoft.github.io/maker.js/playground/?script=BoltCircle)
* [Bolt Rectangle](http://microsoft.github.io/maker.js/playground/?script=BoltRectangle)
* [Connect the dots](http://microsoft.github.io/maker.js/playground/?script=ConnectTheDots)
* [Dome](http://microsoft.github.io/maker.js/playground/?script=Dome)
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

### Draw!
Learn how to draw in Maker.js by folowing [the tutorial](http://microsoft.github.io/maker.js/docs/basic-drawing/)

### API
Browse all the library features in the [API Documentation](http://microsoft.github.io/maker.js/docs/api/)

---

**[Contribute to this project!](CONTRIBUTING.md)**

The Microsoft Garage turns fresh ideas into real projects. Learn more at [http://microsoft.com/garage](http://microsoft.com/garage).
