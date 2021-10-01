/* global clientControlsFactory, js_beautify, dijit */
/* exported MonacoEditorToolbar */

function MonacoEditorToolbar(mainWnd, methodEditorHelper) {
	var toolbar;
	var topWnd = mainWnd;
	var currentLanguageSide = 'Client';
	var methodEditor = methodEditorHelper;
	this.blockComment = '';

	function getOneLineComment() {
		switch (methodEditor.currentLanguage) {
			case 'JavaScript':
				return '//';
			case 'VB':
				return "'";
			case 'C#':
				return '//';
			default:
				return '//';
		}
	}

	this.initToolbar = function initToolbar() {
		clientControlsFactory.createControl('Aras.Client.Controls.Public.ToolBar', {
			id: 'tb1',
			connectId: 'toolbar'
		}, function (control) {
			toolbar = control;
			toolbar.loadXml(
				topWnd.aras.getI18NXMLResource(
					'toolbar.xml', 
					topWnd.aras.getScriptsURL() + 'CodeEditor_Monaco'
				)
			);
			toolbar.show();

			var codelang = topWnd.aras.getItemProperty(parent.document.item, 'method_type');
			methodEditor.currentLanguage = codelang;
			toolbar.getItem('method_lang').enable();

			if (codelang === 'JScript' || codelang === 'JavaScript') {
				toolbar.getItem('side').setSelected('client');
			} else {
				toolbar.getItem('side').setSelected('server');
			}

			toolbar.getItem('theme').enable();
			var monacoThemes = topWnd.aras.getListId('Monaco Editor Themes');
			var themeValues = topWnd.aras.getListValues(monacoThemes);
			for (var i = 0; i < themeValues.length; i++) {
				var themeValue = themeValues[i];
				toolbar.getItem('theme').Add(topWnd.aras.getItemProperty(themeValue, 'value'),
					topWnd.aras.getItemProperty(themeValue, 'label'));
			}

			toolbar.getItem('compareRevisions').enable();
			// Assumes that you're viewing the most current generation
			var methodGenerations = topWnd.aras.getItemProperty(parent.document.item, 'generation');
			for (var i = (parseInt(methodGenerations) - 1); i > 0; i--) {
				toolbar.getItem('generations').Add(i.toString(), i.toString());
			}

			clientControlsFactory.on(toolbar, {
				'onClick': onTbItemClick,
				'onChange': onDropDownItemClickHandler
			});

			setMethodSide(toolbar.getItem('side').getSelectedItem());
			if (parent.document.isEditMode) {
				toolbar.enable();
			} else {
				toolbar.disable();
			}
		});
	};

	function onTbItemClick(tbItem) {
		var tbItemId = tbItem.getId();
		switch (tbItemId) {
			case 'print':
				printText();
				break;
			case 'undo':
				// The first two arguments to this trigger event don't matter for undo and redo, so we just pass in junk values
				window.editor.trigger('', 'undo', '');
				break;
			case 'redo':
				window.editor.trigger('', 'redo', '');
				break;
			case 'find':
				window.editor.trigger('', 'actions.find', '');
				break;
			case 'replace':
				window.editor.trigger('', 'actions.replace', '');
				break;
			case 'unindent':
				window.editor.trigger('', 'editor.action.outdentLines', '')
				break;
			case 'indent':
				window.editor.trigger('', 'editor.action.indentLines', '')
				break;
			case 'formatting':
				window.editor.trigger('', 'editor.action.formatDocument', '');
				window.editor.focus();
				break;
			case 'comment':
				window.editor.trigger('', 'editor.action.addCommentLine', '');
				break;
			case 'uncomment':
				window.editor.trigger('', 'editor.action.removeCommentLine', '');
				break;
			case 'chksyn':
				checkSyntax();
				break;
			case 'add_debugger':
				addDebugger();
				break;
			case 'compareRevisions':
				if (methodEditor.isTextChanged()) {
					methodEditor.saveUserChanges();
				}
				if (tbItem.getState()) {
					var selectedGen = toolbar.getItem('generations').getSelectedItem();
					methodEditor.launchDiffEditor(selectedGen);
				} else {
					methodEditor.closeDiffEditor();
				}
				break;
			case 'ftoc':
				showHideToc(tbItem.getState());
				break; // hide or show help pane
			case 'toc_pos':
				switchHelpPanePosition();
				break; // change help pane position (right or left).
			case 'help':
				showHelpBySelection();
				break; // show help about selected method code
			case 'fhelp':
				showHideHelp(tbItem.getState());
				break; // hide or show help tab
			case 'fullscreen':
				// Get the element of the Form
				toggleFullscreen();
				break;
		}
	}

	// Model Markers are what's used to keep track of compilation errors
	function printModelMarker(model) {
		var errorString = '';

		// Defined in Enum https://microsoft.github.io/monaco-editor/api/enums/monaco.markerseverity.html
		// TODO: Remove this switch and get the value from the enum directly
		var errorType = '';
		switch (model.severity) {
			case 8:
				errorType = 'Error';
				break;
			case 1:
				errorType = 'Hint';
				break;
			case 2:
				errorType = 'Info';
				break;
			case 4:
				errorType = 'Warning';
				break;
		}

		errorString += errorType + ' : ';
		errorString += model.message;
		errorString += ' On line ' + model.startLineNumber;

		return errorString;
	}

	function printText() {
		var frame = document.getElementById('printable').contentWindow;
		frame.document.body.innerHTML = '<PRE>' + topWnd.aras.getItemProperty(parent.document.item, 'method_code') + '</PRE>';
		frame.focus(); // This is key, the iframe must have focus first
		frame.print();
	}

	function showHideToc(doVisible) {
		document.getElementById('helpPane').style.display = doVisible ? '' : 'none';
		document.getElementById('workAreaWrapper').style.width = doVisible ? '70%' : '100%';
		dijit.byId('workarea').resize();
	}

	function checkSyntax() {
		methodEditor.saveUserChanges();
		methodEditor.selectTab('debugTab');
		document.getElementById('debug').value = 'Checking syntax...\n\n';
		var errorInfo = '',
			warningInfo = '';
		var lang = topWnd.aras.getItemProperty(parent.document.item, 'method_type');
		if (lang === 'VB' || lang === 'C#' || lang === 'VJSharp') {
			var resultXml = topWnd.aras.createXMLDocument();
			resultXml.loadXML(topWnd.aras.compileMethod(parent.document.item.xml));
			errorInfo = resultXml.selectSingleNode('/Result/status').text;
		} else {
			// Model Markers are how the monaco stores JS Linting errors
			var modelMarkers = monacoEditor.getModelMarkers();
			for (var i = 0; i < modelMarkers.length; i++) {
				errorInfo += printModelMarker(modelMarkers[i]) + '\n';
			}
		}
		if (errorInfo === '') {
			errorInfo = 'ok';
		}
		document.getElementById('debug').value += errorInfo;
		window.editor.focus();
	}

	function addDebugger() {
		var editorSelection = window.editor.getSelection();
		
		// Get the number of tabs to indent the second line the C# and VB debugger statement
		var numTabs = Math.floor(editorSelection.startColumn / 4);
		var debuggerCode = '';
		switch (methodEditor.currentLanguage) {
			case 'JavaScript':
				debuggerCode = 'debugger;';
				break;
			case 'C#':
			case 'VB':
			case 'VJSharp':
				debuggerCode = 'System.Diagnostics.Debugger.Launch();\n';
				Array.from({length: numTabs}).forEach((x,i) => (debuggerCode += '\t')); // tab the next line to the same line as the Launch function
				debuggerCode += 'System.Diagnostics.Debugger.Break();';
				break;
			default:
				debuggerCode = '';
		}

		// build the edit to replace the selected text with a debugger statement
		var insertDebuggerEdit = {
			range : editorSelection,
			text : debuggerCode
		};

		// Make the replacement and put the cursor at the end of the inserted code
		window.editor.executeEdits('', [insertDebuggerEdit]);
		window.editor.setSelection(window.editor.getSelection().collapseToEnd());
		window.editor.focus();
	}

	function switchHelpPanePosition() {
		if (dijit.byId('workAreaWrapper').region === 'leading') {
			dijit.byId('helpPane').set('region', 'leading');
			dijit.byId('workAreaWrapper').set('region', 'center');
			document.getElementById('workAreaWrapper_splitter').style.display = 'none';

		} else {
			dijit.byId('workAreaWrapper').set('region', 'leading');
			dijit.byId('helpPane').set('region', 'center');
			document.getElementById('workAreaWrapper_splitter').style.display = '';
		}
		dijit.byId('workarea').resize();
	}

	function showHideHelp(doVisible) {
		var helpDebugSlot = document.getElementById('helpDebugSlot');
		var helpDebugSlotSplitter = document.getElementById('helpDebugSlot_splitter');
		helpDebugSlot.style.display = helpDebugSlotSplitter.style.display = doVisible ? '' : 'none';
		refreshDebugHelpSlot(doVisible);
		dijit.byId('helpDebugSlot').layout();
		dijit.byId('BorderContainer').layout();
		methodEditor.resizeEditor();
	}

	function showHelpBySelection() {
		var searchString = escape(window.editor.getModel().getValueInRange(window.editor.getSelection()));
		var helpRow = window.helpTab.getHelper().getIdByLabel(searchString);
		var rowId = helpRow ? helpRow.selectSingleNode('id').text : searchString;
		window.helpTab.showHelp(rowId, false);
	}

	function refreshDebugHelpSlot(doVisible) {
		var h = document.documentElement.offsetHeight;
		var helpDebugSlot = document.getElementById('helpDebugSlot');
		var helpDebugSlotHeight = parseInt(helpDebugSlot.style.height);
		var helpDebugSlotSplitter = document.getElementById('helpDebugSlot_splitter');
		var helpDebugSlotSplitterHeight = helpDebugSlotSplitter.offsetHeight;
		var tHeight = toolbar.getCurrentToolBarDomNode_Experimental().offsetHeight +
			document.getElementById('toolbar_splitter').offsetHeight + helpDebugSlotSplitterHeight;
		var newHeight = h - (helpDebugSlotHeight + tHeight);
		if (newHeight > 0) {
			document.getElementById('workarea').style.height = newHeight + 'px';
			document.getElementById('workAreaWrapper').style.height = newHeight + 'px';
		}
		if (doVisible) {
			var tmp = tHeight + parseInt(document.getElementById('editorpane').style.height);
			helpDebugSlot.style.top = tmp + 'px';
			helpDebugSlotSplitter.style.top = tmp - helpDebugSlotSplitterHeight + 'px';
		}
	}

	function toggleFullscreen() {
		// Check if the window is already fullscreen
		if (parent.document.fullscreen) {
			parent.document.exitFullscreen();
		} else {
			// Get the element containing the form
			var mainFormElem = parent.document.getElementById('MainDataForm');
			mainFormElem.requestFullscreen();
		}
	}

	function onDropDownItemClickHandler(tbItem) {
		if (tbItem.getId() === 'method_lang') {
			methodEditor.switchLanguage(tbItem._item_Experimental.value);
		} else if (tbItem.getId() === 'side') {
			switchSide(tbItem._item_Experimental.value);
		} else if (tbItem.getId() === 'theme') {
			methodEditor.switchTheme(tbItem._item_Experimental.value);
		}
	}

	function switchSide(val) {
		var lang = '';
		if (val !== currentLanguageSide) {
			var codelang = topWnd.aras.getItemProperty(parent.document.item, 'method_type');
			if (val === 'client') {
				lang = 'JavaScript';
			} else if (val === 'server') {
				if (codelang !== 'VB' && codelang !== 'C#' && codelang !== 'VJSharp') {
					lang = 'C#';
				} else {
					lang = codelang;
				}
			}
			methodEditor.setLanguage(lang);
			if (lang !== codelang) {
				topWnd.aras.setItemProperty(parent.document.item, 'method_type', lang);
			}
			fillMethodLanguageChoice(val);
		}
	}

	function setMethodSide(side) {
		loadFilterValues(side);
		var codelang = topWnd.aras.getItemProperty(parent.document.item, 'method_type');

		if (codelang !== undefined) {
			toolbar.getItem('method_lang').setSelected(codelang);
		}
		currentLanguageSide = toolbar.getItem('side').getSelectedItem();
	}

	function loadFilterValues(val) {
		toolbar.getItem('method_lang').removeAll();
		var methodLanguages = methodEditor.getListOfMethodLanguages();
		for (var i = 0, len = methodLanguages.length; i < len; ++i) {
			if (methodLanguages[i].side.toLowerCase() === val) {
				toolbar.getItem('method_lang').Add(methodLanguages[i].name, methodLanguages[i].name);
			}
		}
	}

	function fillMethodLanguageChoice(val) {
		if (val === 'client') {
			toolbar.getItem('side').setSelected('client');
		} else {
			toolbar.getItem('side').setSelected('server');
		}
		setMethodSide(val);
	}

	function getSelectedRows() {
		var selectedText = window.editor.getSelection();

		return {
			first: selectedText.startLineNumber,
			last: selectedText.endLineNumber
		}
	}

	function commentLines(direction) {
		var rows = getSelectedRows();

		toggleCommentLines(rows.first, rows.last, direction);
	}

	function toggleCommentLines(startRow, endRow, direction) {
		alert('Comment lines is currently not implemented');
	}

	this.enable = function () {
		toolbar.enable();
	};

	this.disable = function () {
		toolbar.disable();
	};
}