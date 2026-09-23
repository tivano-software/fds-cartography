import { ObservableNotNull } from "../../../../util/knockout/lib/knockout.interface";
import { AREA_COLORING_CLASS } from "../../static/svg-area-coloring.factory";
import { CITY_CLASS } from "../../view-models/svg/cities-svg/city-svg.factory";
import { Metadata } from "./metadata.interface";

export class HoverTokensController {

    constructor(private readonly observable: ObservableNotNull<string>) { }

    public init(): void {
        this.initPieChart();
        this.initAreaColoring();
        this.initCitites();
    }

    public initCitites(): void {
        const htmlElementsCollection = document.getElementsByClassName(CITY_CLASS) as HTMLCollectionOf<SVGUseElement>;
        const htmlElements = htmlCollectionToList(htmlElementsCollection);
        htmlElements.forEach(val => {
            const city = val.getElementsByTagName('ch:city').item(0);
            if (city !== null) {
                let text = city.textContent;
                val.addEventListener('mouseover', () => {
                    this.observable(`<div class="card"><h5 class="card-header">${text}</h5></div>`);
                });
            } else {
                console.log("nicht gefunden!:", val);
            }
        });
    }

    public initAreaColoring(): void {
        const htmlElementsCollection: HTMLCollectionOf<Element> = document.getElementsByClassName(AREA_COLORING_CLASS);
        const htmlElements = htmlCollectionToList(htmlElementsCollection);
        htmlElements.forEach(val => {
            const pathes = val.getElementsByTagName('path');
            const pathList = htmlCollectionToList(pathes);
            const metadata = this.extractMetaDataObject(val);
            return metadata && pathList.forEach(elem => elem && this.enrich(elem, metadata));
        });
    }

    public initPieChart(): void {
        const useTagsCollection: HTMLCollectionOf<SVGUseElement> = document.getElementsByTagName('use');
        const useTagsList = htmlCollectionToList(useTagsCollection);
        useTagsList.forEach(elem => {
            const metadata = this.extractMetaDataObject(elem);
            metadata && elem && this.enrich(elem, metadata);
        });
    }

    private enrich<A extends SVGUseElement | SVGPathElement>(elem: A, metadata: Metadata): void {
        elem.addEventListener('mouseover', (event) => {
            this.setTokenInfoOnStatusBar(event.target as SVGUseElement, metadata);
        });
        elem.addEventListener('mouseleave', () => this.setStatusBarEmpty());
    }

    private setStatusBarEmpty(): void {
        this.observable('');
    }

    private setTokenInfoOnStatusBar(element: SVGUseElement, metadata: Metadata): void {
        const val = `
            <h5 class="card-header">${metadata.location}</h5>
            <ul class="list-group list-group-flush">` + metadata.entries.map(data => {
                let details = "";
                if (data.absolute !== undefined) {
                    details += ` ${data.absolute} `;
                }
                if (data.relativ !== undefined) {
                    const percent = Math.round(data.relativ * 10000) / 100;
                    details += data.absolute===undefined?` ${percent}% `:` (${percent}%)`;
                }
                if (data.distance !== undefined) {
                    details+= ` Distanz ${data.distance}`;
                }
                return `<li class="list-group-item"><i>${data.token}</i>:${details}</li>`;
            }).join('') + `</ul>`;
        this.observable(`<div class="card">${val}</div>`);
    }

    private extractMetaData(element: Element): Element[] {
        const metadata: SVGMetadataElement = htmlCollectionToList(element.children)
            .find(elem => elem.tagName === 'metadata') as SVGMetadataElement;
        const data: Element[] = htmlCollectionToList(metadata.children);
        return data;
    }

    private extractMetaDataObject(element: Element): Metadata | undefined {
        const getElement = function (elements: Element[], key: string): Element | undefined {
            const element: Element | undefined = elements.find(data => data.tagName === key);
            return element;
        };
        const getVal = function <A extends number | string>(elements: Element[], key: string, defaultVal: A): A {
            const element = getElement(elements, key);
            const val = element && element.textContent ? element.textContent : defaultVal;
            return (typeof defaultVal === 'number') ? +val as A : val as A
        }
        const getOptNum = function(elements: Element[], key: string): number | undefined {
            const element = getElement(elements, key);
            const val = element && element.textContent ? element.textContent : undefined;
            return val === undefined ? undefined : +val
        }
        const metadataElements = this.extractMetaData(element);
        if (getVal<string>(metadataElements, 'ch:location', '') === '') {
            return undefined;
        }
        const entriesElement = getElement(metadataElements, 'ch:entries');
        const entriesElements = entriesElement && entriesElement.children ? htmlCollectionToList(entriesElement.children) : [];
        const entries = entriesElements.map(inner => {
            const content = htmlCollectionToList(inner.children);
            const distance = getOptNum(content, 'ch:distance')
            return {
                token: getVal<string>(content, 'ch:token', ''),
                absolute: getVal<number>(content, 'ch:absolut', 0),
                relativ: getVal<number>(content, 'ch:relativ', 0),
                distance: distance === undefined ? distance : Math.round(distance*1000)/1000
            };
        });
        return {
            location: getVal<string>(metadataElements, 'ch:location', ''),
            absolute: getVal<number>(metadataElements, 'ch:absolut', 0),
            relativ: getVal<number>(metadataElements, 'ch:relativ', 0),
            entries
        };
    }

}

function htmlCollectionToList<A extends Element>(collection: HTMLCollectionOf<A>): A[] {
    const result: A[] = [];
    for (var i = 0; i < collection.length; i++) {
        const elem = collection[i];
        result.push(elem);
    }
    return result;
}