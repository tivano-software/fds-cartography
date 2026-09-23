
import { XML, XMLTagService } from "../../../util/services/xml-tag-service";

export function createSvgCircleId(size: number, key: string): `circle-${string}` {
    return  `circle-${key}-${size}`;
}

export function createSvgCircleIdRef(size: number, key: string): `#circle-${string}` {
    return  `#${createSvgCircleId(size, key)}`;
}

export function svgCircle(size: number, key: string): XML<"circle"> {
    const xmlTagService = new XMLTagService();
    const id = createSvgCircleId(size, key);
    const circle = xmlTagService.create('circle', {
        options: {
            'id': id,
            'cx': 0,
            'cy': 0,
            'r': size,
            'fill': 'red',
            'stroke': "none",
            'stroke-width': 0,
            'fill-opacity': 0.5,
        }
    });
    return circle;
}