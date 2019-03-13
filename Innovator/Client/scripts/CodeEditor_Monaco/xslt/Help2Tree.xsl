<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt" xmlns:aras="http://www.aras-corp.com" version="1.0">
	<xsl:template match="AML">
		<table icon0="../images/ObjectTree.svg" icon1="../images/ObjectTree.svg">
			<thead>
				<th>Code Guide</th>
			</thead>
			<columns>
				<column width="100%"/>
			</columns>
			<xsl:apply-templates select="Item"/>
		</table>
	</xsl:template>
	<xsl:template match="Item">
		<tr action="{label}">
			<xsl:choose>
				<xsl:when test="string-length(icon) > 0">
					<xsl:attribute name="icon0">
						<xsl:value-of select="icon"/>
					</xsl:attribute>
					<xsl:attribute name="icon1">
						<xsl:value-of select="icon"/>
					</xsl:attribute>
				</xsl:when>
				<xsl:otherwise>
					<xsl:attribute name="icon0">
						<xsl:value-of select="string('../images/ObjectTree.svg')"/>
					</xsl:attribute>
					<xsl:attribute name="icon1">
						<xsl:value-of select="string('../images/ObjectTree.svg')"/>
					</xsl:attribute>
				</xsl:otherwise>
			</xsl:choose>
			<td>
				<xsl:value-of select="label"/>
			</td>
			<userdata key="id">
				<xsl:attribute name="value">
					<xsl:value-of select="id"/>
					<xsl:if test="string-length(id) = 0">
						<xsl:value-of select="../../id"/>.<xsl:value-of select="label"/>
					</xsl:if>
				</xsl:attribute>
			</userdata>
			<userdata key="code">
				<xsl:attribute name="value">
					<xsl:value-of select="code"/>
				</xsl:attribute>
			</userdata>
			<xsl:apply-templates select="Relationships"/>
		</tr>
	</xsl:template>
	<xsl:template match="Relationships">
		<xsl:apply-templates select="Item"/>
	</xsl:template>
</xsl:stylesheet>
