export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initAnalyticsProcessor } = await import('@/modules/analytics');
    try {
      initAnalyticsProcessor();
    } catch (e) {
      console.error('Failed to initialize analytics processor:', e);
    }
  }
}
