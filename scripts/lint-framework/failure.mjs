export class LintFailure {
  constructor({ ruleId, file, line = 1, column = 1, message }) {
    this.ruleId = ruleId;
    this.file = file;
    this.line = line;
    this.column = column;
    this.message = message;
  }

  format() {
    return `${this.file}:${this.line}:${this.column} [${this.ruleId}] ${this.message}`;
  }
}
