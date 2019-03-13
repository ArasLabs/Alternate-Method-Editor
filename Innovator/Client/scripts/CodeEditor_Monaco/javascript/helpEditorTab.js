/* exported HelpEditorTab */
/* global aras, jsHelp */

function HelpEditorTab(mainWnd, methodEditorHelper) {
	var helper;
	var topWnd = mainWnd;
	var methodEditor = methodEditorHelper;

	this.initHelp = function() {
		helper = new jsHelp(aras.getScriptsURL() + "CodeEditor/help/help.xml"); // see jsHelp.js
	};

	this.getHelper = function() {
		return helper;
	};

	this.showHelp = function (rowId, noAlert) {
		var h = null;

		if (rowId) {
			h = helper.locate(rowId);
		}

		if (h) {
			var params = topWnd.aras.getItemProperty(h, 'comments');
			document.getElementById('help_comments').text = params;
			document.getElementById('help_comments').innerText = params;
			document.getElementById('help_label').innerHTML = topWnd.aras.getItemProperty(h, 'code');
			document.getElementById('help_comments').style.display = "block";
			document.getElementById('help_label').style.display = "block";

			// Populate arguments/parameters slot
			params = "";
			var parameters = h.selectNodes('arguments/parameter');
			for (var i = 0; i < parameters.length; i++) {
				params += processHelpParameter(parameters[i]);
			}
			document.getElementById('help_parameters').innerHTML = params;
			document.getElementById('parameters_slot').style.display = params ? "block" : "none";

			// Populate returns slot
			params = topWnd.aras.getItemProperty(h, 'returns');
			document.getElementById('help_returns').innerHTML = params;
			document.getElementById('returns_slot').style.display = params ? "block" : "none";

			// Populate remarks slot
			params = topWnd.aras.getItemProperty(h, 'remarks');
			document.getElementById('help_remarks').text = params;
			document.getElementById('help_remarks').innerText = params;
			document.getElementById('remarks_slot').style.display = params ? "block" : "none";

			// Populate example slot
			params = topWnd.aras.getItemProperty(h, 'example');
			document.getElementById('help_example').innerHTML = params;
			document.getElementById('example_slot').style.display = params ? "block" : "none";

			// Populate exception slot.
			params = h.selectNodes('exception');
			if (params.length > 0) {
				var rows = document.getElementById("dtTABLE").rows;
				while (rows.length > 2) {
					var row = rows[rows.length - 1];
					row.parentElement.removeChild(row);
				}
				for (var j = 0; j < params.length; j++) {
					var rr = document.getElementById("dtTABLE").insertRow(-1);
					var col = rr.insertCell(0);
					col.innerHTML = params[j].getAttribute('type');
					col = rr.insertCell(1);
					col.innerHTML = (params[j].xml).replace(/&lt;li&gt;/g, "<li>").replace(/&lt;\/li&gt;/g, "</li>");
				}
				document.getElementById('exception_slot').style.display = "table";
			}
			else {
				document.getElementById('exception_slot').style.display = "none";
			}
		}
		else if (noAlert) {
			document.getElementById('help_label').innerHTML = rowId;
			document.getElementById('help_parameters').innerHTML = "";
			document.getElementById('help_returns').innerHTML = "";
			document.getElementById('help_comments').innerHTML = "No help available.";
			document.getElementById('help_example').innerHTML = "";
			document.getElementById('help_remarks').innerHTML = "";
			document.getElementById('help_label').style.display = "block";
			document.getElementById('parameters_slot').style.display = "none";
			document.getElementById('returns_slot').style.display = "none";
			document.getElementById('remarks_slot').style.display = "none";
			document.getElementById('example_slot').style.display = "none";
			document.getElementById('exception_slot').style.display = "none";
		}
		else {
			topWnd.aras.AlertError("No help available for \"" + unescape(rowId) + "\"."); // jshint ignore:line
		}
		methodEditor.selectTab("helpTab"); // implementation methodEditor.js
	};

	function processHelpParameter(param) {
		var text = "";
		var type = param.getAttribute("type");
		if (type !== null) {
			text += type;
		}
		var name = param.getAttribute("name");
		if (name !== null) {
			text += "&nbsp;&nbsp;<i>" + name + "</i>";
		}
		else {
			text += "&nbsp;&nbsp;<i>" + param.tagName + "</i>";
		}
		for (var i = 0; i < param.childNodes.length; i++) {
			var node = param.childNodes[i];
			var num = node.childNodes.length;
			if (num === 0 || num === 1) {
				if (node.nodeTypeString === "element") {
					text += "&nbsp;&nbsp;<i>" + node.tagName + "</i>";
				}
				text += "<br>&nbsp;&nbsp;&nbsp;" + node.text + "<br>";
			}
			else {
				text += processHelpParameter(node);
			}
		}
		return text;
	}
}