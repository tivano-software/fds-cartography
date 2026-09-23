import { Knockout } from "../../../../util/knockout";
import { ComputedNotNull } from "../../../../util/knockout/lib/knockout.interface";
import { createGlobalTransform, XML, XMLTagService } from "../../../../util/services/xml-tag-service";
import { Point2 } from "../../../../util/types/geometry/point2.type";
import { META_DATA } from "../../static/meta.data";
import { SVGSettingObservable } from "../settings/svg-setting.observable";
import { SVGObservable } from "./svg.observable";
import { ToSVGable } from "./to-svg-able";

export class SVGReliefObservable extends ToSVGable<'g', 'map-image'> {
    private readonly xmlTagService = new XMLTagService();
    public readonly toSVG: ComputedNotNull<XML<"g">>;

    constructor(
        public readonly ko: Knockout,
        public readonly map: SVGObservable
    ) {
        super(ko);
        this.toSVG = ko.computed(() => {
            const metaData = META_DATA(this.map.zoom, this.map.translate);
            const width = metaData.image.width;
            const height = metaData.image.height;
            const x = metaData.image.x;
            const y = metaData.image.y;
            const opacity = this.map.settings.cardElements.backgroundOpacity() / 100;
            const svg = this.xmlTagService.create('g', {
                options: {
                    id: this.id,
                    transform: createGlobalTransform([
                        {
                            scale: {
                                x: metaData.image.transformation.scale.x,
                                y: metaData.image.transformation.scale.y
                            }
                        }
                    ])
                },
                childs: [
                    this.xmlTagService.create('image', {
                        options: {
                            href: metaData.imageUrl,
                            width,
                            height,
                            x,
                            y,
                            opacity: opacity
                        }
                    })
                ]
            });
            return svg;
        });
    }

    get id(): "map-image" {
        return 'map-image';
    }
    get idHref(): "#map-image" {
        return '#map-image';
    }

    public clear(): void {}

    public async init(): Promise<void> {}
}