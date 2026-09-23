
export class InterpolationService {
    public interpolate(
        val: number,
        rangeSettings: { min: number, max: number},
        spanGiven: number
    ): number {
        const max = +rangeSettings.max;
        const min = +rangeSettings.min;
        const spanSettings = Math.abs(max - min);
        const tranformedSize = (spanSettings * val / spanGiven) + min;
        return tranformedSize;
    }
}