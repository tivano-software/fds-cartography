import { Settings } from "../../../conf/settings.const";
import { XML, XMLTagService } from "../../../util/services/xml-tag-service";
import { FilterData } from "../view-models/settings/filter-data";


// recursively replaces <i>...</i> and <b>...</b> with <tspan ...>...</tspan>
// and strips out all other HTML elements
function svgText(node: Node): string {
    const tspan =
        node.nodeName == "I" ? "<tspan font-style='italic'>" :
        node.nodeName == "B" ? "<tspan font-weight='bold'>" :
        undefined;
    const content =
        node.nodeValue ? node.nodeValue :
        node.childNodes ? Array.from(node.childNodes).map(svgText).join("") :
        ""
    return tspan
        ? tspan + content + "</tspan>"
        : content;
}
export function svgGLegend(index: number, filter: FilterData): XML<'g'> {
    const xmlTagService = new XMLTagService();
    const entrySize = Settings.map.legend.entrySize;
    const lineHeight = entrySize * Settings.map.legend.entryDistanceFactor;
    const yOffset = index * lineHeight + Settings.map.legend.yOffset;
    const xOffset = Settings.map.legend.yOffset + 100;

    const htmlDiv = document.createElement("div");
    htmlDiv.innerHTML = filter.customName();
    const g = xmlTagService.create('g', {
        childs: [
            xmlTagService.create('circle', {
                options: {
                    'fill': filter.colorPieChart(),
                    'r': entrySize / 2,
                    'cx': entrySize / 2,
                    'cy': (entrySize-lineHeight) / 2,
                }
            }),
            xmlTagService.create('text', {
                options: {
                    x: entrySize * Settings.map.legend.entryDistanceFactor,
                    y: entrySize / 4,
                    height: entrySize,
                    class: 'standardFont'
                },
                value: svgText(htmlDiv)
            }),
        ],
        options: {
            transform: `translate(${xOffset}, ${yOffset})`,
            'font-family': 'sans-serif'
        }
    });
    return g;
}