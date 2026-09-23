import { LocationProperties } from "../../../util/services/geojson/geojson-load.service";
import { GeoJSONToSVGService } from "../../../util/services/geojson/geojson-to-svg.service";
import { XML, XMLTagService } from "../../../util/services/xml-tag-service";
import { XMLTagMetadataContent } from "../../../util/services/xml-tag-service/xml-tag.type";
import { Color } from "../../../util/types/color/color.type";
import { GeometryData } from "../view-models/data/map-data-item";

export const AREA_COLORING_CLASS = 'AREA_COLORING_CLASS_53cab9841f9f0253e0ba1ab38337910c7930d98d';

export function createAreaColoring(
    val: GeometryData,
    color: Color,
    opacity: number
): XML<"g"> {
    const xmlTagService = new XMLTagService()
    const geoJSONToSVGService = new GeoJSONToSVGService();
    let xml = geoJSONToSVGService.mapFeature<LocationProperties>(
        val.geometry.geoJSON,
        {
            options: {
                'fill': color,
                'fill-opacity': opacity
            }
        },
    );
    const metadata = xmlTagService.create('metadata', {
        childs: [
            xmlTagService.create('ch:color', {
                value: color
            }),
            xmlTagService.create('ch:location', {
                value: val.label
            }),
            xmlTagService.create('ch:absolut', {
                value: val.data.totalAbs + ''
            }),
            xmlTagService.create('ch:relativ', {
                value: val.data.totalRel + ''
            }),
            xmlTagService.create('ch:entries', {
                childs: val.data.entries.map(val => {
                    let details: XML<XMLTagMetadataContent>[] = [
                        xmlTagService.create('ch:token', {
                            value: val.label
                        })
                    ];
                    if (val.tokensAbs !== undefined) {
                        details.push(xmlTagService.create('ch:absolut', { value: `${val.tokensAbs}`}));
                    }
                    if (val.tokensRel !== undefined) {
                        details.push(xmlTagService.create('ch:relativ', { value: `${val.tokensRel}`}));
                    }
                    if (val.distance !== undefined) {
                        details.push(xmlTagService.create('ch:distance', { value: `${val.distance}`}));
                    }
                    return xmlTagService.create('ch:entry', { childs: details});
                })
            })
        ]
    });
    xml.childs.push(metadata);
    xml = Object.assign(xml, {
        options: {
            class: AREA_COLORING_CLASS
        }
    });
    return xml;
}