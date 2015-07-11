# Maker.js

Maker.js, a Microsoft Garage project, is a JavaScript library for creating and sharing modular line drawings for CNC and laser cutters. Maker.js runs in both Node.js and web browsers.

[About](http://microsoft.github.io/maker.js/about/) - [Blog](http://microsoft.github.io/maker.js/) -  [Demos](http://microsoft.github.io/maker.js/demos/) - [Documentation](http://microsoft.github.io/maker.js/docs/) - [Discussion](https://gitter.im/Microsoft/maker.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

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
