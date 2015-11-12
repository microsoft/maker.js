# Maker.js

Maker.js, a Microsoft Garage project, is a JavaScript library for creating line drawings for CNC and laser cutters. Maker.js runs in both Node.js and web browsers.

[Demos](http://microsoft.github.io/maker.js/demos/) - [Documentation](http://microsoft.github.io/maker.js/docs/) - [Discussion](https://gitter.im/Microsoft/maker.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Features

### Drawing with JavaScript code

Draw using three primitive paths: [Line, Circle, and Arc](http://microsoft.github.io/maker.js/docs/basic-drawing/#Paths).

Paths can be [grouped into Models](http://microsoft.github.io/maker.js/docs/basic-drawing/#Models) to form more complex drawings.

Behind the scenes, drawings are a [simple Javascript object](http://microsoft.github.io/maker.js/docs/basic-drawing/#It%27s%20Just%20JSON) which can be serialized / deserialized conventionally with JSON.

Other people's Models can be imported, [modified](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Modifying%20models), and re-exported.

Models can be [scaled](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Scaling), [measured](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.measure.html#modelextents), and [converted to different unit systems](http://microsoft.github.io/maker.js/docs/basic-drawing/#Units).

Models can be [rotated](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Rotating) or [mirrored](http://microsoft.github.io/maker.js/docs/intermediate-drawing/#Mirroring).

Find [intersection points or intersection angles](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.path.html#intersection) of paths.

Easily add a curvature at the joint between any 2 paths, using a [traditional fillet](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.path.html#fillet) or a [dogbone fillet](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.path.html#dogbone).

[Combine models](http://microsoft.github.io/maker.js/docs/api/modules/makerjs.model.html#combine) with boolean operations to get unions, intersections, or punches.

Find loops.

### Output formats

2D Export.

3D Export.

### Built-in models

Bolt Circle

Bolt Rectangle

Connect the dots

Dome

Oval

OvalArc

Polygon

Rectangle

Ring

RoundRectangle

S curve

Square

Star

## Getting Started

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

---

**[Contribute to this project!](CONTRIBUTING.md)**

The Microsoft Garage turns fresh ideas into real projects. Learn more at [http://microsoft.com/garage](http://microsoft.com/garage).
