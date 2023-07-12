# Change Log

## Stable

### 3.4.0: 11-Jul-2023

- Added setting to preserve whitespaces in comments.
- Yarn upgrades.

### 3.3.0: 18-May-2023

- Implemented optional logger.
- Yarn upgrades.

### 3.2.0: 18-Apr-2023

- Yarn upgrades.

### 3.1.0: 15-Mar-2023

- Yarn upgrades.

### 3.0.1: 19-Dec-2022

- Updated Settings screenshot.
- Fixed shields.io badges.
- YARN upgrades.
- pullrequest.yml checks if changelog and package.json have changed.  

### 3.0.0: 19-Oct-2022

- Added Setting [**Position All Attributes On First Line**](https://github.com/pmahend1/PrettyXML/issues/104).
- Removed [deprecated `set-output`](https://github.blog/changelog/2022-10-11-github-actions-deprecating-save-state-and-set-output-commands/) from GitHub actions.  

### 2.4.0: 16-Oct-2022

- Added ESBuild.
- Yarn upgrades.

### 2.3.0: 20-Sep-2022

- Yarn upgrades.

### 2.2.0: 07-Aug-2022

- Yarn upgrades.

### 2.1.0: 13-Jul-2022

- Yarn upgrades.

### 2.0.1: 20-Jun-2022

- Updated ReadMe badges.
- Yarn upgrades.

### 2.0.0 : 17-Jun-2022

- Dependency updated to .Net 6
- Position First Attribute On Same Line setting added. Default is `True`.  
    `False` keeps all attributes on new lines.
- Some notification service clean up.

### 1.6.1: 18-Apr-2022

- Added `Don't show again` for review extension prompt since some people got annoyed being asked once in 15-30 days.

### 1.6.0: 18-Apr-2022

- Removed Electron-Edge-JS dependency.
- Added missing SVG support.

### 1.5.3: 04-Apr-2022

- Module did not self-register error work-around added for electron-edge-js.

### 1.5.2: 01-Apr-2022

- Fixed bug with Electron-Edge-JS module.

### 1.5.1: 27-Mar-2022

- Fixed bug in release notes URL.

### 1.5.0: 27-Mar-2022

- Yarn security upgrades.

### 1.4.0: 29-Jan-2022

- Yarn security upgrades.

### 1.3.4: 27-Dec-2021

- Fix for infinite formatting progress on errored XML file. [#88](https://github.com/pmahend1/PrettyXML/issues/88)

### 1.3.3: 23-Dec-2021

- Missing release notes not displaying bugfix.

### 1.3.2: 23-Dec-2021

- Missing release notes text added.

### 1.3.1: 22-Dec-2021

- Fixed a bug where release notes information pop up isn't displaying.

### 1.3.0: 19-Dec-2021

- Added review prompt
- Fixed issue with what's new dialog logic.
- Yarn upgrades.

### 1.2.1: 6-Dec-2021

- Yarn upgrades.

### 1.2.0: 3-Oct-2021

- New logo added.

### 1.1.2 : 3-Oct-2021

- Fixed a bug where progress bar was not dismissing if there was a formatting error.

### 1.1.0 : 18-Sep-2021

- Linux support added
- Command line mode added internally as back-up in case electron-edge-js binary issue for NodeJs version.

### 1.0.2 : 12-Sep-2021

- Fixed _on save_ which was running after the document save.

### 1.0.1 : 10-Sep-2021

- Fixed a bug where _on save_ was triggering formatting command for non-xml documents .

### 1.0.0 : 9-Sep-2021

- Document formatting provider added.🆕

## Preview

### 0.11.0 : 8-Aug-2021

- Electron 13.1.7 specific build.

### 0.10.0 : 31-Jul-2021

- Added setting `prettyxml.settings.allowWhiteSpaceUnicodesInAttributeValues`
- Updated **Readme.md**.

### 0.9.0 : 30-Jul-2021

- Added settings :
  - `prettyxml.settings.allowSingleQuoteInAttributeValue`
  - `prettyxml.settings.addSpaceBeforeSelfClosingTag`
  - `prettyxml.settings.wrapCommentTextWithSpaces`
- Updated **Readme.md**.

### 0.8.1

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
