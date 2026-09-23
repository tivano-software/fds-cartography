import { createZoom, SVG_ZOOM_FACTOR } from "../static/meta.data";
import { ViewModel } from "../view-models/view-model";


export class MoveMapController {

    private mousedown: boolean = false;

    constructor(
        private readonly viewModel: ViewModel,
    ) {}

    init(): void {
        const element = document.getElementById('map-div');
        if (element !== null) {
            element.addEventListener('mousedown', (ev: Event) => {
                this.mousedown = true;
            });
            element.addEventListener('mouseup', (ev: Event) => {
                this.mousedown = false;
            });
            element.addEventListener('mouseleave', (ev: Event) => {
                this.mousedown = false;
            });
            element.addEventListener('wheel', (ev: WheelEvent) => {
                ev.preventDefault();
                this.onScroll(ev);
            });
            element.addEventListener('mousemove', (ev: MouseEvent) => {
                if(this.mousedown) {
                    this.onMove(ev);
                }
            });
        }
    }

    public navZoom(delta: number): void {
        const zoom = this.viewModel.svg.settings.navigation.zoom();
        const newZoom = createZoom(zoom - 2 * delta);
        if (!isNaN(newZoom)) {
            this.viewModel.svg.settings.navigation.zoom(newZoom);
        }
    }

    public navMove(deltaX: number, deltaY: number): void {
        const offsetX = this.viewModel.svg.settings.navigation.offsetX();
        this.viewModel.svg.settings.navigation.offsetX(offsetX + deltaX);
        const offsetY = this.viewModel.svg.settings.navigation.offsetY();
        this.viewModel.svg.settings.navigation.offsetY(offsetY + deltaY);
    }

    private onScroll(ev: WheelEvent): void {
        const stepZoom = this.stepZoom;
        const elementP = document.getElementById('bodyID');
        const scrollDirection = 1;
        if (ev.deltaY > 1) {
            this.navZoom(scrollDirection * stepZoom);
        } else {
            this.navZoom(-scrollDirection * stepZoom);
        }
    }

    private onMove(event: any): void {
        const moveDirection = 1;
        const directionX = moveDirection * (event.movementX || event.mozMovementX || event.webkitMovementX || 0) / SVG_ZOOM_FACTOR;
        const directionY = -moveDirection * (event.movementY || event.mozMovementY || event.webkitMovementY || 0) / SVG_ZOOM_FACTOR;
        this.navMove(directionX, directionY);
    }

    public get stepZoom(): number {
        return 5 * 200 / SVG_ZOOM_FACTOR;
    }

    public get stepMove(): number {
        return 7 / SVG_ZOOM_FACTOR;
    }

}
