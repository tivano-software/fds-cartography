import { ToHref } from "./to-href.type";

export const toHref = <Id extends string>(id: Id): ToHref<Id> => `#${id}`;