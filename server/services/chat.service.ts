import { ChatBufferService } from "./chat-buffer.service.ts";
import { db, admin } from "../config/firebase.ts";
import { SSEService } from "./sse.service.ts";

export class ChatService {
  static async sendMessage(
    chatId: string,
    senderId: string,
    partnerId: string,
    content: string,
    type: string = "text",
    offerData: any = null
  ) {
    // 1. Proveri i osiguraj da konverzacija postoji
    const convRef = db.collection("conversations").doc(chatId);
    const convSnap = await convRef.get();
    if (!convSnap.exists) {
      const participants = [senderId, partnerId].sort();
      await convRef.set({
        participants,
        lastMessage: "",
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        unreadCount: { [partnerId]: 0, [senderId]: 0 },
      }, { merge: true });
    }

    // 2. Prosledi poruku u optimizovani ChatBufferService
    const msgId = await ChatBufferService.enqueueMessage(chatId, senderId, content, type, offerData, partnerId);

    // 3. Stream message in real-time over SSE bypassing Firestore reads
    const chatMsgPayload = {
      id: msgId,
      chatId,
      senderId,
      text: content,
      type,
      offerData,
      createdAt: new Date().toISOString()
    };
    await SSEService.publish(partnerId, "chat_message", chatMsgPayload);
    await SSEService.publish(senderId, "chat_message", chatMsgPayload);

    return { success: true, conversationId: chatId, messageId: msgId };
  }

  static async reportConversation(chatId: string, reporterId: string, reason: string) {
    const reportRef = db.collection("reports").doc();
    await reportRef.set({
      chatId,
      reporterId,
      reason,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending"
    });
    return { success: true };
  }

  static async markAsRead(chatId: string, uid: string) {
    const convRef = db.collection("conversations").doc(chatId);
    const convSnap = await convRef.get();
    if (convSnap.exists) {
      const data = convSnap.data()!;
      const unreadCount = { ...(data.unreadCount || {}) };
      if (unreadCount[uid] > 0) {
        const toSubtract = unreadCount[uid];
        unreadCount[uid] = 0;
        await convRef.update({ unreadCount });
        await db.collection("users").doc(uid).set(
          { "totalUnreadMessages": admin.firestore.FieldValue.increment(-toSubtract) },
          { merge: true }
        );
      }
    }
    return { success: true };
  }
}
