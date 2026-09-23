import { Computed, Knockout, Observable } from "../knockout";
import { ComputedNotNull, ObservableNotNull } from "../knockout/lib/knockout.interface";
import { ExtendedListObservable } from "../knockout/list/extended-list.observable";
import { MessagingObservable } from "../messaging";


export function registerComponents(ko: Knockout) {
    ko.components.register("btn-sec", {
        viewModel: {
            createViewModel: function(params: {
                func: (() => void),
                text: string
            }, componentInfo) {
                return params;
            }
        },
        template: `
            <button
                    data-bind="click: function() { func(); }"
                    type="button"
                    class="btn btn-outline-secondary"
            >
                <span data-bind="text: text"></span>
            </button>
        `
    });
    ko.components.register("custom-messagebar", {
        viewModel: {
            createViewModel: function(params: { messages: MessagingObservable }, componentInfo) {
                return {
                    messages: params.messages
                };
            }
        },
        template: `
            <div data-bind="foreach: messages.errorList()">
                <div class="alert alert-danger" role="alert">
                    <span data-bind="text: $data"></span>
                </div>
            </div>

            <div data-bind="foreach: messages.succesList()">
                <div class="alert alert-success" role="alert">
                    <span data-bind="text: $data"></span>
                </div>
            </div>

            <div data-bind="foreach: messages.infoList()">
                <div class="alert alert-info" role="alert">
                    <span data-bind="text: $data"></span>
                </div>
            </div>
        `
    });
    ko.components.register("custom-navbar", {
        viewModel: {
            createViewModel: function(params?: { messages?: MessagingObservable }, componentInfo?): { messages: MessagingObservable} {
                if (params === undefined || params.messages === undefined) {
                    return {
                        messages: new MessagingObservable(ko)
                    };
                }
                return {
                    messages: params.messages
                };
            }
        },
        template: `
            <nav class="navbar navbar-expand-lg navbar-light bg-light">
                <div class="container">
                    <a class="navbar-brand" href="/">Namensatlas</a>

                    <ul class="mr-auto navbar-nav" data-bind="foreach: messages.navbarMessages()">
                        <li data-bind="html: $data"></li>
                    </ul>

                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <a class="nav-link" href="/">Dashboard</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="filter-overview.html">Filter&uuml;bersicht</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="query.html">Abfrage</a>
                        </li>
                    </ul>
                </div>
            </nav>
        `
    });
    ko.components.register("paging-toolbar", {
        viewModel: {
            createViewModel: function(params: { list: ExtendedListObservable<any> }) {
                const pageState = params.list.getPageState();
                const model: any = {};
                model.pageNumberCurrent = ko.computed(() => {
                    return pageState.pageNumberCurrent();
                });
                model.pageNumberComplete = ko.computed(() => {
                    return pageState.pageNumberComplete();
                });
                model.hasBeforeButton = ko.computed(() => {
                    return pageState.hasBeforePage();
                });
                model.hasNextButton = ko.computed(() => {
                    return pageState.hasNextPage();
                });
                model.next = function() {
                    pageState.next();
                };
                model.before = function() {
                    pageState.before();
                };
                return model;
            }
        }, template: `
            <div class="row py-2" role="group">
                <div class="col-sm-4">
                    <div class="col-sm-2 input-group btn-group btn-group-sm" role="group">
                        <span class="input-group-text">
                            Seite&nbsp;
                            <span data-bind="text: pageNumberCurrent"></span>
                            &nbsp;/&nbsp;
                            <span data-bind="text: pageNumberComplete"></span>
                        </span>
                        <button type="submit" class="btn btn-outline-secondary"
                            data-bind="enable: hasBeforeButton, click: before">Zur&uuml;ck</button>
                        <button type="submit" class="btn btn-outline-secondary"
                            data-bind="enable: hasNextButton, click: next">Weiter</button>
                    </div>
                </div>
                <div class="col-sm-8"></div>
            </div>
        `
    });
    ko.components.register("choose-filter", {
        viewModel: {
            createViewModel: function(params: {
                name: Observable<string>,
                searchString: Observable<string>,
                filteredList: Computed<any>,
                consumeFilter: (filter: any) => void,
            }, componentInfo) {
                const id = `id-${Math.random()}`;
                const model: {
                    openDropdown: ObservableNotNull<boolean>;
                    name: Observable<string>;
                    searchString: Observable<string>;
                    filteredList: Computed<any>;
                    id: ComputedNotNull<string>;
                    changeOpenDropdown: () => void;
                    processFilter: (val: any) => void;
                } = {
                    ...params,
                    openDropdown: ko.observable(false),
                    id: ko.observable<string>(id),
                    changeOpenDropdown: function () {
                        model.openDropdown(!model.openDropdown());
                        if (model.openDropdown()) {
                            const inputField = document.getElementById(id);
                            if (inputField) {
                                inputField.focus();
                            }
                        }
                    },
                    processFilter: function(val: any) {
                        params.consumeFilter(val);
                        model.changeOpenDropdown();
                    }
                }
                return model;
            }
        },
        template: `
            <button class="btn btn-outline-secondary btn-sm" data-bind="click: changeOpenDropdown">
                <i class="bi bi-funnel"></i>
                <!-- ko if: name() !== undefined -->
                    <span data-bind="text: name"></span>
                <!-- /ko -->
                <!-- ko if: name() === undefined -->
                    W&auml;hle...
                <!-- /ko -->
            </button>
            <!-- ko if: openDropdown -->
            <div style="position: relative; z-index: 100;">
                <div class="card" style="position: absolute;">
                    <input id="dropdownForFilter" data-bind="textInput: searchString, attr: { id: id }"
                        type="text" placeholder="Filter name">
                    <ul class="list-group">
                        <!-- ko foreach: { data: filteredList(), as: 'value' } -->
                        <a class="list-group-item" data-bind="click: function() {
                            $parent.processFilter(value);
                        }">
                            <div>
                                <span data-bind="text: value.name"></span>
                            </div>
                        </a>
                        <!-- /ko -->
                    </ul>
                </div>
            </div>
            <!-- /ko -->
        `
    });
}