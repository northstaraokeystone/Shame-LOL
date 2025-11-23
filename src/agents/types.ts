export interface ChaosInput {
  input: string;
  type?: 'deck' | 'prd' | 'ticket';
}

export interface TruthOutput {
  canonical?: string;
  changes?: string[];
  resolution?: string;
  receipts: string[];
}

export interface Roast {
  valyria: string;
  walk: string;
  bell: string;
  longclaw: string;
}

export interface AgentResult {
  roast: string;
  truth: TruthOutput;
}
