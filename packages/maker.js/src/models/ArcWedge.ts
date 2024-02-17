namespace MakerJs.models {

    export class ArcWedge implements IModel {

        public paths: IPathMap = {};
        public models: IModelMap;

        constructor(startAngle: number, endAngle: number, sweepRadius: number, slotRadius: number, capRadius, largeArc = false, selfIntersect = false, isolateCaps = false) {

            // Change capRadius to an array, if it is not already and create elements for start and end caps
            if (!Array.isArray(capRadius))capRadius = [capRadius, capRadius];

 	        // Make sure the capRadius Array contains numerics
            capRadius=capRadius.map(Number);
            
            var capRoot: IModel;

            if (isolateCaps) {
                capRoot = { models: {} };
                this.models = { 'Caps': capRoot };
            }

            if (slotRadius <= 0 || sweepRadius <= 0) return;

            startAngle = angle.noRevolutions(startAngle);
            endAngle = angle.noRevolutions(endAngle);

            if (round(startAngle - endAngle) == 0) return;

            if (endAngle < startAngle) endAngle += 360;

            var addCap = (id: string, tiltAngle: number, _capRadius: number): IPathArc => {
                var capModel: IModel;

                if (isolateCaps) {
                    capModel = { paths: {} };
                    capRoot.models[id] = capModel;
                } else {
                    capModel = this;
                }
                
				var sweepSlotA = sweepRadius + slotRadius
				var sweepSlotB = sweepRadius - slotRadius

				if( (id[0] == "S" && _capRadius>=0) || (id[0] == "E" && _capRadius < 0) ){
					sweepSlotA = sweepRadius - slotRadius
					sweepSlotB = sweepRadius + slotRadius
				}
                
                // Find the end points for creating the arc
				var pointA = MakerJs.point.fromPolar(MakerJs.angle.toRadians(tiltAngle), sweepSlotA)
				var pointB = MakerJs.point.fromPolar(MakerJs.angle.toRadians(tiltAngle), sweepSlotB)

				// Increase or decrease _capRadius by slotRadius, eliminates the dead space between a capRadius of zero and slotRadius
				if(_capRadius<0)_capRadius-=slotRadius; else _capRadius+=slotRadius
				
				// Disable largeArc for negative _capRadius values, it does odd things!
				if ( largeArc && _capRadius<0 ) largeArc = false
				
				return capModel.paths[id] = new MakerJs.paths.Arc(pointA, pointB, Math.abs(_capRadius), largeArc, false);
            };

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
            caps.push(addCap("StartCap", startAngle, capRadius[0]));
            caps.push(addCap("EndCap", endAngle, capRadius[1]));

            //the distance between the cap origins
            var d = measure.pointDistance(caps[0].origin, caps[1].origin);

            if ((d / 2) < slotRadius) {
                //the caps intersect

                var int = path.intersection(caps[0], caps[1]);
                if (int) {

                    if (!hasInner || !selfIntersect) {
                        caps[0].startAngle = int.path1Angles[0];
                        caps[1].endAngle = int.path2Angles[0];
                    }

                    if (!selfIntersect && hasInner && int.intersectionPoints.length == 2) {
                        addCap("StartCap2", startAngle, capRadius[0]).endAngle = int.path1Angles[1];
                        addCap("EndCap2", endAngle, capRadius[1]).startAngle = int.path2Angles[1] + 360;
                    }
                }
            }
        }
    }

    (<IKit>ArcWedge).metaParameters = [
        { title: "start angle", type: "range", min: -360, max: 360, step: 1, value: 180 },
        { title: "end angle", type: "range", min: -360, max: 360, step: 1, value: 0 },
        { title: "sweep", type: "range", min: 0, max: 100, step: 1, value: 50 },
        { title: "radius", type: "range", min: 0, max: 100, step: 1, value: 15 },
        { title: "cap radius", type: "range", min: -180, max: 180, step: 1, value: 180 },
        { title: "largeArc", type: "bool", value: false },
        { title: "self intersect", type: "bool", value: false }
    ];
}
