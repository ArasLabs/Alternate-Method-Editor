function jsHelp(helpURL)
{
	this.version = "1.0";
	this.helpURL = helpURL;
	this.helpStorage = top.aras.createXMLDocument();
	this.helpStorage.load(helpURL);

	this.getIdByLabel = function(text)
	{
		return this.helpStorage.documentElement.selectSingleNode('Item[@type="HelpItem"][translate(label, "abcdefghijklmnopsqrtuvwxyz", "ABCDEFGHIJKLMNOPSQRTUVWXYZ")="' + text.toUpperCase() + '"]');
	}

	this.locate = function(text)
	{
		return this.helpStorage.documentElement.selectSingleNode('Item[@type="HelpItem"][translate(id, "abcdefghijklmnopsqrtuvwxyz", "ABCDEFGHIJKLMNOPSQRTUVWXYZ")="' + text.toUpperCase() + '"]');
	}
	
	this.getCodeById = function(id)
	{
		var nd = this.helpStorage.documentElement.selectSingleNode('//Item[translate(id, "abcdefghijklmnopsqrtuvwxyz", "ABCDEFGHIJKLMNOPSQRTUVWXYZ")="' + id.toUpperCase() + '"]');
		if (!nd) {
			return null;
		}
		return nd.selectSingleNode("code");
	}
}