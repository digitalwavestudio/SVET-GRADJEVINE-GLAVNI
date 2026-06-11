import { CacheService } from './server/services/cache.service.ts';
(async () => {
  try {
    await CacheService.invalidateByPrefix('admin_moderation_queue_');
    console.log('✅ Cache for moderation queue invalidated');
  } catch (e) {
    console.error('❌ Error invalidating cache', e);
  }
})();
