namespace MakerJs.solvers {

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

}