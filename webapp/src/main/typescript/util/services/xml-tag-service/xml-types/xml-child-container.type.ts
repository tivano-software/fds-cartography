import { XML } from "..";
import { XMLForeignObject, XMLHtml, XMLStyle, XMLTag, XMLTagBase, XMLTagForms, XMLTagMetadata, XMLTagMetadataContent, XMLTagSymbol } from "../xml-tag.type";


export type XMLChildContainer<Tag extends XMLTag> =
    Tag extends 'svg' ? { childs: XML<XMLTag>[] } :
    Tag extends 'clipPath' ? { childs: XML<XMLTag>[] } :
    Tag extends 'g' ? { childs: XML<XMLTagBase | XMLTagForms | XMLTagMetadata | XMLForeignObject>[] } :
    Tag extends 'defs' ? { childs: XML<XMLTagSymbol>[] } :
    Tag extends 'symbol' ? { childs: XML<XMLTagForms | 'g'>[] } :
    Tag extends 'use' ? { childs: XML<XMLTagMetadata | 'a'>[] } :
    Tag extends 'metadata' ? { childs: XML<XMLTagMetadataContent>[] } :
    Tag extends 'ch:entries' | 'ch:entry' ? { childs: XML<XMLTagMetadataContent>[] } :
    Tag extends 'foreignObject' ? { childs: XML<XMLHtml>[] } :
    Tag extends XMLHtml ? { childs?: XML<XMLHtml>[] } :
    Tag extends 'image' | 'path' | 'polygon' | XMLTagForms | XMLTagMetadataContent | XMLHtml | XMLStyle ? {} : never;