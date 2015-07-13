---
layout: page
title: About
---

**Maker.js** is an open source project created by the [Microsoft Garage](http://microsoft.com/garage) and [hosted on Github](https://github.com/Microsoft/maker.js).

Maker.js creates line drawings for two dimensional maker machines, like laser cutters and CNC routers. Using the Maker.js JavaScript library, which can run in a [Node.js](https://nodejs.org/) environment or in a web browser, a developer may create a small program that creates a line drawing. The developer's program may accept parameters which can be used to alter the drawing. The program can be shared and re-used in other drawings. Lastly, the drawing can be exported to a file which can be used directly by a maker machine, uploaded to a maker service, or imported into other 2D or 3D CAD software.

**Features**

* Export formats: DXF / SVG
* Uses plain old JavaScript objects (POJO's) for its drawing model
* Import and modify other drawings
* Conversion between unit systems: Millimeter / Centimeter / Meter / Inch / Foot / Unitless
* Primitive paths: Line / Circle / Arc
* Transformations: Mirror / Rotate / Scale
* Functions: Compute intersection / Triangle solvers
* Basic models:
  * Bolt circle
  * Bolt rectangle
  * Connect the dots
  * Oval
  * Oval Arc
  * Polygon
  * Rectangle
  * Rounded rectangle
  * S curve
  * Square

**Community**

Share your drawings on [NPM](https://www.npmjs.com/search?q=makerjs).

File issues or bugs in the [Github repo](https://github.com/Microsoft/maker.js/issues).

Help or questions on [StackOverflow](http://stackoverflow.com/questions/tagged/makerjs).

Discussion on [Gitter](https://gitter.im/Microsoft/maker.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Project info**

Maker.js was inspired by [OpenSCAD](http://www.openscad.org/). Concept and inital version written by [Dan Marshall](https://github.com/danmarshall) using [TypeScript](http://www.typescriptlang.org/).

Maker.js logo created by [Greg Melander](http://gregmelander.com/).
