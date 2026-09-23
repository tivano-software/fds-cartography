export type XMLHtml = 'span' | 'i' | 'a' | 'div';
export type XMLClippath = 'clipPath';
export type XMLStyle = 'style';
export type XMLTagBase  = 'image'
    | 'g'
    | 'path'
    | 'polygon'
    | 'svg'
    | 'use'
    | XMLClippath
;
export type XMLTagForms = 'circle'
    | 'rect'
    | 'text'
;
export type XMLTagDefs  = 'defs';
export type XMLForeignObject = 'foreignObject';
export type XMLTagSymbol = 'symbol';
export type XMLTagMetadata = 'metadata';
export type XMLTagMetadataContent = 'ch:location' | 'ch:absolut' | 'ch:relativ' | 'ch:distance' | 'ch:entries' | 'ch:entry' | 'ch:token' | 'ch:city' | 'ch:color';
export type XMLTag = XMLTagBase
    | XMLTagDefs
    | XMLTagSymbol
    | XMLTagForms
    | XMLTagMetadata
    | XMLTagMetadataContent
    | XMLClippath
    | XMLHtml
    | XMLForeignObject
    | XMLStyle
;