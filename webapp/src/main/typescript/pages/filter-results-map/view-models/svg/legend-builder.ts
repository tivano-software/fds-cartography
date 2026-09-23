import { Settings } from "../../../../conf/settings.const";
import { Styles } from "../../../../conf/styles.const";
import { XML, XMLTagService } from "../../../../util/services/xml-tag-service";


export class LegendBuilder {

    public static readonly ID_LEGEND_BORDER = "legend-border";
    public static readonly ID_LEGEND_CONTAINER = "legend-container";
    private static readonly PADDING = 2;
    private elementLegend: HTMLElement | null = null;

    public constructor() {}

    public buildLegendBorder(): void {
        console.log('Start adapt border');
        const elementLegendTemp = document.getElementById('legend');
        if (this.elementLegend === elementLegendTemp) {
            return;
        }
        this.elementLegend = elementLegendTemp;
        if (!this.elementLegend) {
            return;
        }
        this.removeById(LegendBuilder.ID_LEGEND_BORDER);
        const bbox = (this.elementLegend as unknown as SVGGElement).getBBox();
        const border = this.createBorderElement(bbox);
        this.append(border);
        console.log("Legende Hat sich geändert.");
    };

    public buildLegend(legends: XML<'g'>[]): void {
        const xmlTagService = new XMLTagService();
        const legend = xmlTagService.create('g', {
            options: {
                'id': 'legend',
                'transform': `translate(30, ${Settings.map.legend.entrySize * 0.75})`,
            },
            childs: legends
        });
        const svg = xmlTagService.xmlToString(legend);
        const container = document.createElementNS("http://www.w3.org/2000/svg", "g");
        container.setAttribute('id', LegendBuilder.ID_LEGEND_CONTAINER);
        container.innerHTML = svg;
        this.removeById(LegendBuilder.ID_LEGEND_CONTAINER);
        this.append(container);
    }

    public removeBorder() {
        this.removeById(LegendBuilder.ID_LEGEND_BORDER);
    }

    private removeById(id: string) {
        const legendBorder = document.getElementById(id);
        const elementLegendWrapper = this.getElementWrapper();
        if (!elementLegendWrapper || !legendBorder) {
            return;
        }
        elementLegendWrapper.removeChild(legendBorder);
    }

    private append(border: SVGElement) {
        const elementLegendWrapper = this.getElementWrapper();
        if (!elementLegendWrapper) {
            return;
        }
        elementLegendWrapper.insertBefore(border, elementLegendWrapper.firstChild);
    }

    private createBorderElement(bbox: DOMRect): SVGRectElement {
        const xDefault = 135;
        const yDefault = 5;
        const border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        border.setAttribute("id", LegendBuilder.ID_LEGEND_BORDER);
        border.setAttribute("x", (xDefault - LegendBuilder.PADDING).toString());
        border.setAttribute("y", (yDefault - LegendBuilder.PADDING).toString());
        border.setAttribute("width", (bbox.width + 2 * LegendBuilder.PADDING).toString());
        border.setAttribute("height", (bbox.height + 2 * LegendBuilder.PADDING).toString());
        border.setAttribute("fill", "white");
        border.setAttribute("stroke", Styles.map.border.color);
        return border;
    }

    private getElementWrapper(): HTMLElement | null {
        return document.getElementById('legend-border-frame');
    }

}