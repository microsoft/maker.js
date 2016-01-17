// Type definitions for CSG from OpenJsCad.js
// Project: https://github.com/joostn/OpenJsCad
interface IAMFStringOptions {
    unit: string;
}
declare class CxG {
    toStlString(): string;
    toStlBinary(): void;
    toAMFString(AMFStringOptions?: IAMFStringOptions): void;
    getBounds(): CxG[];
    transform(matrix4x4: CSG.Matrix4x4): CxG;
    mirrored(plane: CSG.Plane): CxG;
    mirroredX(): CxG;
    mirroredY(): CxG;
    mirroredZ(): CxG;
    translate(v: number[]): CxG;
    translate(v: CSG.Vector3D): CxG;
    scale(f: CSG.Vector3D): CxG;
    rotateX(deg: number): CxG;
    rotateY(deg: number): CxG;
    rotateZ(deg: number): CxG;
    rotate(rotationCenter: CSG.Vector3D, rotationAxis: CSG.Vector3D, degrees: number): CxG;
    rotateEulerAngles(alpha: number, beta: number, gamma: number, position: number[]): CxG;
}
interface ICenter {
    center(cAxes: string[]): CxG;
}
declare class CSG extends CxG implements ICenter {
    polygons: CSG.Polygon[];
    properties: CSG.Properties;
    isCanonicalized: boolean;
    isRetesselated: boolean;
    cachedBoundingBox: CSG.Vector3D[];
    static defaultResolution2D: number;
    static defaultResolution3D: number;
    static fromPolygons(polygons: CSG.Polygon[]): CSG;
    static fromSlices(options: any): CSG;
    static fromObject(obj: any): CSG;
    static fromCompactBinary(bin: any): CSG;
    toPolygons(): CSG.Polygon[];
    union(csg: CSG[]): CSG;
    union(csg: CSG): CSG;
    unionSub(csg: CSG, retesselate?: boolean, canonicalize?: boolean): CSG;
    unionForNonIntersecting(csg: CSG): CSG;
    subtract(csg: CSG[]): CSG;
    subtract(csg: CSG): CSG;
    subtractSub(csg: CSG, retesselate: boolean, canonicalize: boolean): CSG;
    intersect(csg: CSG[]): CSG;
    intersect(csg: CSG): CSG;
    intersectSub(csg: CSG, retesselate?: boolean, canonicalize?: boolean): CSG;
    invert(): CSG;
    transform1(matrix4x4: CSG.Matrix4x4): CSG;
    transform(matrix4x4: CSG.Matrix4x4): CSG;
    toString(): string;
    expand(radius: number, resolution: number): CSG;
    contract(radius: number, resolution: number): CSG;
    stretchAtPlane(normal: number[], point: number[], length: number): CSG;
    expandedShell(radius: number, resolution: number, unionWithThis: boolean): CSG;
    canonicalized(): CSG;
    reTesselated(): CSG;
    getBounds(): CSG.Vector3D[];
    mayOverlap(csg: CSG): boolean;
    cutByPlane(plane: CSG.Plane): CSG;
    connectTo(myConnector: CSG.Connector, otherConnector: CSG.Connector, mirror: boolean, normalrotation: number): CSG;
    setShared(shared: CSG.Polygon.Shared): CSG;
    setColor(args: any): CSG;
    toCompactBinary(): {
        "class": string;
        numPolygons: number;
        numVerticesPerPolygon: Uint32Array;
        polygonPlaneIndexes: Uint32Array;
        polygonSharedIndexes: Uint32Array;
        polygonVertices: Uint32Array;
        vertexData: Float64Array;
        planeData: Float64Array;
        shared: CSG.Polygon.Shared[];
    };
    toPointCloud(cuberadius: any): CSG;
    getTransformationAndInverseTransformationToFlatLying(): any;
    getTransformationToFlatLying(): any;
    lieFlat(): CSG;
    projectToOrthoNormalBasis(orthobasis: CSG.OrthoNormalBasis): CAG;
    sectionCut(orthobasis: CSG.OrthoNormalBasis): CAG;
    fixTJunctions(): CSG;
    toTriangles(): any[];
    getFeatures(features: any): any;
    center(cAxes: string[]): CxG;
    toX3D(): Blob;
    toStlBinary(): Blob;
    toStlString(): string;
    toAMFString(m: IAMFStringOptions): Blob;
}
declare module CSG {
    function fnNumberSort(a: any, b: any): number;
    function parseOption(options: any, optionname: any, defaultvalue: any): any;
    function parseOptionAs3DVector(options: any, optionname: any, defaultvalue: any): Vector3D;
    function parseOptionAs3DVectorList(options: any, optionname: any, defaultvalue: any): any;
    function parseOptionAs2DVector(options: any, optionname: any, defaultvalue: any): any;
    function parseOptionAsFloat(options: any, optionname: any, defaultvalue: any): any;
    function parseOptionAsInt(options: any, optionname: any, defaultvalue: any): any;
    function parseOptionAsBool(options: any, optionname: any, defaultvalue: any): any;
    function cube(options: any): CSG;
    function sphere(options: any): CSG;
    function cylinder(options: any): CSG;
    function roundedCylinder(options: any): CSG;
    function roundedCube(options: any): CSG;
    /**
     * polyhedron accepts openscad style arguments. I.e. define face vertices clockwise looking from outside
     */
    function polyhedron(options: any): CSG;
    function IsFloat(n: any): boolean;
    function solve2Linear(a: any, b: any, c: any, d: any, u: any, v: any): number[];
    class Vector3D extends CxG {
        x: number;
        y: number;
        z: number;
        constructor(v3: Vector3D);
        constructor(v2: Vector2D);
        constructor(v2: number[]);
        constructor(x: number, y: number);
        constructor(x: number, y: number, z: number);
        static Create(x: number, y: number, z: number): Vector3D;
        clone(): Vector3D;
        negated(): Vector3D;
        abs(): Vector3D;
        plus(a: Vector3D): Vector3D;
        minus(a: Vector3D): Vector3D;
        times(a: number): Vector3D;
        dividedBy(a: number): Vector3D;
        dot(a: Vector3D): number;
        lerp(a: Vector3D, t: number): Vector3D;
        lengthSquared(): number;
        length(): number;
        unit(): Vector3D;
        cross(a: Vector3D): Vector3D;
        distanceTo(a: Vector3D): number;
        distanceToSquared(a: Vector3D): number;
        equals(a: Vector3D): boolean;
        multiply4x4(matrix4x4: Matrix4x4): Vector3D;
        transform(matrix4x4: Matrix4x4): Vector3D;
        toString(): string;
        randomNonParallelVector(): Vector3D;
        min(p: Vector3D): Vector3D;
        max(p: Vector3D): Vector3D;
        toStlString(): string;
        toAMFString(): string;
    }
    class Vertex extends CxG {
        pos: Vector3D;
        tag: number;
        constructor(pos: Vector3D);
        static fromObject(obj: any): Vertex;
        flipped(): Vertex;
        getTag(): number;
        interpolate(other: Vertex, t: number): Vertex;
        transform(matrix4x4: Matrix4x4): Vertex;
        toString(): string;
        toStlString(): string;
        toAMFString(): string;
    }
    class Plane extends CxG {
        normal: Vector3D;
        w: number;
        tag: number;
        constructor(normal: Vector3D, w: number);
        static fromObject(obj: any): Plane;
        static EPSILON: number;
        static fromVector3Ds(a: Vector3D, b: Vector3D, c: Vector3D): Plane;
        static anyPlaneFromVector3Ds(a: Vector3D, b: Vector3D, c: Vector3D): Plane;
        static fromPoints(a: Vector3D, b: Vector3D, c: Vector3D): Plane;
        static fromNormalAndPoint(normal: Vector3D, point: Vector3D): Plane;
        static fromNormalAndPoint(normal: number[], point: number[]): Plane;
        flipped(): Plane;
        getTag(): number;
        equals(n: Plane): boolean;
        transform(matrix4x4: Matrix4x4): Plane;
        splitPolygon(polygon: Polygon): {
            type: any;
            front: any;
            back: any;
        };
        splitLineBetweenPoints(p1: Vector3D, p2: Vector3D): Vector3D;
        intersectWithLine(line3d: Line3D): Vector3D;
        intersectWithPlane(plane: Plane): Line3D;
        signedDistanceToPoint(point: Vector3D): number;
        toString(): string;
        mirrorPoint(point3d: Vector3D): Vector3D;
    }
    class Polygon extends CxG {
        vertices: Vertex[];
        shared: Polygon.Shared;
        plane: Plane;
        cachedBoundingSphere: any;
        cachedBoundingBox: Vector3D[];
        static defaultShared: CSG.Polygon.Shared;
        constructor(vertices: Vector3D, shared?: Polygon.Shared, plane?: Plane);
        constructor(vertices: Vertex[], shared?: Polygon.Shared, plane?: Plane);
        static fromObject(obj: any): Polygon;
        checkIfConvex(): void;
        setColor(args: any): Polygon;
        getSignedVolume(): number;
        getArea(): number;
        getTetraFeatures(features: any): any[];
        extrude(offsetvector: any): CSG;
        boundingSphere(): any;
        boundingBox(): Vector3D[];
        flipped(): Polygon;
        transform(matrix4x4: Matrix4x4): Polygon;
        toString(): string;
        projectToOrthoNormalBasis(orthobasis: OrthoNormalBasis): CAG;
        /**
            * Creates solid from slices (CSG.Polygon) by generating walls
            * @param {Object} options Solid generating options
            *  - numslices {Number} Number of slices to be generated
            *  - callback(t, slice) {Function} Callback function generating slices.
            *          arguments: t = [0..1], slice = [0..numslices - 1]
            *          return: CSG.Polygon or null to skip
            *  - loop {Boolean} no flats, only walls, it's used to generate solids like a tor
            */
        solidFromSlices(options: any): CSG;
        /**
            *
            * @param walls Array of wall polygons
            * @param bottom Bottom polygon
            * @param top Top polygon
            */
        private _addWalls(walls, bottom, top, bFlipped);
        static verticesConvex(vertices: Vertex[], planenormal: any): boolean;
        static createFromPoints(points: number[][], shared?: CSG.Polygon.Shared, plane?: Plane): Polygon;
        static isConvexPoint(prevpoint: any, point: any, nextpoint: any, normal: any): boolean;
        static isStrictlyConvexPoint(prevpoint: any, point: any, nextpoint: any, normal: any): boolean;
        toStlString(): string;
    }
}
declare module CSG.Polygon {
    class Shared {
        color: any;
        tag: any;
        constructor(color: any);
        static fromObject(obj: any): Shared;
        static fromColor(args: any): Shared;
        getTag(): any;
        getHash(): any;
    }
}
declare module CSG {
    class PolygonTreeNode {
        parent: any;
        children: any;
        polygon: Polygon;
        removed: boolean;
        constructor();
        addPolygons(polygons: any): void;
        remove(): void;
        isRemoved(): boolean;
        isRootNode(): boolean;
        invert(): void;
        getPolygon(): Polygon;
        getPolygons(result: Polygon[]): void;
        splitByPlane(plane: any, coplanarfrontnodes: any, coplanarbacknodes: any, frontnodes: any, backnodes: any): void;
        _splitByPlane(plane: any, coplanarfrontnodes: any, coplanarbacknodes: any, frontnodes: any, backnodes: any): void;
        addChild(polygon: Polygon): PolygonTreeNode;
        invertSub(): void;
        recursivelyInvalidatePolygon(): void;
    }
    class Tree {
        polygonTree: PolygonTreeNode;
        rootnode: Node;
        constructor(polygons: Polygon[]);
        invert(): void;
        clipTo(tree: Tree, alsoRemovecoplanarFront?: boolean): void;
        allPolygons(): Polygon[];
        addPolygons(polygons: Polygon[]): void;
    }
    class Node {
        parent: Node;
        plane: Plane;
        front: any;
        back: any;
        polygontreenodes: PolygonTreeNode[];
        constructor(parent: Node);
        invert(): void;
        clipPolygons(polygontreenodes: PolygonTreeNode[], alsoRemovecoplanarFront: boolean): void;
        clipTo(tree: Tree, alsoRemovecoplanarFront: boolean): void;
        addPolygonTreeNodes(polygontreenodes: PolygonTreeNode[]): void;
        getParentPlaneNormals(normals: Vector3D[], maxdepth: number): void;
    }
    class Matrix4x4 {
        elements: number[];
        constructor(elements?: number[]);
        plus(m: Matrix4x4): Matrix4x4;
        minus(m: Matrix4x4): Matrix4x4;
        multiply(m: Matrix4x4): Matrix4x4;
        clone(): Matrix4x4;
        rightMultiply1x3Vector(v: Vector3D): Vector3D;
        leftMultiply1x3Vector(v: Vector3D): Vector3D;
        rightMultiply1x2Vector(v: Vector2D): Vector2D;
        leftMultiply1x2Vector(v: Vector2D): Vector2D;
        isMirroring(): boolean;
        static unity(): Matrix4x4;
        static rotationX(degrees: number): Matrix4x4;
        static rotationY(degrees: number): Matrix4x4;
        static rotationZ(degrees: number): Matrix4x4;
        static rotation(rotationCenter: CSG.Vector3D, rotationAxis: CSG.Vector3D, degrees: number): Matrix4x4;
        static translation(v: number[]): Matrix4x4;
        static translation(v: Vector3D): Matrix4x4;
        static mirroring(plane: Plane): Matrix4x4;
        static scaling(v: number[]): Matrix4x4;
        static scaling(v: Vector3D): Matrix4x4;
    }
    class Vector2D extends CxG {
        x: number;
        y: number;
        constructor(x: number, y: number);
        constructor(x: number[]);
        constructor(x: Vector2D);
        static fromAngle(radians: number): Vector2D;
        static fromAngleDegrees(degrees: number): Vector2D;
        static fromAngleRadians(radians: number): Vector2D;
        static Create(x: number, y: number): Vector2D;
        toVector3D(z: number): Vector3D;
        equals(a: Vector2D): boolean;
        clone(): Vector2D;
        negated(): Vector2D;
        plus(a: Vector2D): Vector2D;
        minus(a: Vector2D): Vector2D;
        times(a: number): Vector2D;
        dividedBy(a: number): Vector2D;
        dot(a: Vector2D): number;
        lerp(a: Vector2D, t: number): Vector2D;
        length(): number;
        distanceTo(a: Vector2D): number;
        distanceToSquared(a: Vector2D): number;
        lengthSquared(): number;
        unit(): Vector2D;
        cross(a: Vector2D): number;
        normal(): Vector2D;
        multiply4x4(matrix4x4: Matrix4x4): Vector2D;
        transform(matrix4x4: Matrix4x4): Vector2D;
        angle(): number;
        angleDegrees(): number;
        angleRadians(): number;
        min(p: Vector2D): Vector2D;
        max(p: Vector2D): Vector2D;
        toString(): string;
        abs(): Vector2D;
    }
    class Line2D extends CxG {
        normal: Vector2D;
        w: number;
        constructor(normal: Vector2D, w: number);
        static fromPoints(p1: Vector2D, p2: Vector2D): Line2D;
        reverse(): Line2D;
        equals(l: Line2D): boolean;
        origin(): Vector2D;
        direction(): Vector2D;
        xAtY(y: number): number;
        absDistanceToPoint(point: Vector2D): number;
        intersectWithLine(line2d: Line2D): Vector2D;
        transform(matrix4x4: Matrix4x4): Line2D;
    }
    class Line3D extends CxG {
        point: Vector3D;
        direction: Vector3D;
        constructor(point: Vector3D, direction: Vector3D);
        static fromPoints(p1: Vector3D, p2: Vector3D): Line3D;
        static fromPlanes(p1: Plane, p2: Plane): Line3D;
        intersectWithPlane(plane: Plane): Vector3D;
        clone(): Line3D;
        reverse(): Line3D;
        transform(matrix4x4: Matrix4x4): Line3D;
        closestPointOnLine(point: Vector3D): Vector3D;
        distanceToPoint(point: Vector3D): number;
        equals(line3d: Line3D): boolean;
    }
    class OrthoNormalBasis extends CxG {
        v: Vector3D;
        u: Vector3D;
        plane: Plane;
        planeorigin: Vector3D;
        constructor(plane: Plane, rightvector?: Vector3D);
        static GetCartesian(xaxisid: string, yaxisid: string): OrthoNormalBasis;
        static Z0Plane(): OrthoNormalBasis;
        getProjectionMatrix(): Matrix4x4;
        getInverseProjectionMatrix(): Matrix4x4;
        to2D(vec3: Vector3D): Vector2D;
        to3D(vec2: Vector2D): Vector3D;
        line3Dto2D(line3d: Line3D): Line2D;
        line2Dto3D(line2d: Line2D): Line3D;
        transform(matrix4x4: Matrix4x4): OrthoNormalBasis;
    }
    function interpolateBetween2DPointsForY(point1: Vector2D, point2: Vector2D, y: number): number;
    function reTesselateCoplanarPolygons(sourcepolygons: CSG.Polygon[], destpolygons: CSG.Polygon[]): void;
    class fuzzyFactory {
        multiplier: number;
        lookuptable: any;
        constructor(numdimensions: number, tolerance: number);
        lookupOrCreate(els: any, creatorCallback: any): any;
    }
    class fuzzyCSGFactory {
        vertexfactory: fuzzyFactory;
        planefactory: fuzzyFactory;
        polygonsharedfactory: any;
        constructor();
        getPolygonShared(sourceshared: Polygon.Shared): Polygon.Shared;
        getVertex(sourcevertex: Vertex): Vertex;
        getPlane(sourceplane: Plane): Plane;
        getPolygon(sourcepolygon: Polygon): Polygon;
        getCSG(sourcecsg: CSG): CSG;
    }
    var staticTag: number;
    function getTag(): number;
    class Properties {
        cube: Properties;
        center: any;
        facecenters: any[];
        roundedCube: Properties;
        cylinder: Properties;
        start: any;
        end: any;
        facepointH: any;
        facepointH90: any;
        sphere: Properties;
        facepoint: any;
        roundedCylinder: any;
        _transform(matrix4x4: Matrix4x4): Properties;
        _merge(otherproperties: Properties): Properties;
        static transformObj(source: any, result: any, matrix4x4: Matrix4x4): void;
        static cloneObj(source: any, result: any): void;
        static addFrom(result: any, otherproperties: Properties): void;
    }
    class Connector extends CxG {
        point: Vector3D;
        axisvector: Vector3D;
        normalvector: Vector3D;
        constructor(point: number[], axisvector: Vector3D, normalvector: number[]);
        constructor(point: number[], axisvector: number[], normalvector: number[]);
        constructor(point: number[], axisvector: number[], normalvector: Vector3D);
        constructor(point: Vector3D, axisvector: number[], normalvector: Vector3D);
        constructor(point: Vector3D, axisvector: number[], normalvector: number[]);
        constructor(point: Vector3D, axisvector: Vector3D, normalvector: Vector3D);
        normalized(): Connector;
        transform(matrix4x4: Matrix4x4): Connector;
        getTransformationTo(other: Connector, mirror: boolean, normalrotation: number): Matrix4x4;
        axisLine(): Line3D;
        extend(distance: number): Connector;
    }
    class ConnectorList {
        connectors_: Connector[];
        closed: boolean;
        constructor(connectors: Connector[]);
        static defaultNormal: number[];
        static fromPath2D(path2D: CSG.Path2D, arg1: any, arg2: any): ConnectorList;
        static _fromPath2DTangents(path2D: any, start: any, end: any): ConnectorList;
        static _fromPath2DExplicit(path2D: any, angleIsh: any): ConnectorList;
        setClosed(bool: boolean): void;
        appendConnector(conn: Connector): void;
        followWith(cagish: any): CSG;
        verify(): void;
    }
    interface IRadiusOptions {
        radius?: number;
        resolution?: number;
    }
    interface ICircleOptions extends IRadiusOptions {
        center?: number[];
    }
    interface IArcOptions extends ICircleOptions {
        startangle?: number;
        endangle?: number;
        maketangent?: boolean;
    }
    interface IEllpiticalArcOptions extends IRadiusOptions {
        clockwise?: boolean;
        large?: boolean;
        xaxisrotation?: number;
        xradius?: number;
        yradius?: number;
    }
    class Path2D extends CxG {
        closed: boolean;
        points: Vector2D[];
        lastBezierControlPoint: Vector2D;
        constructor(points: number[], closed?: boolean);
        constructor(points: Vector2D[], closed?: boolean);
        static arc(options: IArcOptions): Path2D;
        concat(otherpath: Path2D): Path2D;
        appendPoint(point: Vector2D): Path2D;
        appendPoints(points: Vector2D[]): Path2D;
        close(): Path2D;
        rectangularExtrude(width: number, height: number, resolution: number): CSG;
        expandToCAG(pathradius: number, resolution: number): CAG;
        innerToCAG(): CAG;
        transform(matrix4x4: Matrix4x4): Path2D;
        appendBezier(controlpoints: any, options: any): Path2D;
        appendArc(endpoint: Vector2D, options: IEllpiticalArcOptions): Path2D;
    }
}
declare class CAG extends CxG implements ICenter {
    sides: CAG.Side[];
    isCanonicalized: boolean;
    constructor();
    static fromSides(sides: CAG.Side[]): CAG;
    static fromPoints(points: CSG.Vector2D[]): CAG;
    static fromPointsNoCheck(points: CSG.Vector2D[]): CAG;
    static fromFakeCSG(csg: CSG): CAG;
    static linesIntersect(p0start: any, p0end: any, p1start: any, p1end: any): boolean;
    static circle(options: CSG.ICircleOptions): CAG;
    static rectangle(options: any): CAG;
    static roundedRectangle(options: any): CAG;
    static fromCompactBinary(bin: any): CAG;
    toString(): string;
    _toCSGWall(z0: any, z1: any): CSG;
    _toVector3DPairs(m: CSG.Matrix4x4): CSG.Vector3D[][];
    _toPlanePolygons(options: any): CSG.Polygon[];
    _toWallPolygons(options: any): any[];
    union(cag: CAG[]): CAG;
    union(cag: CAG): CAG;
    subtract(cag: CAG[]): CAG;
    subtract(cag: CAG): CAG;
    intersect(cag: CAG[]): CAG;
    intersect(cag: CAG): CAG;
    transform(matrix4x4: CSG.Matrix4x4): CAG;
    area(): number;
    flipped(): CAG;
    getBounds(): CSG.Vector2D[];
    isSelfIntersecting(): boolean;
    expandedShell(radius: number, resolution: number): CAG;
    expand(radius: number, resolution: number): CAG;
    contract(radius: number, resolution: number): CAG;
    extrudeInOrthonormalBasis(orthonormalbasis: CSG.OrthoNormalBasis, depth: number, options?: any): CSG;
    extrudeInPlane(axis1: any, axis2: any, depth: any, options: any): CSG;
    extrude(options: CAG.CAG_extrude_options): CSG;
    rotateExtrude(options: any): CSG;
    check(): void;
    canonicalized(): CAG;
    toCompactBinary(): {
        'class': string;
        sideVertexIndices: Uint32Array;
        vertexData: Float64Array;
    };
    getOutlinePaths(): any[];
    overCutInsideCorners(cutterradius: any): CAG;
    center(cAxes: string[]): CxG;
    toDxf(): Blob;
    static PathsToDxf(paths: any): Blob;
}
declare module CAG {
    class Vertex {
        pos: CSG.Vector2D;
        tag: number;
        constructor(pos: CSG.Vector2D);
        toString(): string;
        getTag(): number;
    }
    class Side extends CxG {
        vertex0: Vertex;
        vertex1: Vertex;
        tag: number;
        constructor(vertex0: Vertex, vertex1: Vertex);
        static _fromFakePolygon(polygon: CSG.Polygon): Side;
        toString(): string;
        toPolygon3D(z0: any, z1: any): CSG.Polygon;
        transform(matrix4x4: CSG.Matrix4x4): Side;
        flipped(): Side;
        direction(): CSG.Vector2D;
        getTag(): number;
        lengthSquared(): number;
        length(): number;
    }
    class fuzzyCAGFactory {
        vertexfactory: CSG.fuzzyFactory;
        constructor();
        getVertex(sourcevertex: Vertex): Vertex;
        getSide(sourceside: Side): Side;
        getCAG(sourcecag: CAG): CAG;
    }
    interface CAG_extrude_options {
        offset?: number[];
        twistangle?: number;
        twiststeps?: number;
    }
}
declare module CSG {
    class Polygon2D extends CAG {
        constructor(points: Vector2D[]);
    }
}
