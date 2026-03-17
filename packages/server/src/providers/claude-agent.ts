import type {
  AgentCapableProvider,
  AgentSessionHandle,
  ChatParams,
  ChatStreamEvent,
  ClaudeAgentProviderConfig,
  ContextSnapshot,
} from '@mychat/shared';

const NOT_IMPLEMENTED = 'Claude Agent SDK provider not yet implemented';

/**
 * STUB: Claude Agent SDK provider.
 *
 * This provider will integrate with Anthropic's Agent SDK to enable
 * tool-use and autonomous workflows. Currently a placeholder — all
 * methods throw until the Agent SDK is integrated.
 *
 * TODO: Install and import the Agent SDK
 * TODO: Implement session management (create, resume, fork)
 * TODO: Map ContextSnapshot to the Agent SDK's context format
 * TODO: Handle tool execution permissions (permissionMode config)
 * TODO: Stream agent events back as ChatStreamEvent
 */
export class ClaudeAgentProvider implements AgentCapableProvider {
  readonly name = 'claude-agent';
  readonly agentCapable = true as const;

  private _config: ClaudeAgentProviderConfig;

  constructor(config: ClaudeAgentProviderConfig) {
    this._config = config;
  }

  /**
   * Standard chat — will delegate to the Agent SDK's chat mode
   * (without tool use) when implemented.
   */
  async *chat(_params: ChatParams): AsyncIterable<ChatStreamEvent> {
    throw new Error(NOT_IMPLEMENTED);
  }

  /**
   * Creates a new agent session with the given context.
   * Will initialize the Agent SDK with allowed tools and permission mode.
   */
  async createAgentSession(
    _context: ContextSnapshot,
  ): Promise<AgentSessionHandle> {
    throw new Error(NOT_IMPLEMENTED);
  }

  /**
   * Resumes an existing agent session by ID.
   * Will reconnect to the Agent SDK's session state.
   */
  async resumeAgentSession(
    _sessionId: string,
  ): Promise<AgentSessionHandle> {
    throw new Error(NOT_IMPLEMENTED);
  }
}
