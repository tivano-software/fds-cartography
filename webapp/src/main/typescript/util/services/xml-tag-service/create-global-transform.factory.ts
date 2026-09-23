
export function createGlobalTransform(options: {
    scale?: {
        x: number,
        y: number
    },
    size?: {
        scale: number
    },
    translate?: {
        x: number,
        y: number
    }
}[]): string {
    var result = '';
    for (const option of options) {
        if (option.scale) {
            result += 'scale(' + option.scale.x + ' ' + option.scale.y + ') ';
        }
        if (option.size) {
            result += 'scale(' + option.size.scale + ') ';
        }
        if (option.translate) {
            result += 'translate(' + option.translate.x + ', ' + option.translate.y + ') ';
        }
    }
    return result
}