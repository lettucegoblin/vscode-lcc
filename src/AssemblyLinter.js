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


    toggleErrorUnderlining() {
        const config = vscode.workspace.getConfiguration('lccAssembly');
        const enableErrorUnderlining = config.get('enableErrorUnderlining');
        config.update('enableErrorUnderlining', !enableErrorUnderlining, true);
    }

    toggleWarningUnderlining() {
        const config = vscode.workspace.getConfiguration('lccAssembly');
        const enableWarningUnderlining = config.get('enableWarningUnderlining');
        config.update('enableWarningUnderlining', !enableWarningUnderlining, true);
    }

    lintCurrentDocument() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            this.clearDiagnostics();
            this.lintDocument(editor.document);
            
        }
    }

    clearDiagnostics() {
        this.diagnosticCollection.clear();
    }

    lintDocument(document) {
        // Check if the document is an LCC document
        if (document.languageId !== 'lcc') {
            // This is not an LCC document, so we don't need to lint it
            return;
        }

        // Check if error and warning underlining are enabled
        const config = vscode.workspace.getConfiguration('lccAssembly');
        const enableErrorUnderlining = config.get('enableErrorUnderlining');
        const enableWarningUnderlining = config.get('enableWarningUnderlining');

        const diagnostics = [];
        const lines = document.getText().split('\n');
    
        // Load the linting rules from the JSON file
        const rulesPath = path.join(__dirname, 'rules.json');
        const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8')).rules;
    
        for (const rule of rules) {
            const regex = new RegExp(rule.pattern, 'g');
            const validPattern =  new RegExp(`^${rule.validPattern}$`);
    
            lines.forEach((lineText, lineNumber) => {
                let match;
    
                while (match = regex.exec(lineText)) {
                    if (match[0] === '') {
                        break;
                    }

                    const follower = match[1];
                    const start = new vscode.Position(lineNumber, match.index + match[0].indexOf(follower));
                    const end = new vscode.Position(lineNumber, match.index + match[0].indexOf(follower) + follower.length);
                    const range = new vscode.Range(start, end);
    
                    // Check if the line contains a semicolon before the match
                    const commentIndex = lineText.indexOf(';');
                    if (commentIndex !== -1 && commentIndex < start.character) {
                        continue;
                    }
    
                    if (!validPattern.test(follower)) {
                        let message = rule.message.replace('{follower}', follower);
                        const severity = this.severityStrToEnum(rule.severity.toLowerCase());
                        const diagnostic = new vscode.Diagnostic(range, message, severity);
                        if ((severity === vscode.DiagnosticSeverity.Error && enableErrorUnderlining) ||
                            (severity === vscode.DiagnosticSeverity.Warning && enableWarningUnderlining)) {
                            diagnostics.push(diagnostic);
                        }
                    }
                }
            });
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
