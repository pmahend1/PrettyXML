# Pretty XML

<img src='./images/logo.png' width='200' height='200' />

Pretty XML is a XML formatter extension for Visual Studio Code and VSCodium. It formats XML documents just like Visual Studio on Windows.
**Supported file extensions**: xml, xaml, xsd, xsl, plist, mobileconfig, config, csproj, axml, resx and all other XML type of files.

There is also **Visual Studio for Mac** version of this extension. Check it out at [PrettyXML.VSMac](https://github.com/pmahend1/PrettyXML.VSMac)

Suggestions , improvement PRs are welcome.

[![License](https://img.shields.io/github/license/pmahend1/PrettyXML?style=flat-square&label=License)](https://choosealicense.com/licenses/mit/)

[![Version](https://vsmarketplacebadge.apphb.com/version/PrateekMahendrakar.PrettyXML.svg?logo=visual-studio-code&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.prettyxml)

![Deploy](https://img.shields.io/github/workflow/status/pmahend1/prettyxml/Deploy%20CI?color=brightgreen&label=Deploy%20CI&style=flat-square&logo=github) ![Installs](https://vsmarketplacebadge.apphb.com/installs/PrateekMahendrakar.PrettyXML.svg?style=flat-square&label=Installs&logo=data:img/png:images/logo.png) ![Downloads](https://vsmarketplacebadge.apphb.com/downloads/PrateekMahendrakar.PrettyXML.svg?style=flat-square&label=Downloads) ![Rating](https://vsmarketplacebadge.apphb.com/rating-star/PrateekMahendrakar.PrettyXML.svg?style=flat-square&label=Rating)

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" width="150" height="40" />](https://www.buymeacoffee.com/pmahend1)

---

![prettify gif](./images/Prettify.gif)

## Features

### 1. Prettify XML (XML Formatting)

Right Click and Select Prettify XML or use [shortcut](#keyboard-shortcuts)

- First attribute on same line as start tag.
- All attributes indented aligning with first attribute.
- If no child for an element then close inline end tag.(Setting)
- No empty lines.
- Supports `'` and whitespace unicodes in attribute value for XAML parser compatibility.

  _before_

![Before](./images/before.png)

**After**

![After](./images/after.png)

### 2. Pretty XML: Minimize

Minimizes XML.

![minimize gif](./images/Minimize.gif)

## Keyboard Shortcuts

| Command             | Platform       | Shortcut         |
| ------------------- | -------------- | ---------------- |
| Prettify XML        | Mac            | **Cmd+K L**      |
| Prettify XML        | Windows, Linux | **Control+K L**  |
| PrettyXML: Minimize | Mac            | **Cmd+K \`**     |
| PrettyXML: Minimize | Windows, Linux | **Control+K \`** |

> **Note**
>
> You can change these in **Preferences → Keyboard Shortcuts** if you want.

## Settings

These will be for **Prettify XML** command.

| Setting Key                                                 | Default Value | Description                                     |
| ----------------------------------------------------------- | ------------- | ----------------------------------------------- |
| prettyxml.settings.indentSpaceLength                        | 4             | No. of spaces for indentation.                  |
| prettyxml.settings.useSingleQuotes                          | false         | Use ' instead of \"                             |
| prettyxml.settings.useSelfClosingTag                        | true          | If no child nodes then self closing tag />      |
| prettyxml.settings.formatOnSave                             | false         | Enable format on save                           |
| prettyxml.settings.allowSingleQuoteInAttributeValue         | true          | Allows ' in attribute values instead of \&apos; |
| prettyxml.settings.addSpaceBeforeSelfClosingTag             | true          | Adds space before self closing tag              |
| prettyxml.settings.wrapCommentTextWithSpaces                | true          | Wraps comment text with a single space          |
| prettyxml.settings.allowWhiteSpaceUnicodesInAttributeValues | true          | Allows white space unicodes in attribute values |

![Settings Image](./images/settings.png)

## Requirements

VS Code 1.58 or higher.

## Installation

Visual Studio Code - [Visual Studio MarketPlace](https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.prettyxml)

For VSCodium - [open-vsx.org](https://open-vsx.org/extension/PrateekMahendrakar/prettyxml)

> **Important!**
>
> You will need .Net SDK or Mono installed on your machine.

## Known Issues

Limited DTD support.
Issues can be reported at [issues section](https://github.com/pmahend1/PrettyXML/issues)

## Release Notes

See [Change Log](./CHANGELOG.md)

### For more information

- [Source Code](https://github.com/pmahend1/prettyxml)
