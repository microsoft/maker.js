# Maker.js
Maker.js, a Microsoft Garage project, is a JavaScript library for creating programmable 2D vector drawings that can be exported to SVG or DXF file formats for CNC and laser cutter machines.

[See a demo](http://microsoft.github.io/maker.js/) - [View the Documentation](https://github.com/Microsoft/Maker.js/wiki)

The Microsoft Garage turns fresh ideas into real projects. Learn more at [http://microsoft.com/garage](http://microsoft.com/garage).

## Uses
Maker.js can be used in a web page as a simple CAD drawing generator. It can be a core engine for a small CAD gui app. It can run in a Node.js environment to create drawings dynamically.

## Features
* Uses plain old JavaScript objects (POJO's) for its drawing model.
* Exports to DXF or SVG format.
* Support for a variety of unit systems:
 * Millimeter / Centimeter / Meter / Inch / Foot
* Primitive paths:
 * Line / Circle / Arc
* Transformations:
 * Mirror / Rotate / Scale
* Basic models:
 * Bolt circle
 * Bolt rectangle
 * Connect the dots
 * Oval
 * Oval Arc
 * Rectangle
 * Rounded rectangle
 * S curve
 * Square

## What it isn't
* A general purpose SVG generator. There are many features in SVG such as color fill and animation that are not applicable to CNC output. Maker.js only uses SVG for rendering simple line contours and interoperability with other applications that import SVG.
* A DXF reader. Although Maker.js can export to DXF, it does not import or view it.
* A full featured CAD system.
* A printer driver or G-code generator.

## About
Maker.js is written in TypeScript and compiled to JavaScript. Maker.js is released under the Apache 2.0 license.

## Contributing
We would love to accept your contributions to Maker.js. Before you consider making any changes, please review the tenets of this project, and the legal policy of Microsoft below.

### Maker.js project tenets
* Accessible - Maker.js wants to run everywhere JavaScript does. The Maker.js API strives toward simplicity and easy understandability to programmers with a wide range of experience. We do not wish to reinvent a new language, we want to leverage JavaScript as a language.
* Compatible - Maker.js is primitive by design, to maintain the maximum compatibility with many types of "Maker" machines which may not have ellipse or Bezier curve ability. Target machines include but are not limited to:
 * Laser cutters
 * Vinyl cutters
 * Water jet cutters
 * CNC routers
 * Plasma cutters
 * 2D engravers
* Reusable - We want to encourage an ecosystem of models and modeling plugins which may create dependencies on each other.
* Interoperable - We want other CAD apps when possible to have easy access of importing from or to our data formats.

### How to contribute
* Submit a CLA (below)
* Fork the repo.
* Check the Wiki for [how to build](https://github.com/Microsoft/Maker.js/wiki/Contributors-Build) and [how to debug](https://github.com/Microsoft/Maker.js/wiki/Contributors-Debug)
* Make sure you can build with no errors.
* WE NEED UNIT TESTS :-)
* Commit changes in your own repo.
* Make a pull request.

### Legal
You will need to complete a Contributor License Agreement (CLA). Briefly, this agreement testifies that you are granting us permission to use the submitted change according to the terms of the project's license, and that the work being submitted is under appropriate copyright.

Please submit a Contributor License Agreement (CLA) before submitting a pull request. You may visit https://cla.microsoft.com to sign digitally. Alternatively, download the agreement ([Microsoft Contribution License Agreement.docx](https://www.codeplex.com/Download?ProjectName=typescript&DownloadId=822190) or [Microsoft Contribution License Agreement.pdf](https://www.codeplex.com/Download?ProjectName=typescript&DownloadId=921298)), sign, scan, and email it back to <cla@microsoft.com>. Be sure to include your github user name along with the agreement. Once we have received the signed CLA, we'll review the request.
