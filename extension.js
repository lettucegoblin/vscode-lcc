
const vscode = require("vscode");
const fs = require('fs');
const path = require('path');

function checkForInLanguageRegexJson(languageDict, document, position) {
	const line = document.lineAt(position);
	const text = line.text;
	for (const patternName in languageDict) {
		if (text.match(languageDict[patternName].regexParsed)) {
			let matchObj = languageDict[patternName];
			let header = "";
			if (matchObj.descriptive_name) {
				if (matchObj.Mnemonic) {
					header = `${matchObj.Mnemonic}(${matchObj.descriptive_name}): `;
				} else {
					header = `${matchObj.descriptive_name}: `;
				}
			}
			
			let description = matchObj.description ? matchObj.description + "\n" : "";
			let binaryFormat = matchObj.binary_format ? `Binary format: ${matchObj.binary_format}\n` : "";
			let flags = `Flags set: ${matchObj.flags_set ? matchObj.flags_set : "None"}`;
			let explaination = matchObj.explaination ? `\n${matchObj.explaination}` : "";
			return `${header}${description}${binaryFormat}${flags}${explaination}`
		}
	}
	return null;
}

function loadRegexJsonOld(languageDict, context, jsonFilePathStr) {
	const jsonFilePath = path.join(context.extensionPath, jsonFilePathStr);

	// Load the JSON file
	const regexData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
	for (const patternName in regexData) {
		languageDict[patternName] = regexData[patternName];
		languageDict[patternName].regexParsed = new RegExp(languageDict[patternName].regex);
	}
}
function loadRegexJson(languageDict, context, jsonFilePathStr) {
	const jsonFilePath = path.join(context.extensionPath, jsonFilePathStr);

	// Load the JSON file
	const fullRegexData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
	const binaryRegex = fullRegexData["repository"]["binary"]["patterns"];

	for (const pattern of binaryRegex) { // iterate over array
		languageDict[pattern.name] = pattern;
		languageDict[pattern.name].regexParsed = new RegExp(languageDict[pattern.name].match); // cache the regex
	}
}

function activate(context) {
	const languageDict = {};
	loadRegexJson(languageDict, context, "syntaxes\\lcc.tmLanguage.json");

  context.subscriptions.push(
    vscode.languages.registerHoverProvider("lcc", {
      provideHover(document, position, token) {
				const info = checkForInLanguageRegexJson(languageDict, document, position);
				if (info) {
					return new vscode.Hover(new vscode.MarkdownString("```lcc\n" + info + "\n```"));
				}
      },
    })
  );
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
