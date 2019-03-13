/* exported MethodEditor */
/* global dijit */

function MethodEditor(mainWnd) {
    var topWnd = mainWnd;
	var methodLanguages = []; // list of languages
    this.currentLanguage = "JavaScript";
    var tabPane;
    var preservedMenuFrame = null;
    var textChanged = false;

    this.setLanguage = function (langName) {
        if (!window.editor) {
            return;
        }
        var editorLang = "";
        switch(langName) {
            case "VB":
                editorLang = "vb";
                break;
            case "C#":
                editorLang = "csharp";
                break;
            case "JavaScript":
                editorLang = "javascript";
		}
        window.monacoEditor.setModelLanguage(window.editor.getModel(), editorLang);
        this.currentLanguage = langName;
    };

    this.switchLanguage = function (lang) {
        this.setLanguage(lang);
        var codelang = topWnd.aras.getItemProperty(parent.document.item, "method_type");
        if (codelang !== lang) {
            topWnd.aras.setItemProperty(parent.document.item, "method_type", lang);
        }
	};
	
	this.switchTheme = function (theme) {
		window.monacoEditor.setTheme(theme);
	}

    this.fillListOfMethodLanguages = function() {
        var listId = topWnd.aras.getListId("Method Types"),
            values = topWnd.aras.getListFilterValues(listId),
            valueItem,
            len,
            i;
        for (i = 0, len = values.length; i < len; ++i) {
            valueItem = values[i];
            methodLanguages.push({
                id: topWnd.aras.getItemProperty(valueItem, "id"),
                name: topWnd.aras.getItemProperty(valueItem, "value"), 
                side: topWnd.aras.getItemProperty(valueItem, "filter")
            });
        }
	};

    this.getListOfMethodLanguages = function() {
        return methodLanguages;
    };

    this.resizeEditor = function() {
        window.editor.layout(); // TODO: Check if this is right
    };

    this.initTabPane = function() {
        tabPane = dijit.registry.byId("tabPane");
    };

    this.selectTab = function(tabId) {
        if (!tabPane) {
            this.initTabPane();
        }
        tabPane.selectChild(dijit.registry.byId(tabId));
    };

	this.initParentMenu = function() {
		var menuFrame = (topWnd.isTearOff ? topWnd.tearOffMenuController : topWnd.menu);
		preservedMenuFrame = menuFrame;
		topWnd.setTimeout(f, 1);

		function f() {
			menuFrame.setControlEnabled("print", false);
			if (menuFrame["Preserved setControlEnabled"]) {
				return;
			}
			/* jshint ignore:start */
			menuFrame["Preserved setControlEnabled"] = menuFrame.setControlEnabled;
			menuFrame.setControlEnabled = new Function("cntrlNm", "b", "if (cntrlNm == 'print') b = false;this['Preserved setControlEnabled'](cntrlNm, b);");
			menuFrame["Restore setControlEnabled"] = new Function("this.setControlEnabled = this['Preserved setControlEnabled'];this['Preserved setControlEnabled'] = undefined;this['Restore setControlEnabled'] = undefined;");
			/* jshint ignore:end */
		}
    };

	this.restoreParentMenu = function () {
		if (preservedMenuFrame === null) {
			return;
		}
		if (typeof (preservedMenuFrame["Restore setControlEnabled"]) === "function") {
			preservedMenuFrame["Restore setControlEnabled"]();
		}
		else {
			var menuFrame = (top.isTearOff ? top.tearOffMenuController : top.menu);
			menuFrame.setControlEnabled = menuFrame["Preserved setControlEnabled"];
			menuFrame["Restore setControlEnabled"] = undefined;
		}
	};
    
    this.saveUserChanges = function() {
        if (parent.handleItemChange) {
            parent.handleItemChange("method_code", window.editor.getValue());
        }
    };

    this.changeEventMethods = function() {

        // function to save method code before basic item events (Save, Unlock, Save and Unlock)
        topWnd.methodEditor_saveUserChangesIfNeed = function() {
            if (window.methodEditorHelper.isTextChanged) {
                window.methodEditorHelper.saveUserChanges();
            }
        };

        topWnd.SetReadOnlyMode = function(isReadOnly) {
            window.isEditMode = !isReadOnly;
            window.editor.updateOptions({ readOnly: isReadOnly });

            if (!isReadOnly) {
                window.toolbar.enable();
                window.editor.focus();
            } else {
                window.toolbar.disable();
            }
        };

        topWnd.onUnlockItemSuccess = function () {
            var sourceCode = topWnd.aras.getItemProperty(parent.document.item, "method_code") || "";
            var currentCode = window.editor.getValue();
            if (sourceCode !== currentCode) {
                window.editor.setValue(sourceCode);
                // NOTE: This previously moved the cursor to the start position. I'm not sure how to do that in the monaco editor so we're skipping it
                // window.editor.moveCursorToPosition({ row: 0, column: 0 }); <-- CODE FOR ACE EDITOR
            }
            textChanged = false;
            window.editor.focus();
        };

        var indx, cmd, commandsToOverride = ["onSaveUnlockAndExitCommand", "onSaveCommand", "onUnlockCommand"];
        for (var i = 0; i < commandsToOverride.length; i++) {
            cmd = commandsToOverride[i];
            cmd = topWnd[cmd].toString();
            indx = cmd.indexOf("{"); // first { after function
            cmd = cmd.substr(0, indx + 1) + " methodEditor_saveUserChangesIfNeed(); " + cmd.substr(indx + 1);
            topWnd.eval(commandsToOverride[i] + "=" + cmd);
        }

		var unlockCommand = topWnd["onUnlockCommand"].toString(); // jshint ignore:line
		var unlockIndex = unlockCommand.indexOf("return true");
		unlockCommand = unlockCommand.substr(0, unlockIndex) + " SetReadOnlyMode(true); onUnlockItemSuccess(); " + unlockCommand.substr(unlockIndex);
		topWnd.eval("onUnlockCommand=" + unlockCommand);


		var lockCommand = topWnd["onLockCommand"].toString(); // jshint ignore:line
		var lockIndex = lockCommand.indexOf("{");
		lockCommand = lockCommand.substr(0, lockIndex + 1) + " SetReadOnlyMode(false); " + lockCommand.substr(lockIndex + 1);
		topWnd.eval("onLockCommand=" + lockCommand);

		//--- handle method code change
	};
	
	this.setEditorChangeEvent = function() {
		window.editor.onDidChangeModelContent(function (e) {
			if (!textChanged) {
				window.saveUserChanges();
			}
			textChanged = true;
		});
	}

	this.ovverideDeleteCommand = function() {
		topWnd.onPurgeDeleteCommandOriginal = topWnd.onPurgeDeleteCommand;
		topWnd.onPurgeDeleteCommand = function onPurgeDeleteMethodCommand(command, silentMode) {
			topWnd.isMethodDeleted = true;
			var baseResult = topWnd.onPurgeDeleteCommandOriginal(command, silentMode);
			topWnd.isMethodDeleted = (baseResult && baseResult.result === "Deleted");
			return baseResult;
		};
	};

	this.isTextChanged = function() {
		return textChanged;
	};
}