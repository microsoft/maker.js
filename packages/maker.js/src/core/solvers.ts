namespace MakerJs.solvers {

    /**
     * @private
     */
    var equilateral = Math.sqrt(3) / 2;

    /**
     * Solves for the altitude of an equilateral triangle when you know its side length.
     * 
     * @param sideLength Length of a side of the equilateral triangle (all 3 sides are equal).
     * @returns Altitude of the equilateral triangle.
     */
    export function equilateralAltitude(sideLength: number) {
        return sideLength * equilateral;
    }

    /**
     * Solves for the side length of an equilateral triangle when you know its altitude.
     * 
     * @param altitude Altitude of the equilateral triangle.
     * @returns Length of the side of the equilateral triangle (all 3 sides are equal).
     */
    export function equilateralSide(altitude: number) {
        return altitude / equilateral;
    }

    /**
     * Solves for the angle of a triangle when you know lengths of 3 sides.
     * 
     * @param lengthA Length of side of triangle, opposite of the angle you are trying to find.
     * @param lengthB Length of any other side of the triangle.
     * @param lengthC Length of the remaining side of the triangle.
     * @returns Angle opposite of the side represented by the first parameter.
     */
    export function solveTriangleSSS(lengthA: number, lengthB: number, lengthC: number): number {
        return angle.toDegrees(Math.acos((lengthB * lengthB + lengthC * lengthC - lengthA * lengthA) / (2 * lengthB * lengthC)));
    }

    /**
     * Solves for the length of a side of a triangle when you know length of one side and 2 angles.
     * 
     * @param oppositeAngleInDegrees Angle which is opposite of the side you are trying to find.
     * @param lengthOfSideBetweenAngles Length of one side of the triangle which is between the provided angles.
     * @param otherAngleInDegrees An other angle of the triangle.
     * @returns Length of the side of the triangle which is opposite of the first angle parameter.
     */
    export function solveTriangleASA(oppositeAngleInDegrees: number, lengthOfSideBetweenAngles: number, otherAngleInDegrees: number): number {

        var angleOppositeSide = 180 - oppositeAngleInDegrees - otherAngleInDegrees;

        return (lengthOfSideBetweenAngles * Math.sin(angle.toRadians(oppositeAngleInDegrees))) / Math.sin(angle.toRadians(angleOppositeSide));
    }

    /**
     * Solves for the angles of the tangent lines between 2 circles.
     * 
     * @param a First circle.
     * @param b Second circle.
     * @param inner Boolean to use inner tangents instead of outer tangents.
     * @returns Array of angles in degrees where 2 lines between the circles will be tangent to both circles.
     */
    export function circleTangentAngles(a: IPathCircle, b: IPathCircle, inner = false): number[] {
        var connect = new paths.Line(a.origin, b.origin);
        var distance = measure.pointDistance(a.origin, b.origin);

        //no tangents if either circle encompasses the other
        if (a.radius >= distance + b.radius || b.radius >= distance + a.radius) return null;

        //no inner tangents when circles touch or overlap
        if (inner && (a.radius + b.radius >= distance)) return null;

        var tangentAngles: number[];

        if (!inner && round(a.radius - b.radius) == 0) {
            tangentAngles = [90, 270];
        } else {

            //solve for circles on the x axis at the distance
            var d2 = distance / 2;
            var between = new paths.Circle([d2, 0], d2);
            var diff = new paths.Circle(a.radius > b.radius ? [0, 0] : [distance, 0], inner ? (a.radius + b.radius) : Math.abs(a.radius - b.radius));
            var int = path.intersection(diff, between);

            if (!int || !int.path1Angles) return null;

            tangentAngles = int.path1Angles;
        }

        var connectAngle = angle.ofLineInDegrees(connect);

        //add the line's angle to the result
        return tangentAngles.map(a => angle.noRevolutions(a + connectAngle));
    }

}