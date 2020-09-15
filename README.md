<img src='images/logo.png' width=200 height=200>

# Pretty XML

Pretty XML is a XML formatter extension for Visual Studio Code. It formats XML documents just like Visual Studio. This is in preview mode. Suggestions , improvement PRs are welcome.

## Features

### Prettify XML (XML Formatting) :   

Right Click and Select Prettify XML.

- First attribute on same line as start tag.
- All attributes indented in line with first attribute.
- If no child for an element then close inline end tag.(Setting)
- No empty lines.
 
## Keyboard Shortcuts

**Cmd+K L** - Mac  
**Control+K L** - Windows, Linux or Web  

<img src='./images/example.gif'>

## Formatted Document Example  

<img src='./images/screenshot.png'>

## Settings 

| Setting Key                          | Default Value | Column3                                    |
| ------------------------------------ | ------------- | ------------------------------------------ |
| prettyxml.settings.indentSpaceLength | 2             | No. of spaces for indentation.             |
| prettyxml.settings.useSingleQuotes   | false         | Use ' instead of \"                        |
| prettyxml.settings.useSelfClosingTag | true          | If no child nodes then self closing tag /> |

<img src='./images/settings.png'>  

## Requirements

VS Code 1.47 or higher.

## Installation

[Download at Visual Studio MarketPlace](https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.prettyxml)

> [!IMPORTANT]
> You will need .Net SDK or Mono installed on your machine.

## Known Issues

Limited DTD, XSD support.
Issues can be reported at [Issues sections](https://github.com/pmahend1/PrettyXML/issues)  

## Release Notes

See [Change Log](./CHANGELOG.md)

### For more information

* [Source Code](https://github.com/pmahend1/prettyxml)
