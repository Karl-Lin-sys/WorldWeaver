export interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}
