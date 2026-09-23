import { XMLTag } from "../xml-tag.type"

export type XMLSimpleString<Tag extends XMLTag> = `<${Tag} ${string}/>`;
export type XMLOpenClosedString<Tag extends XMLTag> = `<${Tag} ${string}>${string}</${Tag}>`;
export type XMLString<Tag extends XMLTag> = XMLSimpleString<Tag> | XMLOpenClosedString<Tag>;