const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

function checkIfLineIsInLanguageRegex(languageDict, document, position) {
  const line = document.lineAt(position);
  const text = line.text;
  for (const patternName in languageDict) {
    let regexCheck = text.match(languageDict[patternName].regexParsed);
    if (regexCheck) {
      return true;
    }
  }
  return false;
}

function checkForInLanguageRegexJson(languageDict, document, position, simpleCheck = false) {
  const line = document.lineAt(position);
  
  const text = line.text;
  if(simpleCheck)
   console.log(text, position.e)
  if(!simpleCheck) {
    const firstSemiColon = text.indexOf(";") - 1;
    if (firstSemiColon > -1 && firstSemiColon < position.e) {
      return null;
    }
    if (text[position.e] == " ") return null;
  }
  for (const patternName in languageDict) {
    // if the following match is 16 then there's no spaces in the binary number. assume binary.
    let binaryNumberReg = text.match(/^ *([10]*)/)
    let binaryNumberReg4Group = text.match(/^ *([10]{4} [10]{4} [10]{4} [10]{4})/)

    if(binaryNumberReg4Group || (binaryNumberReg && binaryNumberReg[1].length == 16)) {
      if(patternName != "constant.numeric.binary.lcc") continue;
    }

    let regexCheck = null;
    if(languageDict[patternName].isAssembly)
      regexCheck = text.match(languageDict[patternName].regexParsed);
    else
      regexCheck = text.replace(/ /g, "").match(languageDict[patternName].regexParsed);

    // Assembly Check
    if(regexCheck && languageDict[patternName].isAssembly) {
      if(simpleCheck){
        console.log("valid")
        return true;
      }
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
      return `${header}${description}`
    }


    if (regexCheck && !languageDict[patternName].isAssembly) {
      if(simpleCheck){
        console.log("valid")
        return true;
      }
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
      let binaryFormat = matchObj.binary_format
        ? `Binary format: ${matchObj.binary_format}\n`
        : "";
      let flags = `Flags set: ${
        matchObj.flags_set ? matchObj.flags_set : "None"
      }`;
      let explaination = matchObj.explaination
        ? `\n${matchObj.explaination}\n`
        : "";
      let whatIsCalculated =
        matchObj.binary_format.indexOf("offset") > -1 ? "Offset" : "Value";

      let calculatedOffset = "";
      if (regexCheck && regexCheck[1]) {
        let decimalNumber = binaryStringToDecimal(regexCheck[1]);
        let lineText = "";
        if (whatIsCalculated === "Offset") {
          let validLines = 0;
          let i = 0;
          for (i = position.line; i < document.lineCount; i++) {
            if (
              checkForInLanguageRegexJson(
                languageDict,
                document,
                new vscode.Position(i, 0),
                true
              )
            ) {
              validLines++;
              if (validLines == decimalNumber + 2) {
                break;
              }
            }
          }
          let vscodeLineNumber =i;
          if (vscodeLineNumber >= document.lineCount) {
            // invalid line number
            lineText = `Offset pointing to vscode line ${vscodeLineNumber + 1} is out of bounds\n`;
          } else {
            let line = document.lineAt(vscodeLineNumber);
            lineText = `Offset pointing to vscode line ${vscodeLineNumber + 1}: \n${line.text.trim()}\n`;
          }
        }
        // if the decimal number is a printable character, convert it to a char
        let decimalToChar =
          decimalNumber >= 32 && decimalNumber <= 126
            ? String.fromCharCode(decimalNumber)
            : null;
        let decimalToCharStr = decimalToChar ? ` = '${decimalToChar}' =` : "";
        calculatedOffset = `${whatIsCalculated}: ${regexCheck[1].trim()} = ${decimalNumber}${decimalToCharStr} 0x${decimalNumber.toString(
          16
        )}\n${lineText}`;
      }
      return `${header}${description}${binaryFormat}${calculatedOffset}${flags}${explaination}`;
    }
  }
  return false;
}

function binaryStringToDecimal(binaryString) {
  let binaryNumber = binaryString.replace(/\s/g, "");
  let isNegative = binaryNumber[0] === "1";
  let decimalNumber;

  if (isNegative) {
    // Flip the bits
    binaryNumber = binaryNumber
      .split("")
      .map((bit) => (bit === "1" ? "0" : "1"))
      .join("");
    // Add 1
    decimalNumber = parseInt(binaryNumber, 2) + 1;
    // Make the number negative
    decimalNumber = -decimalNumber;
  } else {
    decimalNumber = parseInt(binaryNumber, 2);
  }

  return decimalNumber;
}

function loadRegexJson(languageDict, context, jsonFilePathStr) {
  const jsonFilePath = path.join(context.extensionPath, jsonFilePathStr);

  // Load the JSON file
  const fullRegexData = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
  const binaryRegex = fullRegexData["repository"]["binary"]["patterns"];
  const assemblyRegex = fullRegexData["repository"]["assembly"]["patterns"];

  for (const pattern of assemblyRegex) {
    // iterate over array
    languageDict[pattern.name] = pattern;
    languageDict[pattern.name].regexParsed = new RegExp(
      languageDict[pattern.name].match
    ); // cache the regex
    languageDict[pattern.name].isAssembly = true;
  }

  for (const pattern of binaryRegex) {
    // iterate over array
    languageDict[pattern.name] = pattern;
    let firstSpace = false;
    let str = languageDict[pattern.name].match; // ignoreSpacesInBinaryRegexString 
    str = str.replace(/ /g, function (match) {
      if (!firstSpace) {
        firstSpace = true;
        return match;
      } else {
        return "";
      }
    });
    languageDict[pattern.name].regexParsed = new RegExp(
      str //languageDict[pattern.name].match
    ); // cache the regex
    languageDict[pattern.name].isAssembly = false;
  }
}

function activate(context) {
  const languageDict = {};
  loadRegexJson(languageDict, context, path.join('syntaxes', 'lcc.tmLanguage.json'));

  context.subscriptions.push(
    vscode.languages.registerHoverProvider("lcc", {
      provideHover(document, position, token) {
        const info = checkForInLanguageRegexJson(
          languageDict,
          document,
          position
        );
        if (info) {
          return new vscode.Hover(
            new vscode.MarkdownString("```lcc\n" + info + "\n```")
          );
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
