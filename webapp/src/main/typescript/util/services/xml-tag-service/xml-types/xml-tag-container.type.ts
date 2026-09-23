import { XMLTag } from "../xml-tag.type";

export type XMLTagContainer<Tag extends XMLTag> = { tag: Tag & string };
