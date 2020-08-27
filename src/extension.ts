import * as vscode from "vscode";
import * as edge from "electron-edge-js";
let extPath = "";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerTextEditorCommand(
    "prettyxml.prettifyxml",
    async () => {
      extPath = context.extensionPath;

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          cancellable: false,
          title: "Pretty XML",
        },
        async (progress) => {
          progress.report({ message: "Formatting document..." });

          await format();
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 1000);
          });
        }
      );
    }
  );

  context.subscriptions.push(disposable);
}

async function format() {
  if (extPath === "") {
    vscode.window.showErrorMessage("Error in finding extension path");
  }
  var dllPath = extPath + String.raw`/lib/XmlFormatter.dll`;
  try {
    let editor = vscode.window.activeTextEditor;
    if (editor) {
      let document = editor.document;

      var start = new vscode.Position(0, 0);

      var lastButOne = document.lineAt(document.lineCount - 1);

      var end = new vscode.Position(
        document.lineCount,
        lastButOne.range.end.character
      );

      var ranger = new vscode.Range(start, end);

      var docText = document.getText();
      if (docText) {
        var formatCSharp = edge.func({
          assemblyFile: dllPath,
          typeName: "XmlFormatter.Formatter",
          methodName: "Format",
        });

        await formatCSharp(docText, function (error: any, result: any) {
          if (result) {
            editor?.edit((editBuilder) => {
              editBuilder.replace(ranger, result + "");
            });
            console.log("Document formatted!");
          } else if (error) {
            vscode.window.showErrorMessage(error + "");
            console.error(error);
          }
        });
      }
    }
  } catch (error) {
    vscode.window.showErrorMessage(error + "");
    console.error(error + "");
  }
}
export function deactivate() {}
