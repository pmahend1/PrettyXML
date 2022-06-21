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

[![License](https://img.shields.io/github/license/pmahend1/PrettyXML?style=for-the-badge&label=License&color=chocolate)](https://choosealicense.com/licenses/mit/)![Deploy](https://img.shields.io/github/workflow/status/pmahend1/prettyxml/Deploy%20CI?color=darkgreen&label=Deploy%20CI&style=for-the-badge&logo=github&logoColor=black)  
[![Version](https://vsmarketplacebadge.apphb.com/version/PrateekMahendrakar.PrettyXML.svg?logo=visual-studio-code&style=for-the-badge&logoColor=blue&color=blue)](https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.prettyxml)![Installs](https://vsmarketplacebadge.apphb.com/installs-short/PrateekMahendrakar.PrettyXML.svg?style=for-the-badge&label=Installs&color=blue)![Downloads](https://vsmarketplacebadge.apphb.com/downloads-short/PrateekMahendrakar.PrettyXML.svg?style=for-the-badge&label=Downloads&color=blue)![Rating](https://vsmarketplacebadge.apphb.com/rating-short/PrateekMahendrakar.PrettyXML.svg?style=for-the-badge&label=Rating&color=blue)

[![Open VSX](https://img.shields.io/open-vsx/v/PrateekMahendrakar/PrettyXML?color=darkcyan&logoColor=green&style=for-the-badge&logo=data:image/png;base64,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)](https://open-vsx.org/extension/PrateekMahendrakar/prettyxml)![Open VSX Downloads](https://img.shields.io/open-vsx/dt/PrateekMahendrakar/PrettyXML?color=darkcyan&style=for-the-badge)![Open VSX Rating](https://img.shields.io/open-vsx/rating/PrateekMahendrakar/PrettyXml?color=darkcyan&style=for-the-badge)

![prettify gif.](./images/Prettify.gif)

---

## Features

### 1. Prettify XML (XML Formatting)

Right Click and Select Prettify XML or use [shortcut](#keyboard-shortcuts)

-   All attributes on new lines.
-   First attribute on same line as start element start tag.
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
