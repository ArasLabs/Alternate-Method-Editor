// helper for display "help Pane" on MethodEditor view

/* exported HelpEditorPane */
/* global clientControlsFactory, jsHelp */

function HelpEditorPane(mainWnd) {

	this.showHelp = function(){
		createTree();
	};

	var helpStorage;
	var treeGrid;
	var topWnd = mainWnd; //main tearoff window

	function createTree() {
		clientControlsFactory.createControl(
			"Aras.Client.Controls.Public.TreeGridContainer",
			{ connectId: "right", TreeClass: "aras_treegrid_method_editor", treeGridIndent: 19 },
			function (control) {
				var tocDom = topWnd.aras.createXMLDocument();
				tocDom.load(topWnd.aras.getScriptsURL() + "CodeEditor_Monaco/help/toc.xml");
				helpStorage = new jsHelp(topWnd.aras.getScriptsURL() + "CodeEditor_Monaco/help/toc.xml"); // see jsHelp.js
				var treeXml = topWnd.aras.applyXsltFile(tocDom, topWnd.aras.getScriptsURL() + "CodeEditor_Monaco/xslt/Help2Tree.xsl");
				treeGrid = control;
				treeGrid.setMultiselect(false);
				treeGrid.InitXML(treeXml);
				clientControlsFactory.on(treeGrid, {
					"gridClick": onClick,
					"gridDoubleClick": onDbClick
				});
			});
	}

	function onDbClick(rowId) {
		// if the current state of method item is lock we don't insert method prototype
		if (!parent.parent.isEditMode) {
			return;
		}

		var realRowId = treeGrid.GetUserData(rowId, "id");
		var code = helpStorage.getCodeById(realRowId);
		if (!code) {
			return;
		}

		// build the edit to replace the selected text with the code form the help pane
		var insertCodeEdit = {
			range : window.editor.getSelection(),
			text  : code.text
		};

		// Make the replacement and put the cursor at the end of the inserted code
		window.editor.executeEdits("", [insertCodeEdit]);
		window.editor.setSelection(window.editor.getSelection().collapseToEnd());
		window.editor.focus();
	}

	function onClick(rowId) {
		var realRowId = treeGrid.GetUserData(rowId, "id");
		window.helpTab.showHelp(realRowId, true); // show help information in help tab. See helpEditorTab.js
	}
}