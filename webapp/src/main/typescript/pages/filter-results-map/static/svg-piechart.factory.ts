import { XML, XMLTagService } from "../../../util/services/xml-tag-service";
import { Color } from "../../../util/types/color/color.type";
import { createSvgCircleId } from "./svg-circle.factory";

export interface SVGPiechartData {
    volume: number,
    tokens: number,
    color: Color
}

export const SVG_PIECHART_SIZE_SCALE = 0.5;
export const SVG_REL_PIECHART_FACTOR = 10000;
const xmlTagService = new XMLTagService();


export function svgPiechart(inputSize: number, key: string, piechartData: SVGPiechartData[]): XML<'g'> {
    const size = inputSize * SVG_PIECHART_SIZE_SCALE;
    const borderWidth = 0.33;
    const borderRadius = size;
    const piechartDataNotEmpty = piechartData.filter(info => info.volume !== 0);
    if (piechartDataNotEmpty.length == 0) {
        console.log(`Skip ${key} with size ${key}.`);
        return xmlTagService.createG([], {});
    }
    const onlyOnePieSlice = piechartDataNotEmpty.length == 1;
    const borderCircle = xmlTagService.create('path', {
        options: {
            'id': createSvgCircleId(inputSize, key),
            'class': 'outline',
            'stroke-width': borderWidth,
            'stroke': 'white',
            // We want to draw a circle, but that does not really work with a single arc (and a half circle does not work well either).
            // And we can't use a <circle> tag because some broken graphics programs (e.g. Adobe Illustrator) don't properly
            // handle scaling for <circle> when the scaling is inside a <symbol> tag.
            // So, we resort to drawing a quarter circle followed by a three-quarters-circle
            'd': `M 0 ${borderRadius} A ${borderRadius} ${borderRadius} 0 0 0 ${borderRadius} 0 A ${borderRadius} ${borderRadius} 0 1 0 0 ${borderRadius} Z`,
            // if there is only one item to display, just fill the whole circle.
            // otherwise, leave the circle unfilled and draw pie slices on top
            'fill': onlyOnePieSlice ? piechartDataNotEmpty[0].color : 'none',
            'fill-opacity': 1
        }
    });
    const piechart = xmlTagService.create('g', {
        childs: onlyOnePieSlice
            ? [ borderCircle ]
            : [ ...svgPiechartParts(piechartDataNotEmpty, size), borderCircle ]
    });
    return piechart;
}

function svgPiechartSinglePart(color: Color, radius: number, startAngle: number, sweepAngle: number): XML<'path'> {
    const endAngle = startAngle + sweepAngle;
    const largeArcFlag = sweepAngle > Math.PI ? 1 : 0
    const startX = radius * Math.cos(endAngle)
    const startY = radius * Math.sin(endAngle);
    const endX = radius * Math.cos(startAngle);
    const endY = radius * Math.sin(startAngle);
    return xmlTagService.create('path', {
        options: {
            'stroke': 'none',
            'fill-opacity': 1,
            'fill': color,
            'd': `M 0,0 L ${startX},${startY} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${endX},${endY} Z`
        }
    });
}

function svgPiechartParts(metaInfos: SVGPiechartData[], radius: number): XML<"path">[] {
    const CIRCLE_RADIANS = 2 * Math.PI;
    const sum = (x: number, y: number) => x + y;
    const volumeTotal = metaInfos.map(info => info.volume).reduce(sum, 0);
    var currentAngle = -Math.PI/2;
    const mapped = metaInfos
        .map(info => {
            const result = {
                color: info.color,
                angle: info.volume / volumeTotal * CIRCLE_RADIANS,
                start: currentAngle
            };
            currentAngle += result.angle;
            return result;
        })
        .map(info => svgPiechartSinglePart(info.color, radius, info.start, info.angle));
    return mapped;
}