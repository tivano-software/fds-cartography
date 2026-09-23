import { ObservableNotNull } from "../../../util/knockout/lib/knockout.interface";

export class MouseEditClusterController {

    constructor(
        private readonly objects: {
            visible: ObservableNotNull<boolean>
            x: ObservableNotNull<number>,
            y: ObservableNotNull<number>,
            mapCoordinatesFromGlobalToSVG: (x: number, y: number) => [number, number],
        },
    ) {}

    init(): void {
        const element = document.getElementById('clusterSvg');
        if (element !== null) {
            element.addEventListener('mousedown', (event: MouseEvent) => {
                const [x, y] = this.objects.mapCoordinatesFromGlobalToSVG(event.x, event.y);
                this.objects.x(x);
                this.objects.y(y);
                this.objects.visible(true);
            });
            element.addEventListener('mouseup', (ev: Event) => {
                this.objects.visible(false);
            });
            element.addEventListener('mouseleave', (ev: Event) => {
                this.objects.visible(false);
            });
            element.addEventListener('mousemove', (ev: MouseEvent) => {
                if(this.objects.visible()) {
                    this.onMove(ev);
                }
            });
        }
    }

    private onMove(event: MouseEvent): void {
        const [x, y] = this.objects.mapCoordinatesFromGlobalToSVG(event.x, event.y);
        this.objects.x(x);
        this.objects.y(y);
    }
}