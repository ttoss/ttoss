export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Minimal generation interface shared by both model providers. One call =
 * one completion; conversation state (the repair loop) is threaded by the
 * runner through `messages`.
 */
export interface Provider {
  name: 'anthropic' | 'gemini';
  model: string;
  generate(params: {
    system: string;
    messages: ChatMessage[];
  }): Promise<string>;
}
