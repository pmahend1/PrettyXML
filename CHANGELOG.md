# Change Log

## Preview

### 0.8.0

- Fix for [#66:The edge module has not been pre-compiled for node.js version v14.16.0](https://github.com/pmahend1/PrettyXML/issues/66)
### 0.7.3 

- Yarn security updates

### 0.7.2

- Fixed XML value escape issue [#61: "&amp" in attributes are reformatted as "&"](https://github.com/pmahend1/PrettyXML/issues/61)

### 0.7.1

- Electron-edge-js updated for NodeJs 12.18.3/Electron 11.2.1
- Fixes [Issue#55: The edge module has not been pre-compiled for node.js version v12.18.3](https://github.com/pmahend1/PrettyXML/issues/55)

### 0.6.0

- New Feature **Format On Save** added.

### 0.5.4

- Yarn upgrade.
- Updated banner color and theme.

### 0.5.3

Typo fix in CI.

### 0.5.2

Updated ReadMe with VSCodium and OpenVsx.

### 0.5.1

Small fix to CI.

### 0.5.0

Publish extension to [Open VSX](https://open-vsx.org/extension/PrateekMahendrakar/prettyxml) for [VSCodium](https://vscodium.com/) as well.

### 0.4.4

Added reference to [PrettyXML.VSMac](https://github.com/pmahend1/PrettyXML.VSMac) in ReadMe.

### 0.4.3

Fixes [Issue 39](https://github.com/pmahend1/PrettyXML/issues/39)

### 0.4.2

Added CIs for PR version check and extension deployment.

### 0.3.0

Added **PrettyXML: Minimize** command.  

### 0.2.2

- Updated packages
- Fixes [Issue#20:Issue in formatting tag with no attributes and no childs but has separate end tag](https://github.com/pmahend1/PrettyXML/issues/20)

### 0.2.1 

Updated default for `prettyxml.settings.useSelfClosingTag` to `true`.  

### 0.2.0

Added Settings 
 - Indent Space Length.
 - Use Single Quotes.
 - Use Self Closing Tags.

### 0.1.8

Fixed Mac native node bindings not found issue.

### 0.1.5

Notification progress bar while formatting.

### 0.1.2

Reverted 0.1.0 & 0.1.1 changes

### 0.1.0 - 0.1.1 - Discontinued

~~Webpacked extension.
Discontinued due to electron-edge-js native binaries linking issue~~

### 0.0.10

Changed keybinding to **Cmd+K L** for Mac and **Control+K L** for other platforms.

**Fixes:**

- [This extension stop native ctrl+p in vscode #7](https://github.com/pmahend1/PrettyXML/issues/7)  

### 0.0.8 & 0.0.9

Fixes [Issue 4- Rewrite &amp; to & (Which break legal xml format)](https://github.com/pmahend1/PrettyXML/issues/4)

### 0.0.7

Initial release 0.0.7
