export interface AgentResult {
  roast: string;
  truth: string;
}

export interface GraphFile {
  id: string;
  name: string;
  path: string;
  modifiedAt: string;
  views: number;
  meetingContext?: string;
  author?: string;
  approver?: string;
}

export interface ValyriaPayload {
  chaos: string;
  candidates: GraphFile[];
}

export interface WalkChange {
  id: string;
  title: string;
  before: string;
  after: string;
  approver?: string;
  deletedBy?: string;
}

export interface WalkPayload {
  chaos: string;
  changes: WalkChange[];
}

export interface TicketComment {
  author: string;
  text: string;
  createdAt: string;
}

export interface TicketThread {
  id: string;
  url: string;
  title: string;
  comments: TicketComment[];
  resolution?: string;
  saver?: string;
}

export interface BellPayload {
  chaos: string;
  threads: TicketThread[];
}

export interface OrchestratorResultAgentRun extends AgentResult {
  agent: 'valyria' | 'walk' | 'bell';
}

export interface OrchestratorResult {
  type: 'deck' | 'prd' | 'ticket' | 'unknown';
  agents: OrchestratorResultAgentRun[];
  fusedMarkdown: string;
  json: any;
  checksum: string;
}
