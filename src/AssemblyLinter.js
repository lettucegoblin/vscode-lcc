const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class AssemblyLinter {
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('assembly');
        // this.outputChannel = vscode.window.createOutputChannel('Assembly Linter');
    }

    severityStrToEnum(severity) {
        switch (severity) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'info':
                return vscode.DiagnosticSeverity.Information;
            case 'hint':
                return vscode.DiagnosticSeverity.Hint;
            default:
                return vscode.DiagnosticSeverity.Error;
        }
    }

    lintDocument(document) {
        const diagnostics = [];
        const text = document.getText();
    
        // Load the linting rules from the JSON file
        const rulesPath = path.join(__dirname, 'rules.json');
        const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8')).rules;
    
        for (const rule of rules) {
            const regex = new RegExp(rule.pattern, 'g');
            const validPattern = new RegExp(`^${rule.validPattern}$`);
            let match;
    
            while (match = regex.exec(text)) {
                const follower = match[1];
                const start = document.positionAt(match.index);
                const end = document.positionAt(match.index + match[0].length);
                const range = new vscode.Range(start, end);
    
                // Get the entire line of text
                const lineText = document.lineAt(start.line).text;
    
                // Check if the line contains a semicolon before the match
                const commentIndex = lineText.indexOf(';');
                if (commentIndex !== -1 && commentIndex < start.character) {
                    // this.outputChannel.appendLine(`Ignoring comment: ${lineText}`);
                    continue;
                }

                // Log when "dout" is detected
                // if (rule.name === "bad register for dout") {
                //     this.outputChannel.appendLine(`Detected "dout" on line: ${lineText}`);
                // }
    
                // this.outputChannel.appendLine(`Checking line: ${lineText}`); // TODO: remove after debugging
    
                if (!validPattern.test(follower)) {
                    const message = rule.message.replace('{follower}', follower);
                    const severity = vscode.DiagnosticSeverity[rule.severity.toLowerCase()];
                    const diagnostic = new vscode.Diagnostic(range, message, this.severityStrToEnum(severity));
                    diagnostics.push(diagnostic);
                }
            }
        }
    
        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    dispose() {
        this.diagnosticCollection.clear();
        this.diagnosticCollection.dispose();
        // this.outputChannel.dispose(); // TODO: remove after debugging
    }
}

module.exports = AssemblyLinter;
