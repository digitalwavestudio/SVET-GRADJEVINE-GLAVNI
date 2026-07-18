import { getLazyAuth } from '@/src/lib/firebase';
import { withRetry } from '@/src/lib/retry';
import { BACKEND_TASKS } from '@/src/modules/core/types/backendTasks';
import { ModerationActionContract } from '@/src/modules/dashboard/types/moderationContracts';
import { notificationService } from '@/src/services/notificationService';
import { apiClient } from '@/src/lib/apiClient';

export type ModerationItemType = 'POSAO' | 'SMEŠTAJ' | 'KETERING' | 'FIRMA' | 'MAŠINA' | 'NEKRETNINA' | 'MAJSTOR';

export interface ModerationItem {
  id: string;
  _collection: string;
  _typeLabel: ModerationItemType;
  title: string;
  createdAt?: string | number | { seconds: number; nanoseconds: number };
  status?: string;
  userId?: string;
  employerId?: string;
  authorId?: string;
  [key: string]: unknown;
}

export interface ModerationQueueResponse {
  items: ModerationItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

const COLLECTION_MAP: Record<string, { type: ModerationItemType; label: string; collectionName: string }> = {
  job: { type: 'POSAO', label: 'POSAO', collectionName: 'jobs' },
  company: { type: 'FIRMA', label: 'FIRMA', collectionName: 'companies' },
};

export const moderationService = {
  /**
   * AI Image Moderation
   * Analyzes an image URL for inappropriate content via Backend Proxy.
   */
  async moderateImageAI(imageUrl: string): Promise<{ isSafe: boolean; reason?: string; confidence?: number }> {
    try {
      const result = await apiClient.post<{ isSafe: boolean; reason?: string; confidence?: number }>('/ai/moderate-image', { imageUrl });
      console.info(`🤖 [AI_MODERATION] Analysis complete for ${imageUrl}:`, result);
      return result;
    } catch (error) {
      console.error("❌ [AI_MODERATION] Error scanning image:", error);
      // Fallback: If AI fails, we allow it for human moderation later (safety first, but don't block user experience if API is down)
      return { isSafe: true, confidence: 0 };
    }
  },

  /**
   * Scans multiple images and returns first found issue
   */
  async moderateGalleryAI(imageUrls: string[]): Promise<{ isSafe: boolean; reason?: string }> {
    if (!imageUrls || imageUrls.length === 0) return { isSafe: true };

    // Scan images in parallel for speed
    const results = await Promise.all(imageUrls.map(url => this.moderateImageAI(url)));
    
    const unsafeResults = results.filter(r => !r.isSafe);
    if (unsafeResults.length > 0) {
      return { 
        isSafe: false, 
        reason: unsafeResults[0].reason || 'Jedna ili više slika ne ispunjavaju uslove korišćenja.' 
      };
    }

    return { isSafe: true };
  },

  /**
   * Fetches all pending items from all configured collections via backend API
   */
  async fetchPendingQueue(cursor?: string, limit: number = 25, searchQuery?: string): Promise<ModerationQueueResponse> {
    return withRetry(async () => {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (cursor) params.append('cursor', cursor);
      if (searchQuery) params.append('searchQ', searchQuery);

      return await apiClient.get<ModerationQueueResponse>(`/admin/moderation-queue?${params.toString()}`);
    });
  },

  /**
   * Main entry point for moderation logic.
   * Executes via the Backend API for full synchronization and auditing.
   */
  async executeModerationAction(contract: ModerationActionContract, itemData?: ModerationItem): Promise<void> {
    return withRetry(async () => {
      console.info(`🛡️ [BACKEND] Moderate Action:`, contract);

      const status = contract.action === 'approve' ? 'approved' : 'rejected';
      
      await apiClient.post(`/admin/moderate/${contract.collectionName}/${contract.targetId}`, {
        status,
        feedback: contract.reason
      });

      // 3. Trigger notification (Frontend only for immediate feedback logic if allowed)
      const userId = itemData?.userId || itemData?.employerId || itemData?.authorId;
      if (userId && (contract.action === 'approve' || contract.action === 'reject')) {
        await notificationService.trigger(
          contract.action === 'approve' ? 'MODERATION_APPROVED' : 'MODERATION_REJECTED',
          {
            userId,
            targetId: contract.targetId,
            title: contract.action === 'approve' ? 'Sadržaj odobren' : 'Sadržaj odbijen',
            message: contract.action === 'approve' 
              ? `Vaš oglas "${itemData?.title || 'Oglas'}" je odobren.`
              : `Vaš oglas "${itemData?.title || 'Oglas'}" je odbijen. Razlog: ${contract.reason || 'Nije naveden'}.`,
            metadata: { 
              collection: contract.collectionName, 
              action: contract.action, 
              itemTitle: itemData?.title 
            },
            priority: contract.action === 'approve' ? 'medium' : 'high'
          }
        );
      }

      console.info(`✅ [MODERATION] Action ${contract.action} successfully processed`);
    });
  },

  /**
   * Approves an item (Deprecated - Redirecting to executeModerationAction)
   */
  async approveItem(collectionName: string, id: string, itemData?: ModerationItem, adminId: string = 'system'): Promise<void> {
    return this.executeModerationAction({
      adminId,
      collectionName,
      targetId: id,
      action: 'approve'
    }, itemData);
  },

  /**
   * Rejects an item (Deprecated - Redirecting to executeModerationAction)
   */
  async rejectItem(collectionName: string, id: string, reason?: string, itemData?: ModerationItem, adminId: string = 'system'): Promise<void> {
    return this.executeModerationAction({
      adminId,
      collectionName,
      targetId: id,
      action: 'reject',
      reason
    }, itemData);
  },

  /**
   * Verifies/Unverifies a user or company via backend API
   */
  async verifyUser(targetUserId: string, isVerified: boolean): Promise<void> {
    return withRetry(async () => {
      await apiClient.post('/admin/verify-user', { targetUserId, isVerified });
      console.info(`✅ [VERIFICATION] User ${targetUserId} status updated to ${isVerified}`);
    });
  }
};
