
export type NumberStringStart =
    '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
export type NumberString1 =
    '0' | NumberStringStart;
export type NumberString2 =
    `${NumberStringStart}${NumberString1}`;
export type NumberString3 =
    `${NumberStringStart}${NumberString1}${NumberString1}`;
export type NumberString4 =
    `${NumberStringStart}${NumberString1}${NumberString1}${NumberString1}`;
export type NumberString5 =
    `${NumberStringStart}${NumberString1}${NumberString1}${NumberString1}${NumberString1}`;

export type NumberString = NumberString1 | NumberString2 | NumberString3 | NumberString4 | NumberString5;