
export type HexNum = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
export type HexAlph = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'a' | 'b' | 'c' | 'd' | 'e' | 'f';
export type HexAlph2 = `${HexAlph}${HexAlph}`;


export type ColorStatic = 'black' | 'blue' | 'red' | '#94c7dc' | 'none' | 'white';
export type Color = ColorStatic | `#${string}`;

export function createColor(p1: HexAlph2, p2: HexAlph2, p3: HexAlph2): Color {
    const hex = p1 + p2 + p3;
    return `#${hex}`;
}
