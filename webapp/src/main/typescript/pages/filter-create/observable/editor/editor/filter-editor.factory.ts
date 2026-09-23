import { Knockout, Observable } from "../../../../../util/knockout";
import { MatchChildsObservable } from "../../components/match-childs.observable";
import { MatchNestedFilterObservable } from "../../components/match-nested-filter.observable";
import { MatchAbstractObservable } from "../../components/match-abstract.observable";
import { createMatchChildsFilterEditor, MatchChildsEditorObservable } from "../components/match-childs-editor.observable";
import { MatchAbstractEditorObservable } from "../components/match-abstract-editor.observable";
import { MatchLocationEditorObservableDefault } from "../components/match-location-editor.observable";
import { MatchLayerEditorObservableDefault } from "../components/match-layer-editor.observable";
import { MatchLanguageCategoryEditorObservableDefault } from "../components/match-language-category-editor.observable";
import { MatchNamingMotiveEditorObservableDefault } from "../components/match-naming-motive-editor.observable";
import { createMatchEmptyEditor } from "../components/match-nested-filter-editor.observable";
import { MatchSchema } from "../../helper/match-schema.enum";
import { MatchRemovable } from "../../helper/match-removable.interface";
import { MatchTypesRegexObservableDefault } from "../components/match-types-regex-editor.observable";
import { MatchTypesDescriptionRegexObservableDefault } from "../components/match-types-description-regex-editor.observable";

const MAX_DEPTH = 12;
const STYLE_PREFIX = "col-sm-";

export interface FilterFactoryInterface {
    create(matchObservable: MatchAbstractObservable): MatchAbstractEditorObservable[];
}

export class FilterEditorFactory implements FilterFactoryInterface {

    constructor(private ko: Knockout) {}

    create(matchObservable: MatchAbstractObservable): MatchAbstractEditorObservable[] {
        const depth = 0;
        const parent = undefined;
        return this.createBase(matchObservable, depth, parent);
    }

    private createBase(
        matchObservable: MatchAbstractObservable,
        depth: number,
        parent: MatchRemovable | undefined,
    ): MatchAbstractEditorObservable[] {
        const styleColPrefix = this.ko.observable(STYLE_PREFIX + depth);
        const styleColContent = this.ko.observable(STYLE_PREFIX + (MAX_DEPTH - depth));
        switch (matchObservable.getMatchSchema()) {
            case MatchSchema.MatchTypesRegex:
                return [new MatchTypesRegexObservableDefault(
                    this.ko,
                    parent,
                    matchObservable,
                    styleColPrefix,
                    styleColContent
                )];
            case MatchSchema.MatchTypesDescriptionRegex:
                return [new MatchTypesDescriptionRegexObservableDefault(
                    this.ko,
                    parent,
                    matchObservable,
                    styleColPrefix,
                    styleColContent
                )];
            case MatchSchema.MatchLanguageCategory:
                return [new MatchLanguageCategoryEditorObservableDefault(
                    this.ko,
                    parent,
                    matchObservable,
                    styleColPrefix,
                    styleColContent
                )];
            case MatchSchema.MatchNamingMotive:
                return [new MatchNamingMotiveEditorObservableDefault(
                    this.ko,
                    parent,
                    matchObservable,
                    styleColPrefix,
                    styleColContent
                )];
            case MatchSchema.MatchAll:
            case MatchSchema.MatchAny:
                return this.createChildable(matchObservable, depth, parent, styleColPrefix, styleColContent);
            case MatchSchema.MatchNot:
            case MatchSchema.MatchSameLocationAs:
            case MatchSchema.MatchSameTypeAs:
                    return this.createNested(matchObservable, depth, parent, styleColPrefix, styleColContent);
            case MatchSchema.MatchLocation:
                return [new MatchLocationEditorObservableDefault(
                    this.ko,
                    parent,
                    matchObservable,
                    styleColPrefix,
                    styleColContent
                )];
            case MatchSchema.MatchLayer:
                return [new MatchLayerEditorObservableDefault(
                    this.ko,
                    parent,
                    matchObservable,
                    styleColPrefix,
                    styleColContent
                )];
            default:
                throw new Error("Specify " + matchObservable.getMatchSchema());
        }
    }

    private createNested(
        matchObservable: MatchAbstractObservable,
        depth: number,
        parent: MatchRemovable | undefined,
        styleColPrefix: Observable<string>,
        styleColContent: Observable<string>
    ): MatchAbstractEditorObservable[] {
        const embeddedFilter = (matchObservable as MatchNestedFilterObservable);
        const notEditor = createMatchEmptyEditor(
            this.ko,
            parent,
            embeddedFilter,
            styleColPrefix,
            styleColContent,
        );
        const list: MatchAbstractEditorObservable[] = [notEditor];
        if (embeddedFilter.filter() !== undefined) {
            const childList = this.createBase(embeddedFilter.filter() as MatchAbstractObservable, depth+1, embeddedFilter);
            childList.forEach(child => list.push(child));
        }
        return list;
    }

    private createChildable(
        matchObservable: MatchAbstractObservable,
        depth: number,
        parent: MatchRemovable | undefined,
        styleColPrefix: Observable<string>,
        styleColContent: Observable<string>
    ): MatchAbstractEditorObservable[] {
        const matchObservableChildable = (matchObservable as MatchChildsObservable);
        const matchFilterChildsEditor = createMatchChildsFilterEditor(
            this.ko,
            parent,
            matchObservableChildable,
            styleColPrefix,
            styleColContent,
        );
        const list: MatchAbstractEditorObservable[] = [matchFilterChildsEditor];
        matchObservableChildable.childs().forEach(child => {
            const innerList = this.createBase(child, depth + 1, matchObservableChildable);
            innerList.forEach(innerChild => list.push(innerChild));
        });
        return list;
    }

}