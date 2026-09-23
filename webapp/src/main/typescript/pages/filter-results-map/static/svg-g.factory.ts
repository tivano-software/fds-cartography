import { XML, XMLTagService } from "../../../util/services/xml-tag-service";



export function svgGDefault(): XML<'g'> {
    const xmlTagService = new XMLTagService()
    const g = xmlTagService.create('g', {
        childs: [],
        options: {}
    });
    return g;
}