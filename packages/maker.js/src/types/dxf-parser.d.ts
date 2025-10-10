declare namespace DxfParser {

    class DxfParser {
        parseSync(fileText: string): DXFDocument;
    }

    interface DXFDocument {
        blocks?: {
            [blockName: string]: Block;
        };
        entities?: Entity[];
        header?: Header;
        tables?: {
            [tableName: string]: Table;
        };
    }

    interface Header {
        [headerName: string]: number | string;
    }

    interface Entity {
        handle?: string;
        ownerHandle?: string;
        type?: string;
        materialObjectHandle?: string;
        lineType?: string;
        layer?: string;
        lineTypeScale?: number;
        lineweight?: number;
        visible?: boolean;
        colorIndex?: number;
        color?: number;
        inPaperSpace?: boolean;
        extendedData?: ExtendedData;
    }

    interface ExtendedData {
        applicationName?: string
        customStrings?: string[];
    }

    interface Block {
        name?: string;
        name2?: string;
        handle?: string;
        ownerHandle?: string;
        xrefPath?: string;
        layer?: string;
        position?: Vertex;
        paperSpace?: boolean;
        type?: number;
        entities?: Entity[];
    }

    interface Table {
        handle?: string;
        ownerHandle?: string;
    }

    type TableNames = 'layer' | 'lineType' | 'viewPort';

    interface TableLAYER extends Table {
        layers: { [layerName: string]: Layer };
    }

    interface TableLTYPE extends Table {
        lineTypes: { [lineTypeName: string]: LineType };
    }

    interface TableVPORT extends Table {
        viewPorts: { [viewPortName: string]: ViewPort };
    }

    interface Vertex {
        x: number;
        y: number;
        z?: number;
        bulge?: number;
    }

    interface ViewPort {
        name?: string;
        ownerHandle?: string;
        ambientColor?: number;
        lensLength?: number;
        backClippingPlane?: number;
        frontClippingPlane?: number;
        viewHeight?: number;
        snapRotationAngle?: number;
        viewTwistAngle?: number;
        orthographicType?: number;
        renderMode?: number;
        defaultLightingType?: number;
        defaultLightingOn?: boolean;
        center?: Vertex;
        gridSpacing?: Vertex;
        lowerLeftCorner?: Vertex;
        snapBasePoint?: Vertex;
        snapSpacing?: Vertex;
        ucsXAxis?: Vertex;
        ucsYAxis?: Vertex;
        ucsOrigin?: Vertex;
        upperRightCorner?: Vertex;
        viewDirectionFromTarget?: Vertex;
        viewTarget?: Vertex;
    }

    interface LineType {
        name?: string;
        description?: string;
        pattern?: number[];
        patternLength?: number;
    }

    interface Layer {
        name?: string;
        visible?: boolean;
        colorIndex?: number;
        color?: number;
        frozen?: boolean;
    }

    interface Entity3DFACE extends Entity {
        type: '3DFACE';
        vertices: Vertex[];
        shape?: boolean;
        hasContinuousLinetypePattern?: boolean;
    }

    interface EntityARC extends Entity {
        type: 'ARC';
        center?: Vertex;
        radius?: number;
        startAngle?: number;
        endAngle?: number;
        angleLength?: number;
    }

    interface EntityCIRCLE extends Entity {
        type: 'CIRCLE';
        center?: Vertex;
        radius?: number;
        startAngle?: number;
        angleLength?: number;
        endAngle?: number;
    }

    interface EntityELLIPSE extends Entity {
        type: 'ELLIPSE';
        center?: Vertex;
        majorAxisEndPoint?: Vertex;
        axisRatio?: number;
        startAngle?: number;
        endAngle?: number;
        name?: string;
    }

    interface Extruded {
        extrusionDirectionX?: number;
        extrusionDirectionY?: number;
        extrusionDirectionZ?: number;
    }

    interface EntityATTDEF extends Entity, Extruded {
        type: 'ATTDEF';
        scale: number;
        textStyle: string;
        text?: string;
        tag?: string;
        prompt?: string;
        startPoint?: Vertex;
        endPoint?: Vertex;
        thickness?: number;
        textHeight?: number;
        rotation?: number;
        obliqueAngle?: number;
        invisible?: boolean;
        constant?: boolean;
        verificationRequired?: boolean;
        preset?: boolean;
        backwards?: boolean;
        mirrored?: boolean;
        horizontalJustification?: number;
        fieldLength?: number;
        verticalJustification?: number;
    }

    interface EntityDIMENSION extends Entity {
        type: 'DIMENSION';
        block?: string;
        anchorPoint?: Vertex;
        middleOfText?: Vertex;
        insertionPoint?: Vertex;
        linearOrAngularPoint1?: Vertex;
        linearOrAngularPoint2?: Vertex;
        diameterOrRadiusPoint?: Vertex;
        arcPoint?: Vertex;
        dimensionType?: number;
        attachmentPoint?: number;
        actualMeasurement?: number;
        text?: string;
        angle?: number;
    }

    interface EntityINSERT extends Entity {
        type: 'INSERT';
        name?: string;
        xScale?: number;
        yScale?: number;
        zScale?: number;
        position?: Vertex;
        rotation?: number;
        columnCount?: number;
        rowCount?: number;
        columnSpacing?: number;
        rowSpacing?: number;
        extrusionDirection?: Vertex;
    }

    interface EntityLINE extends Entity {
        type: 'LINE';
        vertices: Vertex[];
        extrusionDirection?: Vertex;
    }

    interface VertexStroke extends Vertex {
        startWidth?: number;
        endWidth?: number;
    }

    interface EntityLWPOLYLINE extends Entity, Extruded {
        type: 'LWPOLYLINE';
        vertices: VertexStroke[];
        elevation?: number;
        depth?: number;
        shape?: boolean;
        hasContinuousLinetypePattern?: boolean;
        width?: number;
    }

    interface EntityMTEXT extends Entity {
        type: 'MTEXT';
        text?: string;
        position?: Vertex;
        height?: number;
        width?: number;
        rotation?: number;
        attachmentPoint?: number;
        drawingDirection?: number;
    }

    interface EntityPOINT extends Entity {
        type: 'POINT';
        position?: Vertex;
        thickness?: number;
        extrusionDirection?: Vertex;
    }

    interface EntityPOLYLINE extends Entity {
        type: 'POLYLINE';
        vertices: EntityVERTEX[];
        thickness?: number;
        shape?: boolean;
        includesCurveFitVertices?: boolean;
        includesSplineFitVertices?: boolean;
        is3dPolyline?: boolean;
        is3dPolygonMesh?: boolean;
        is3dPolygonMeshClosed?: boolean;
        isPolyfaceMesh?: boolean;
        hasContinuousLinetypePattern?: boolean;
        extrusionDirection?: Vertex;
    }

    interface EntitySOLID extends Entity {
        type: 'SOLID';
        points?: Vertex[];
        extrusionDirection?: Vertex;
    }

    interface EntitySPLINE extends Entity {
        type: 'SPLINE';
        controlPoints?: Vertex[];
        fitPoints?: Vertex[];
        startTangent?: Vertex;
        endTangent?: Vertex;
        knotValues?: number[];
        closed?: boolean;
        periodic?: boolean;
        rational?: boolean;
        planar?: boolean;
        linear?: boolean;
        degreeOfSplineCurve?: number;
        numberOfKnots?: number;
        numberOfControlPoints?: number;
        numberOfFitPoints?: number;
        normalVector?: Vertex;
    }

    interface EntityTEXT extends Entity {
        type: 'TEXT';
        startPoint?: Vertex;
        endPoint?: Vertex;
        textHeight?: number;
        xScale?: number;
        rotation?: number;
        text?: string;
        halign?: number;
        valign?: number;
    }

    interface EntityVERTEX extends Entity, Vertex {
        type: 'VERTEX';
        curveFittingVertex?: boolean;
        curveFitTangent?: boolean;
        splineVertex?: boolean;
        splineControlPoint?: boolean;
        threeDPolylineVertex?: boolean;
        threeDPolylineMesh?: boolean;
        polyfaceMeshVertex?: boolean;
    }
}

declare module "dxf-parser" {
    export = DxfParser.DxfParser;
}
