import { Letter } from "./letter.type";

export type FileNameSuffixImageString = 'svg' | 'png';
export type FileNameSuffixString = 'csv' | 'json' | 'html' | FileNameSuffixImageString;
export type FileNameString<Suffix extends FileNameSuffixString> = `${string}.${Suffix}`;
export type FileNameStringJSON = FileNameString<'json'>;
export type FileNameStringCSV = FileNameString<'csv'>;
export type FileNameStringHTML = FileNameString<'html'>;

export type InnerPathString = `${Letter}${string}/`;

export type URLPrefixString = `${'http://' | 'https://'}${string}`;
export type URLParamString<Base extends FileNameStringHTML> = `${Base}?${string}`;
