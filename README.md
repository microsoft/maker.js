# Maker.js
Maker.js is a JavaScript library for creating programmable 2D vector drawings that can be exported to SVG or DXF file formats for CNC and laser cutter machines.

## Uses
Maker.js can be used in a web page as a simple CAD drawing generator. It can be a core engine for a small CAD gui app. It can run in a Node.js environment to create drawings dynamically.

## Features
* Lightweight with no dependencies.
* Uses plain old JavaScript objects (POJO 's) for its drawing model.
* Exports to DXF or SVG format.
* Support for a variety of unit systems:
 * millimeter
 * centimeter
 * meter
 * inch
 * foot
* Primitive paths:
 * line
 * circle
 * arc
* Transformations:
 * Mirror
 * Rotate
 * Scale
* Basic models:
 * Rectangle
 * Square
 * Rounded rectangle
 * Oval
 * Arc slot
 * Bolt circle
 * Bolt rectangle
 * S curve

## What it isn't
* A general purpose SVG generator. There are many features in SVG such as color fill and animation that are not applicable to CNC output. Maker.js only uses SVG for rendering simple line contours and interoperability with other applications that import SVG.
* A DXF reader. Although Maker.js can export to DXF, it does not import it.
* A full featured CAD system.
* A printer driver or G-code generator.

## About
Maker.js is written in TypeScript and compiled to JavaScript.

## Contributing
We would love to accept your contributions to Maker.js. Before you consider making any changes, plese review the tenets of this project, and the legal policy of Microsoft below.

### Maker.js project tenets
* Lightweight - We do not want to bloat the codebase with every possible trigonometric function, generally just those which add broad utility. A plugin ecosystem is however encouraged.
* Compatible - Maker.js is primitive by design, to maintain the maximum compatibility with many types of "Maker" machines which may not have ellipse or bezier curve ability. Target machines include but are not limited to:
 * Laser cutters
 * Vinyl cutters
 * Waterjet cutters
 * CNC routers
 * Plasma cutters
 * 2D engravers
* Accesible - Maker.js wants to run everywhere JavaScript does. The Maker.js API strives toward simplicity and easy understandability to programmers with a wide range of experience. We do not wish to reinvent a new language, we want to leverage JavaScript as a language.
* Reusablility - We want to encourage an ecosystem of models and modeling plugins which may create dependencies on each other.
* Interoperability - We want other CAD apps when possible to have easy access of importing from or to our data formats.
