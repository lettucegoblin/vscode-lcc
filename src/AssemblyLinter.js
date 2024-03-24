const vscode = require('vscode');

class AssemblyLinter {
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('assembly');
    }

    lintDocument(document) {
        const diagnostics = [];

        // Perform linting logic here and populate `diagnostics` array with Diagnostic objects
        const text = document.getText();
        const regex = /dout[ ]*(\w*)/g;
        let match;

        while (match = regex.exec(text)) {
            const register = match[1] || '';
            const validRegisters = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'fp', 'sp', 'lr', ''];

            if (!validRegisters.includes(register)) {
                const start = document.positionAt(match.index);
                const end = document.positionAt(match.index + match[0].length);
                const range = new vscode.Range(start, end);
                const message = `'dout' must be followed by r0, r1, r2, r3, r4, r5, r6, r7, fp, sp, lr or nothing, but got '${register}'`;
                const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
                diagnostics.push(diagnostic);
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
