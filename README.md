<img src='images/logo.png' width=200 height=200>  

# Pretty XML

Pretty XML is a XML formatter extension for Visual Studio Code. It formats XML documents just like Visual Studio. This is in preview mode. Suggestions , improvement PRs are welcome.

## Features

### Prettify XML (XML Formatting) :   
Keyboard shortcut : **Ctrl+P F** or Right Click and Select Prettify XML.
- First attribute on same line as start tag.
- All attributes indented in line with first attribute.
- If no child for an element then close inline end tag.
- No empty lines.
 
<img src='./example.gif'>

### Formatted Document Example
 
<img src='./screenshot.png'>

## Requirements

VS Code 1.47 or higher.

## Known Issues

Limited DTD, XSD support.
Issues can be reported at [Issues sections](https://github.com/pmahend1/PrettyXML/issues)

## Release Notes

### 0.0.8

Fixes [Issue 4- Rewrite &amp; to & (Which break legal xml format)](https://github.com/pmahend1/PrettyXML/issues/4)

### 0.0.7

Initial preview release

### For more information

* [Source Code](https://github.com/pmahend1/prettyxml)