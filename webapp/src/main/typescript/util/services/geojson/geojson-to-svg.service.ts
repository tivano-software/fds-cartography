import { Feature, FeatureCollection, LineString, LocationProperties, MultiLineString, MultiPolygon, Polygon } from "./geojson-load.service";
import { XML, XMLTagBase, XMLTagService } from "../xml-tag-service";
import { VectorEffectOption, XMLBaseOptions, XMLColorFillOptions, XMLStrokeOptions, XMLTransformOptions } from "../xml-tag-service/xml-options/xml-option-interfaces";


export type IntersectionOfPolygonAndLineOptions = XMLBaseOptions<string> & XMLStrokeOptions & XMLTransformOptions & XMLColorFillOptions & VectorEffectOption;
export type IntersectionOfPolygonAndLine = { options?: IntersectionOfPolygonAndLineOptions };

export class GeoJSONToSVGService {

    private readonly xmlTagService = new XMLTagService();

    public mapFeatureCollection<Properties>(
        collection: FeatureCollection<Properties>,
        collectionOptions?: XMLBaseOptions<string>,
        staticFeatureOptions?: IntersectionOfPolygonAndLineOptions,
        dynamicFeatureOptions?: (feature: Feature<Properties>) => IntersectionOfPolygonAndLineOptions
    ): XML<'g'> {
        const svgs: XML<XMLTagBase>[] = [];
        collection.features.forEach(feature => {
            const opt = dynamicFeatureOptions
                ? {
                    ...staticFeatureOptions,
                    ...dynamicFeatureOptions(feature)
                } : staticFeatureOptions;
            // Explicitly compare to false since we *want* to render the element
            // if opt?.display is undefined
            if (opt?.display !== false) {
                const svg = this.mapFeature(feature, {
                    options: opt
                });
                svgs.push(svg);
            }
        });
        return this.xmlTagService.create('g', {
            childs: svgs,
            options: collectionOptions
        });
    }

    public mapFeature<Properties>(
        feature: Feature<Properties>,
        params?: IntersectionOfPolygonAndLine
    ): XML<'g'> {
        const svgs: XML<'path'>[] = [];
        const type = feature.geometry.type;
        switch (type) {
            case 'Polygon': {
                this.mapPolygon(feature as Polygon<Properties & LocationProperties>, params).forEach(svg => svgs.push(svg));
                break;
            }
            case 'MultiPolygon': {
                this.mapMultiPolygon(feature as MultiPolygon<Properties & LocationProperties>, params).forEach(svg => svgs.push(svg));
                break;
            }
            case 'LineString': {
                this.mapLineString(feature as LineString<Properties>, params).forEach(svg => svgs.push(svg));
                break;
            }
            case 'MultiLineString': {
                this.mapMultiLineString(feature as MultiLineString<Properties>, params).forEach(svg => svgs.push(svg));
                break;
            }
            default: {
                const message = type + ' nicht definiert!';
                console.error(message);
                throw message;
            }
        }
        return this.xmlTagService.create('g', {
            childs: svgs
        });
    }

    public mapLineString<Properties>(
        lineString: LineString<Properties>,
        params?: IntersectionOfPolygonAndLine
    ): XML<'path'>[] {
        const svgs: XML<'path'>[] = [];
        const svg = this.mapCoordinatesToLineString(lineString.geometry.coordinates, params);
        svgs.push(svg);
        return svgs;
    }

    public mapPolygon<Properties extends { NAME?: string }>(
        polygon: Polygon<Properties>,
        params?: IntersectionOfPolygonAndLine
    ): XML<'path'>[] {
        const id: (`polygon-${string}` | undefined)
            = polygon.properties.NAME ? `polygon-${polygon.properties.NAME}` : undefined;
        const svgs: XML<'path'>[] = [
            this.mapCoordinatesToPolygonalPath(polygon.geometry.coordinates, params, id)
        ];
        return svgs;
    }

    public mapMultiLineString<Properties>(
        lineString: MultiLineString<Properties>,
        params?: IntersectionOfPolygonAndLine
    ): XML<'path'>[] {
        const svgs: XML<'path'>[] = [];
        lineString.geometry.coordinates.forEach(coordinates => {
            const svg = this.mapCoordinatesToLineString(coordinates, params);
            svgs.push(svg);
        });
        return svgs;
    }

    public mapMultiPolygon<Properties extends { NAME?: string }>(
        multiPolygon: MultiPolygon<Properties>,
        params?: IntersectionOfPolygonAndLine
    ): XML<'path'>[] {
        const svgs: XML<'path'>[] = [];
        multiPolygon.geometry.coordinates.forEach((coordinates, index) => {
            const id: (`polygon-${string}` | undefined)
                = multiPolygon.properties.NAME ? `polygon-${multiPolygon.properties.NAME}-${index}` : undefined;

            const svg = this.mapCoordinatesToPolygonalPath(coordinates, params);
            svgs.push(svg);
        });
        return svgs;
    }

    public mapCoordinatesToLineString<Properties>(
        coordinates: [number, number][],
        params?: IntersectionOfPolygonAndLine
    ): XML<'path'> {
        const d = 'M ' + coordinates.map(coordinate => {
            const [x, y] = coordinate;
            return x + ',' + y;
        }).join(' L ');
        return this.xmlTagService.create('path', {
            options: {
                ...params?.options,
                d,
            }
        });
    }

    public mapCoordinatesToPolygonalPath<Properties>(
        coordinates: [number, number][][],
        params?: IntersectionOfPolygonAndLine,
        id?: `polygon-${string}` | undefined
    ): XML<'path'> {
        const d = coordinates.map(loop => {
            return "M" + loop.map(point => {
                const [x, y] = point;
                return x + " " + y
            }).join(" L")
        }).join(" ")
        return this.xmlTagService.create('path', {
            options: {
                ...params?.options,
                d,
                id
            },
        });
    }

}