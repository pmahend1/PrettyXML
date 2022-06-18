# Pretty XML

<img src='./images/logo.png' width='200' height='200' />

[What is it?](#what-is-it)

[Features](#features)  
[1. Prettify XML (XML Formatting)](#1-prettify-xml-xml-formatting)  
[2. Pretty XML: Minimize](#2-pretty-xml-minimize)

[Keyboard Shortcuts](#keyboard-shortcuts)

[Settings](#settings)

[Requirements](#requirements)

[Installation](#installation)

[Known Issues](#known-issues)

[Change Log](CHANGELOG.md#change-log)

[For more information](#for-more-information)

## What is it?

Pretty XML is a XML formatter extension for Visual Studio Code and VSCodium. It formats XML documents just like Visual Studio on Windows.

**Supported file extensions**:

-   xml
-   xaml
-   axml
-   xsd
-   xsl
-   plist
-   mobileconfig
-   config
-   csproj
-   svg
-   resx and all other XML type of files.

There is also **Visual Studio for Mac 2019** version of this extension. Check it out at [PrettyXML.VSMac](https://github.com/pmahend1/PrettyXML.VSMac)

Suggestions, improvement PRs are welcome.

[![License.](https://img.shields.io/github/license/pmahend1/PrettyXML?style=for-the-badge&label=License&color=chocolate)](https://choosealicense.com/licenses/mit/)![Deploy](https://img.shields.io/github/workflow/status/pmahend1/prettyxml/Deploy%20CI?color=darkgreen&label=Deploy%20CI&style=for-the-badge&logo=github&logoColor=black)  
[![Version.](https://vsmarketplacebadge.apphb.com/version/PrateekMahendrakar.PrettyXML.svg?logo=visual-studio-code&style=for-the-badge&logoColor=blue&color=blue)](https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.prettyxml)![Installs](https://vsmarketplacebadge.apphb.com/installs-short/PrateekMahendrakar.PrettyXML.svg?style=for-the-badge&label=Installs&color=blue)![Downloads](https://vsmarketplacebadge.apphb.com/downloads-short/PrateekMahendrakar.PrettyXML.svg?style=for-the-badge&label=Downloads&color=blue)![Rating](https://vsmarketplacebadge.apphb.com/rating-short/PrateekMahendrakar.PrettyXML.svg?style=for-the-badge&label=Rating&color=blue)

 [![Open VSX Version](https://img.shields.io/open-vsx/v/PrateekMahendrakar/PrettyXML?color=darkcyan&logoColor=green&style=for-the-badge&logo=data:image/png;base64,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)](https://open-vsx.org/extension/PrateekMahendrakar/prettyxml)![Open VSX Downloads](https://img.shields.io/open-vsx/dt/PrateekMahendrakar/PrettyXML?color=darkcyan&style=for-the-badge)![Open VSX Rating](https://img.shields.io/open-vsx/rating/PrateekMahendrakar/PrettyXml?color=darkcyan&style=for-the-badge)

![prettify gif.](./images/Prettify.gif)

---

## Features

### 1. Prettify XML (XML Formatting)

Right Click and Select Prettify XML or use [shortcut](#keyboard-shortcuts)

-   First attribute on same line as start tag.
-   All attributes indented aligning with first attribute.
-   If no child for an element then close inline end tag.(Setting)
-   No empty lines.
-   Supports `'` and whitespace unicodes in attribute value for XAML parser compatibility.

_before_

![Before.](./images/before.png)

**After**

![After.](./images/after.png)

### 2. Pretty XML: Minimize

Minimizes XML.

![minimize gif.](./images/Minimize.gif)

---

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

---

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
| prettyxml.settings.positionFirstAttributeOnSameLine         | true          | Position first attribute on same line.          |

![Settings Image.](./images/settings.png)

---

## Requirements

-   [**.Net 6** or later](https://dotnet.microsoft.com/en-us/download/dotnet) installed on your machine and should be accessible through terminal.
-   Install [Muhammad-Sammy C#](https://open-vsx.org/extension/muhammad-sammy/csharp) or [Microsoft C#](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp) extension.
-   Visual Studio Code/VSCodium 1.59 or higher.

---

## Installation

Visual Studio Code - [Visual Studio MarketPlace](https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.prettyxml)

For VSCodium - [open-vsx.org](https://open-vsx.org/extension/PrateekMahendrakar/prettyxml)

---

## Known Issues

-   Limited DTD support.
-   Formats valid XML files only. Syntax errors are displayed.

Issues can be reported at [issues section](https://github.com/pmahend1/PrettyXML/issues)

---

### For more information

-   [Source Code](https://github.com/pmahend1/prettyxml)
-   If you want to support this project,  
    [<img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" width="100" height="25" />](https://www.buymeacoffee.com/pmahend1)
