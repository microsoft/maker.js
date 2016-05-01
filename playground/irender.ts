namespace MakerJsPlaygroundRender {

    export interface IRenderModel {
        requestId: number;
        orderedDependencies?: { [id: string]: string };
        javaScript?: string;
        paramValues: any[]
    }

    export interface IResponse {
        requestId: number;
        model: MakerJs.IModel;
    }
}
