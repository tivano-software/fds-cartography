import { Knockout } from "../../../../util/knockout";
import { ComputedNotNull } from "../../../../util/knockout/lib/knockout.interface";
import { FeatureCollection, GeoJSONLoadService } from "../../../../util/services/geojson/geojson-load.service";
import { GeoJSONToSVGService } from "../../../../util/services/geojson/geojson-to-svg.service";
import { XML, XMLTag } from "../../../../util/services/xml-tag-service";
import { FileNameStringJSON } from "../../../../util/types/template-types/file-name-string.type";
import { svgGDefault } from "../../static/svg-g.factory";

export abstract class ToSVGable<Tag extends XMLTag, Id extends string> {

    public readonly svgDefault = svgGDefault();
    public readonly geoJSONLoadService = new GeoJSONLoadService();
    public readonly geoJSONToSVGService = new GeoJSONToSVGService();

    constructor(public readonly ko: Knockout) {}

    abstract readonly toSVG: ComputedNotNull<XML<Tag>>;
    abstract get id(): Id;
    abstract get idHref(): `#${Id}`;
    abstract init(): Promise<void>;

    public async loadGeoJSON<Properties>(ressource: FileNameStringJSON): Promise<FeatureCollection<Properties>> {
        const json = await this.geoJSONLoadService.load<Properties>(ressource);
        return json;
    }
}