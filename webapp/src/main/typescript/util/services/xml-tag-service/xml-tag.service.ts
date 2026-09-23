import { XMLBaseOptions, XMLStrokeOptions, XMLTransformOptions } from "./xml-options/xml-option-interfaces";
import { XMLOptionsContainer } from "./xml-types/xml-options-container.type";
import { XMLTag, XMLTagBase } from "./xml-tag.type";
import { XMLChildContainer } from "./xml-types/xml-child-container.type";
import { XMLValueContainer } from "./xml-types/xml-value-container.type";
import { XML } from "./xml-types/xml.type";
import { XMLString } from "./helper-types/xml-string";

export class XMLTagService {

    public createDefs(childs: XML<"symbol">[]): XML<"defs"> {
        return this.create('defs', {
            childs,
            options: {}
        });
    }

    public createG(childs: XML<XMLTagBase>[],  options?: (XMLTransformOptions & XMLBaseOptions<string> & XMLStrokeOptions)): XML<"g"> {
        return this.create('g', { childs, options });
    }

    public create<Tag extends XMLTag>(
        tag: XMLTag & Tag,
        params: XMLChildContainer<Tag> & XMLOptionsContainer<Tag> & XMLValueContainer
    ): XML<Tag> {
        return {
            tag,
            ...params
        }
    }

    public xmlListToString(xmls: XML<XMLTag>[]): string {
        return xmls.map(xml => this.xmlToString(xml)).reduce<string>((pr, cu) => pr + cu, "");
    }

    public xmlToString<Tag extends XMLTag>(xml: XML<Tag>): XMLString<Tag> {
        if (typeof xml === 'string') {
            return xml;
        }
        const childs = this.extractChilds(xml);
        const options = this.extractOptions(xml);
        const value = this.extractValue(xml);
        const tag = xml.tag;
        if (childs === undefined && value === undefined) {
            return `<${tag} ${options}/>`;
        } else {
            if (childs === undefined) {
                return `<${tag} ${options}>${value}</${tag}>`;
            }
            if (value === undefined) {
                return `<${tag} ${options}>${childs}</${tag}>`;
            }
            return `<${tag} ${options}>${value} ${childs}</${tag}>`;
        }
    }

    private extractValue(xml: XMLValueContainer): string | undefined {
        return xml.value;
    }

    private extractChilds<Tag extends XMLTag>(xml: XML<Tag>): string | undefined {
        if ('childs' in xml) {
            return (xml as { childs: XML<XMLTag>[] }).childs
                .map(child => '\t' + this.xmlToString(child))
                .join('\n');
        } else {
            return undefined;
        }
    }

    private extractOptions<Tag extends XMLTag>(xml: XML<Tag>): string {
        if ('options' in xml) {
            const options = (xml as { options: any }).options;
            var result = '';
            for (const option in options) {
                const val = options[option];
                if (val) {
                    result = result + ' ' + option + '="' + val + '" ';
                }
            }
            return result;
        } else {
            return '';
        }
    }
}
