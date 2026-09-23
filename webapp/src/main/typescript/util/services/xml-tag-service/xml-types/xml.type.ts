import { XMLOptionsContainer } from "./xml-options-container.type";
import { XMLTag } from "../xml-tag.type";
import { XMLChildContainer } from "./xml-child-container.type";
import { XMLTagContainer } from "./xml-tag-container.type";
import { XMLValueContainer } from "./xml-value-container.type";


export type XML<Tag extends XMLTag> =
    XMLTagContainer<Tag>
    & XMLChildContainer<Tag>
    & XMLOptionsContainer<Tag>
    & XMLValueContainer
    ;

export type XMLSymbol = XML<'symbol'>;
