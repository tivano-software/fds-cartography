import { KeyValueString } from "./key-value-string.type";

export type DataBindStringAttr = `attr: { ${KeyValueString | `${KeyValueString}, ${KeyValueString}` | `${KeyValueString}, ${KeyValueString}, ${KeyValueString}`} }`;
export type DataBindString = DataBindStringAttr;

