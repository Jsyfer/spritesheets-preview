// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode
import * as vscode from "vscode";
import path from "path";
import fs from "fs";

// This method is called when extension is activated
// extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Track the current panel with a webview
  let panel: vscode.WebviewPanel | undefined = undefined;
  let panel_dict: { [id: string]: vscode.WebviewPanel } = {};

  const spritesheets_preview_disposable = vscode.commands.registerCommand("spritesheets-preview.preview", (...file) => {
    let target_document_list: any[] = [];

    // handle target file
    if (file[1].length === undefined) {
      // case open from editor menu
      const opened_document: any = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
      target_document_list.push({
        fileName: path.basename(opened_document.uri.path),
        uri: opened_document.uri,
      });
    } else {
      // case open from right click menu
      const target_file = file[1].slice(-1)[0];
      target_document_list.push({
        fileName: path.basename(target_file.path),
        uri: target_file,
      });
    }
    const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    let preview_title = "Preview";
    if (target_document_list.length === 1) {
      preview_title = target_document_list[0].fileName + " Preview";
    }

    panel = panel_dict[preview_title];
    if (panel) {
      // If we already have a panel associate with the target file, show it in the target column
      panel.reveal(columnToShowIn);
    } else {
      // Create and show a new webview
      panel = vscode.window.createWebviewPanel(
        "SpritesheetsPreview", // Identifies the type of the webview. Used internally
        preview_title, // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
          enableScripts: true, // Enable java scripts in the webview
          retainContextWhenHidden: true, // retain context when hidden
        }
      );
      // add new created panel to dict
      panel_dict[preview_title] = panel;
      // get the special URI to use with the webview
      const pixi_js = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "preview", "js", "pixi.min.js"));
      const refer_tools_js = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "preview", "js", "refer_tools.js"));
      // prepare image data
      let image_path: string = target_document_list[0].uri.path;
      const image_json = require(image_path.replace(".png", ".json"));
      const image_data = fs.readFileSync(image_path, { encoding: "base64" });
      const links = {
        pixi_js: pixi_js,
        refer_tools_js: refer_tools_js,
        image_data: "data:image/png;base64," + image_data.replace("vscode-webview://", ""),
      };
      // set HTML content
      panel.webview.html = getHtmlForWebview(links);
      // send data from vscode to webview
      panel.webview.postMessage({
        image_json: image_json,
      });
      // remove panel when the current panel is closed
      panel.onDidDispose(
        () => {
          delete panel_dict[preview_title];
        },
        null,
        context.subscriptions
      );
    }
  });
  context.subscriptions.push(spritesheets_preview_disposable);
}

const getHtmlForWebview = (links: any) => {
  return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Log Preview</title>
            </head>
            <body>
                <img style="display:none;" src="${links.image_data}" />
                <script src="${links.pixi_js}"></script>
                <script type="module" src="${links.refer_tools_js}"></script>
            </body>
            </html>`;
};

// This method is called when extension is deactivated
export function deactivate() {}
