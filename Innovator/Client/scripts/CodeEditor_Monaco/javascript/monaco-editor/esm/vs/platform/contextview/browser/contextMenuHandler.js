/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import './contextMenuHandler.css';
import { combinedDisposable, dispose } from '../../../base/common/lifecycle.js';
import { StandardMouseEvent } from '../../../base/browser/mouseEvent.js';
import { ActionRunner } from '../../../base/common/actions.js';
import { Menu } from '../../../base/browser/ui/menu/menu.js';
import { addDisposableListener, EventType, $ } from '../../../base/browser/dom.js';
import { attachMenuStyler } from '../../theme/common/styler.js';
import { domEvent } from '../../../base/browser/event.js';
var ContextMenuHandler = /** @class */ (function () {
    function ContextMenuHandler(element, contextViewService, telemetryService, notificationService, keybindingService, themeService) {
        this.contextViewService = contextViewService;
        this.telemetryService = telemetryService;
        this.notificationService = notificationService;
        this.keybindingService = keybindingService;
        this.themeService = themeService;
        this.setContainer(element);
    }
    ContextMenuHandler.prototype.setContainer = function (container) {
        var _this = this;
        if (this.element) {
            this.elementDisposable = dispose(this.elementDisposable);
            this.element = null;
        }
        if (container) {
            this.element = container;
            this.elementDisposable = addDisposableListener(this.element, EventType.MOUSE_DOWN, function (e) { return _this.onMouseDown(e); });
        }
    };
    ContextMenuHandler.prototype.showContextMenu = function (delegate) {
        var _this = this;
        var actions = delegate.getActions();
        if (!actions.length) {
            return; // Don't render an empty context menu
        }
        this.focusToReturn = document.activeElement;
        var menu;
        this.contextViewService.showContextView({
            getAnchor: function () { return delegate.getAnchor(); },
            canRelayout: false,
            anchorAlignment: delegate.anchorAlignment,
            render: function (container) {
                _this.menuContainerElement = container;
                var className = delegate.getMenuClassName ? delegate.getMenuClassName() : '';
                if (className) {
                    container.className += ' ' + className;
                }
                // Render invisible div to block mouse interaction in the rest of the UI
                _this.block = container.appendChild($('.context-view-block'));
                var menuDisposables = [];
                var actionRunner = delegate.actionRunner || new ActionRunner();
                actionRunner.onDidBeforeRun(_this.onActionRun, _this, menuDisposables);
                actionRunner.onDidRun(_this.onDidActionRun, _this, menuDisposables);
                menu = new Menu(container, actions, {
                    actionItemProvider: delegate.getActionItem,
                    context: delegate.getActionsContext ? delegate.getActionsContext() : null,
                    actionRunner: actionRunner,
                    getKeyBinding: delegate.getKeyBinding ? delegate.getKeyBinding : function (action) { return _this.keybindingService.lookupKeybinding(action.id); }
                });
                menuDisposables.push(attachMenuStyler(menu, _this.themeService));
                menu.onDidCancel(function () { return _this.contextViewService.hideContextView(true); }, null, menuDisposables);
                menu.onDidBlur(function () { return _this.contextViewService.hideContextView(true); }, null, menuDisposables);
                domEvent(window, EventType.BLUR)(function () { _this.contextViewService.hideContextView(true); }, null, menuDisposables);
                return combinedDisposable(menuDisposables.concat([menu]));
            },
            focus: function () {
                if (menu) {
                    menu.focus(!!delegate.autoSelectFirstItem);
                }
            },
            onHide: function (didCancel) {
                if (delegate.onHide) {
                    delegate.onHide(!!didCancel);
                }
                if (_this.block) {
                    _this.block.remove();
                    _this.block = null;
                }
                if (_this.focusToReturn) {
                    _this.focusToReturn.focus();
                }
                _this.menuContainerElement = null;
            }
        });
    };
    ContextMenuHandler.prototype.onActionRun = function (e) {
        if (this.telemetryService) {
            /* __GDPR__
                "workbenchActionExecuted" : {
                    "id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "from": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this.telemetryService.publicLog('workbenchActionExecuted', { id: e.action.id, from: 'contextMenu' });
        }
        this.contextViewService.hideContextView(false);
        // Restore focus here
        if (this.focusToReturn) {
            this.focusToReturn.focus();
        }
    };
    ContextMenuHandler.prototype.onDidActionRun = function (e) {
        if (e.error && this.notificationService) {
            this.notificationService.error(e.error);
        }
    };
    ContextMenuHandler.prototype.onMouseDown = function (e) {
        if (!this.menuContainerElement) {
            return;
        }
        var event = new StandardMouseEvent(e);
        var element = event.target;
        while (element) {
            if (element === this.menuContainerElement) {
                return;
            }
            element = element.parentElement;
        }
        this.contextViewService.hideContextView();
    };
    ContextMenuHandler.prototype.dispose = function () {
        this.setContainer(null);
    };
    return ContextMenuHandler;
}());
export { ContextMenuHandler };
