export class DomainRuleViolation extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomainRuleViolation';
    this.code = code;
  }
}
