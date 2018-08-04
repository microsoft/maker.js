///<reference path="../target/ts/makerjs.d.ts"/>

var makerjs: typeof MakerJs = require('../target/js/node.maker.js');

class Ventgrid implements MakerJs.IModel {
		
	public units = makerjs.unitType.Millimeter;
    public paths: MakerJs.IPathMap = {};
	
	constructor(public filterRadius: number, public spacing: number, public width: number, public height: number) {
		
		var alternate = false;
		var xDistance = 2 * filterRadius * (1 + spacing / 100);
		var countX = Math.ceil(width / xDistance);
		var yDistance = makerjs.tools.solveTriangleASA(60, xDistance / 2, 90);
		var countY = Math.ceil(height / yDistance) + 1;
		
		function checkBoundary(x: number, y: number) : boolean {		
			return y - filterRadius < height && x - filterRadius < width;
		}

		var row = (iy: number) => {
			
			var total = countX;
			if (!alternate) {
				total++;
			}
			
			for (var i = 0; i < total; i++) {
				var x = i * xDistance;
				var y = iy * yDistance;
				
				if (alternate) {
					x += xDistance / 2;
				}
				
                if (checkBoundary(Math.abs(x), Math.abs(y))) {

                    var id = 'filter_' + i + '_' + iy;

                    this.paths[id] = new makerjs.paths.Circle([x, y], filterRadius);
					
					if (alternate || (!alternate && i > 0)) {
                        this.paths[id + '_alt'] = new makerjs.paths.Circle([-x, y], filterRadius);
					}
				}
			}
		};
		
		for (var i = 0; i < countY; i++) {
			row(i);
			
			if (i > 0) {
				row(-i);
			}
			
			alternate = !alternate;
		}
		
	}
	
}

(<MakerJs.kit.IKit>Ventgrid).metaParameters = [
    { title: "filterRadius", type: "range", min: 1, max: 20, value: 2 },
	{ title: "spacing", type: "range", min: 10, max: 100, value: 49 },
	{ title: "width", type: "range", min: 20, max: 200, value: 37 },
	{ title: "height", type: "range", min: 20, max: 200, value: 50 },
];

module.exports = Ventgrid;

  //To compile this: go to the root and:

  // cd examples
  // tsc ventgrid.ts --declaration

