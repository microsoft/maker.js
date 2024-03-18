namespace MakerJs.models {

    export class ArcWedge implements IModel {

        public paths: IPathMap = {};
        public models: IModelMap;

        constructor(startAngle: number, endAngle: number, sweepRadius: number, slotRadius: number, isolateCaps = false) {

            var capRoot: IModel;

            if (isolateCaps) {
                capRoot = { models: {} };
                this.models = { 'Caps': capRoot };
            }

            if (slotRadius <= 0 || sweepRadius <= 0) return;

            startAngle = angle.noRevolutions(startAngle);
            endAngle = angle.noRevolutions(endAngle);

            if (endAngle < startAngle) endAngle += 360;

            var addCap = (id: string, tiltAngle: number): IPathLine => {
                var capModel: IModel;

                if (isolateCaps) {
                    capModel = { paths: {} };
                    capRoot.models[id] = capModel;
                } else {
                    capModel = this;
                }

                var pointA = MakerJs.point.fromPolar(MakerJs.angle.toRadians(tiltAngle), sweepRadius + slotRadius);
                var pointB = MakerJs.point.fromPolar(MakerJs.angle.toRadians(tiltAngle), sweepRadius - slotRadius);

                return capModel.paths[id] = new MakerJs.paths.Line(
                     pointA, 
                     pointB);                     
            };

           	if(endAngle != startAngle){
           		
		        var addSweep = (id: string, offsetRadius: number): IPathArc => {
		            return this.paths[id] = new paths.Arc(
		                [0, 0],
		                sweepRadius + offsetRadius,
		                startAngle,
		                endAngle);
		        };

	            addSweep("Outer", slotRadius);

	            var hasInner = (sweepRadius - slotRadius) > 0;
	            if (hasInner) {
	                addSweep("Inner", -slotRadius);
	            }

	            var caps = [];
	            caps.push(addCap("StartCap", startAngle));
	            caps.push(addCap("EndCap", endAngle));
	            
            }else{

		        var addCirc = (id: string, offsetRadius: number): IPathCircle => {
		            return this.paths[id] = new paths.Circle(
		                [0, 0],
		                sweepRadius + offsetRadius);
		        };

	            addCirc("Outer", slotRadius);

	            var hasInner = (sweepRadius - slotRadius) > 0;
	            if (hasInner) {
	                addCirc("Inner", -slotRadius);
	            }
            }
        }
    }

    (<IKit>ArcWedge).metaParameters = [
        { title: "start angle", type: "range", min: -360, max: 360, step: 1, value: 180 },
        { title: "end angle", type: "range", min: -360, max: 360, step: 1, value: 0 },
        { title: "sweep", type: "range", min: 0, max: 100, step: 1, value: 50 },
        { title: "radius", type: "range", min: 0, max: 100, step: 1, value: 15 },
    ];
}
