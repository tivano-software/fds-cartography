

export function iteratorToList<Val>(iterator: IterableIterator<Val>): Val[] {
    return Array.from(iterator);
}