# Maker.js
Maker.js is a JavaScript library for creating programmable 2D vector drawings that can be exported to SVG or DXF file formats for CNC and laser cutter machines.

## Uses
Maker.js can be used in a web page as a lightweight CAD drawing generator. It can be a core engine for a small CAD gui app. It can run in a Node.js environment to create drawings dynamically.

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
* A full featured CAD system.
* A printer driver or G-code generator.
