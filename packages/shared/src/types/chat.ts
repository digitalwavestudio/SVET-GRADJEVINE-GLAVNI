export interface ChatMessagePayload {
  message: string;
  timestamp?: number;
  senderId?: string;
  recipientId?: string;
  chatId?: string;
  read?: boolean;
  messageType?: 'text' | 'image' | 'file';
}
