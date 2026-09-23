import { Computed, ComputedNotNull, Knockout, Observable, ObservableArray, ObservableNotNull, Subscribable } from "../../../util/knockout/lib/knockout.interface";
import { MessagingHandler, MessagingObservable } from "../../../util/messaging";
import { Point } from "../util/point";
import { ProjectionResult } from "../util/projection";
import { ClusterEditObservable } from "./cluster-edit.observable";

export const DEFAULT_COLOR = "blue";
export const SVG_SIZE = 1000;


export type ColorMap = Map<string, ObservableNotNull<string>>;

export class ClusterPointObservable {
    public readonly name: ObservableNotNull<string>;
    public readonly group: Observable<Group>;
    public readonly groupColor: ComputedNotNull<string | undefined>;

    // absolute coordinates as computed by t-SNE
    public readonly coordinates: {
        x: ObservableNotNull<number>;
        y: ObservableNotNull<number>;
    };
    // relative coordinates ranging from '0%' to '100%' and centered around ('50%', '50%')
    public readonly rel: {
        x: ComputedNotNull<string>;
        y: ComputedNotNull<string>;
    };

    constructor(
        ko: Knockout,
        data: ProjectionResult,
        scale: Subscribable<number>,
        offset: Subscribable<Point>,
    ) {
        const coord = {
            x: ko.observable<number>(data.coordinates.x),
            y: ko.observable<number>(data.coordinates.y)
        }
        this.name = ko.observable<string>(data.name);
        this.coordinates = coord;
        this.rel = {
            x: ko.computed<string>(() => ((coord.x() + offset().x) * scale() * 100) + '%'),
            y: ko.computed<string>(() => ((coord.y() + offset().y) * scale() * 100) + '%')
        };
        this.group = ko.observable(undefined);
        this.groupColor = ko.computed((): string | undefined => {
            const group = this.group();
            if (group) {
                return group.color();
            }
            return undefined;
        });
    }

    public setGroup(group: Group | undefined): void {
        this.group(group);
    }
}

export interface Group {
    color: ObservableNotNull<string>;
    name: ObservableNotNull<string>;
    nameFilter: ComputedNotNull<string>;
}

export class GroupsObservable {

    public readonly groups: ObservableArray<Group>;
    public readonly currentGroup: Observable<Group>;
    public readonly currentGroupColor: Computed<string>;
    public readonly groupNamePrefix: ObservableNotNull<string>;
    public readonly groupNameDelimiter: ObservableNotNull<string>;

    constructor(private ko: Knockout) {
        this.currentGroup = ko.observable(undefined);
        this.groups = ko.observableArray<Group>([]);
        this.groupNamePrefix = ko.observable("");
        this.groupNameDelimiter = ko.observable(": ");

        this.currentGroupColor = ko.computed(() => {
            const currentGroup = this.currentGroup();
            if (currentGroup) {
                return currentGroup.color();
            }
            return undefined;
        });
    }

    public createFilterName(nameCluster: string): string {
        return `${this.groupNamePrefix()}${this.groupNameDelimiter()}${nameCluster}`;
    }

    public get length(): number {
        return this.groups().length;
    }

    public addGroup(name: string, color: string): Group {
        const nameObs = this.ko.observable(name);
        const group = {
            name: nameObs,
            nameFilter: this.ko.computed(() => {
                return this.createFilterName(nameObs());
            }),
            color: this.ko.observable(color),
        };
        this.groups.push(group);
        this.currentGroup(group);
        return group;
    }

}

export class GroupInputObservable {
    public readonly name: Observable<string>;
    public readonly color: Observable<string>;

    constructor(ko: Knockout) {
        this.name = ko.observable(undefined);
        this.color = ko.observable(undefined);
    }

    public reset(): void {
        this.name(undefined);
        this.color(undefined);
    }
}

export class ClusterObservable {

    public readonly messages: MessagingObservable;
    public readonly clusterPoints: Observable<ClusterPointObservable[]>
    public readonly projectionRunning: ObservableNotNull<boolean>;
    public readonly steps: Observable<number>;
    public readonly cost: Observable<number>;
    public readonly scale: ObservableNotNull<number>;
    public readonly offset: ObservableNotNull<Point>;
    public readonly groups: GroupsObservable;
    public readonly groupInput: GroupInputObservable;
    public readonly clusterEdit: ClusterEditObservable;
    public readonly showSaveButton: Observable<boolean>;
    public readonly showMenu: Observable<boolean>;


    constructor(private ko: Knockout) {
        this.clusterPoints = ko.observable<ClusterPointObservable[]>(undefined);
        this.messages = new MessagingObservable(ko);
        this.projectionRunning = ko.observable<boolean>(false);
        this.steps = ko.observable<number>(undefined);
        this.cost = ko.observable<number>(undefined);
        this.scale = ko.observable<number>(1);
        this.offset = ko.observable({ x: 0, y: 0 });
        this.groups = new GroupsObservable(ko);
        this.groupInput = new GroupInputObservable(ko);
        this.clusterEdit = new ClusterEditObservable(ko);
        this.showSaveButton = ko.observable(true);
        this.showMenu = ko.observable(false);
    }

    public createClusterPoint(data: ProjectionResult) {
        return new ClusterPointObservable(this.ko, data, this.scale, this.offset);
    }

    getMessagingHandler(): MessagingHandler {
        return new MessagingHandler(this.messages);
    }
}

