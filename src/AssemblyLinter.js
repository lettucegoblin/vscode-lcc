const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class AssemblyLinter {
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('assembly');
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
            let match;
    
            while (match = regex.exec(text)) {
                const follower = match[1] || '';
                if (!rule.validFollowers.includes(follower)) {
                    const start = document.positionAt(match.index);
                    const end = document.positionAt(match.index + match[0].length);
                    const range = new vscode.Range(start, end);
                    const message = rule.message.replace('{follower}', follower);
                    const severity = vscode.DiagnosticSeverity[rule.severity.toUpperCase()]; // Convert severity to enum value
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
    }
}

module.exports = AssemblyLinter;
