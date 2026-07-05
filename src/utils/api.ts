const isDevPreview = typeof window !== 'undefined' && (
  window.location.hostname.includes('ais-dev-') || 
  window.location.hostname.includes('ais-pre-') || 
  window.location.hostname.includes('localhost') || 
  window.location.hostname.includes('127.0.0.1')
);

export const API_BASE_URL = isDevPreview 
  ? '' 
  : 'https://ais-pre-qm52vxdzuxj4dlgydute3w-480253249306.asia-southeast1.run.app';
