import { useState, useEffect } from 'react';
import BarcodeScanner from './BarcodeScanner';
import { Product } from '../types/Product'; // ✅ 共通型の読み込み

interface ProductInputProps {
  onProductFound: (product: Product) => void;
  onError?: (error: string) => void;
  onSearchError?: (error: string) => void;
  code?: string;
  onCodeChange?: (code: string) => void;
  className?: string;
}

const ProductInput: React.FC<ProductInputProps> = ({ 
  onProductFound, 
  onError, 
  onSearchError,
  code: externalCode,
  onCodeChange,
  className
}) => {
  const [internalCode, setInternalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const productCode = externalCode !== undefined ? externalCode : internalCode;
  const setProductCode = onCodeChange || setInternalCode;

  const getApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      if (hostname.includes('azurewebsites.net')) {
        return `${protocol}//${hostname}`;
      }
      
      return `https://${hostname}:8443`;
    }
    return 'https://localhost:8443';
  };

  const validateProductCode = (code: string): boolean => {
    return /^\d{13}$/.test(code);
  };

  const handleScanSuccess = (scannedCode: string) => {
    setProductCode(scannedCode);
    setValidationError('');
    handleSearch(scannedCode);
  };

  const handleScanError = (error: string) => {
    if (onError) onError(error);
    if (onSearchError) onSearchError(error);
  };

  const openScanner = () => {
    setShowScanner(true);
  };

  const closeScanner = () => {
    setShowScanner(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '').slice(0, 13);
    setProductCode(numericValue);

    if (validationError) setValidationError('');

    if (numericValue.length > 0 && numericValue.length < 13) {
      setValidationError(`商品コードは13桁の数字である必要があります（現在: ${numericValue.length}桁）`);
    } else if (numericValue.length === 13) {
      setValidationError('');
      setTimeout(() => {
        if (productCode === numericValue) {
          handleSearch(numericValue);
        }
      }, 100);
    }
  };

  const handleSearch = async (code?: string) => {
    const searchCode = code || productCode;
    
    if (!searchCode.trim()) {
      const errorMsg = '商品コードを入力してください';
      if (onError) onError(errorMsg);
      if (onSearchError) onSearchError(errorMsg);
      return;
    }

    if (!validateProductCode(searchCode)) {
      setValidationError('商品コードは13桁の数字である必要があります');
      return;
    }

    setLoading(true);
    setValidationError('');
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/products/${searchCode}`);
      
      if (response.ok) {
        const product = await response.json();
        
        const convertedProduct: Product = {
          ...product,
          is_local: Boolean(product.is_local),
        };
        ;

        onProductFound(product);
        if (externalCode === undefined) {
          setProductCode('');
        }
      } else if (response.status === 404) {
        const errorMsg = '商品が見つかりませんでした';
        if (onError) onError(errorMsg);
        if (onSearchError) onSearchError(errorMsg);
      } else {
        const errorMsg = '商品の検索中にエラーが発生しました';
        if (onError) onError(errorMsg);
        if (onSearchError) onSearchError(errorMsg);
      }
    } catch (error) {
      console.error('商品検索エラー:', error);
      const errorMsg = 'サーバーとの通信に失敗しました';
      if (onError) onError(errorMsg);
      if (onSearchError) onSearchError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSearch();
  };

  const isValidCode = validateProductCode(productCode);
  const canSubmit = isValidCode && !loading;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <button
          type="button"
          onClick={openScanner}
          disabled={loading}
          className="w-full py-4 px-6 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-xl font-bold text-lg hover:opacity-90 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg"
        >
          <span>バーコードをスキャン</span>
        </button>

        <div>
          <label htmlFor="productCode" className="block text-sm font-medium text-gray-700 mb-2">
            商品コード（JANコード形式）
          </label>
          <input
            type="text"
            id="productCode"
            value={productCode}
            onChange={handleInputChange}
            className={className || `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 ${
              validationError ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="13桁の数字を入力"
            autoFocus
            disabled={loading}
            maxLength={13}
          />
          {validationError && (
            <p className="mt-1 text-xs text-red-600">{validationError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            JANコード形式13桁数字・手入力/バーコードスキャン両対応
          </p>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-400 to-pink-400 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              検索中...
            </div>
          ) : (
            '商品を検索'
          )}
        </button>
      </form>

      <BarcodeScanner
        isActive={showScanner}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
        onClose={closeScanner}
      />
    </>
  );
};

export default ProductInput;
