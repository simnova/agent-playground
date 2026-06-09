import mongoose from 'mongoose';

export interface IAgentMetric {
  timestamp: Date;
  sessionId?: string;
  mainModel?: string;
  subagentCount?: number;
  totalSampledModelMs?: number;
  distinctModels?: string[];
  notes?: string;
  rawSummary?: Record<string, any>;
}

const AgentMetricSchema = new mongoose.Schema<IAgentMetric>({
  timestamp: { type: Date, default: Date.now, index: true },
  sessionId: { type: String, index: true },
  mainModel: String,
  subagentCount: Number,
  totalSampledModelMs: Number,
  distinctModels: [String],
  notes: String,
  rawSummary: { type: mongoose.Schema.Types.Mixed },
});

export const AgentMetric = mongoose.model<IAgentMetric>('AgentMetric', AgentMetricSchema);
