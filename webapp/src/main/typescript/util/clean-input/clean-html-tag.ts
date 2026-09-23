

const REGEX_B_TAG: [RegExp, RegExp] = [/<b[^>]*>/g, /<\/b>/g];
const REGEX_I_TAG: [RegExp, RegExp] = [/<i[^>]*>/g, /<\/i>/g];

const MAGIC_B = "§§§B38493§§§"
const MAGIC_I = "§§§I93403§§§"

const MAGIC_B_PLACEHOLDER: [string, string] = [`OPEN_${MAGIC_B}`, `CLOSE_${MAGIC_B}`];
const MAGIC_I_PLACEHOLDER: [string, string] = [`OPEN_${MAGIC_I}`, `CLOSE_${MAGIC_I}`];

export function cleanHtmlTags(val: string): string {
    const replace: [[RegExp, RegExp], [string, string], [string, string]][] = [
        [REGEX_B_TAG, MAGIC_B_PLACEHOLDER, ["<b>", "</b>"]],
        [REGEX_I_TAG, MAGIC_I_PLACEHOLDER, ["<i>", "</i>"]]
    ];
    for (const [regex, magic, _] of replace) {
        val = val.replace(regex[0], magic[0]);
        val = val.replace(regex[1], magic[1]);
    }

    val = val.replace(/<[^>]*>/g, '');

    for (const [_, magic, tag] of replace) {
        val = val.replace(magic[0], tag[0]);
        val = val.replace(magic[1], tag[1]);
    }

    return val;
}