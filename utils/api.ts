/**
 * API設定の共通ユーティリティ
 * 全てのコンポーネントで統一されたAPI URL取得ロジックを提供
 */

export const getApiBaseUrl = (): string => {
  // 環境変数が設定されている場合は最優先
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('API URL (環境変数):', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    console.log('現在のURL情報:', { hostname, protocol, port });
    
    // 本番環境の判定を拡張
    const isProduction = 
      hostname.includes('azurewebsites.net') ||
      hostname.includes('herokuapp.com') ||
      hostname.includes('vercel.app') ||
      hostname.includes('netlify.app') ||
      hostname.includes('railway.app') ||
      (!hostname.includes('localhost') && !hostname.includes('127.0.0.1') && hostname !== '');
    
    if (isProduction) {
      const apiUrl = `${protocol}//${hostname}`;
      console.log('本番環境API URL:', apiUrl);
      return apiUrl;
    }
    
    // ローカル開発環境の場合 - HTTPモードのバックエンドに対応
    const localUrl = `http://${hostname}:8000`;
    console.log('ローカル開発環境API URL:', localUrl);
    return localUrl;
  }
  
  // フォールバック - HTTPモードに変更
  console.log('フォールバックAPI URL: http://localhost:8000');
  return 'http://localhost:8000';
};

/**
 * API エンドポイントの定数定義
 */
export const API_ENDPOINTS = {
  // 新しいAPI（Lv1仕様）
  PRODUCTS_V1: '/api/v1/products',
  PURCHASE_V1: '/api/v1/purchase',
  
  // 旧API（互換性のため）
  PRODUCTS_LEGACY: '/products',
  PURCHASE_LEGACY: '/purchase',
} as const;

/**
 * 商品検索API URL取得
 */
export const getProductSearchUrl = (code: string): string => {
  return `${getApiBaseUrl()}${API_ENDPOINTS.PRODUCTS_V1}/${code}`;
};

/**
 * 商品検索API URL取得（旧API）
 */
export const getProductSearchUrlLegacy = (code: string): string => {
  return `${getApiBaseUrl()}${API_ENDPOINTS.PRODUCTS_LEGACY}/${code}`;
};

/**
 * 購入処理API URL取得
 */
export const getPurchaseUrl = (): string => {
  return `${getApiBaseUrl()}${API_ENDPOINTS.PURCHASE_V1}`;
};

/**
 * 購入処理API URL取得（旧API）
 */
export const getPurchaseUrlLegacy = (): string => {
  return `${getApiBaseUrl()}${API_ENDPOINTS.PURCHASE_LEGACY}`;
}; 