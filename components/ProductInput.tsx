import React, { useState, useEffect } from 'react';
import BarcodeScanner from './BarcodeScanner';
import { Product } from '../types/Product'; // ✅ 共通型の読み込み
import { getProductSearchUrl, getProductSearchUrlLegacy } from '../utils/api';

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
  const [productCode, setProductCode] = useState(externalCode || '');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (externalCode !== undefined) {
      setProductCode(externalCode);
    }
  }, [externalCode]);

  useEffect(() => {
    if (onCodeChange) {
      onCodeChange(productCode);
    }
  }, [productCode, onCodeChange]);

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
    setError('');
    
    try {
      const searchUrl = getProductSearchUrl(searchCode);
      console.log('🔍 商品検索開始:', {
        code: searchCode,
        url: searchUrl
      });
      
      // 新しいAPIエンドポイントを試す
      let response = await fetch(searchUrl);
      
      console.log('📡 商品検索レスポンス:', {
        status: response.status,
        ok: response.ok,
        url: searchUrl
      });

      if (response.ok) {
        const product: Product = await response.json();
        console.log('✅ 商品検索成功:', product);
        
        // 新しい形式のレスポンスを処理
        const convertedProduct: Product = {
          PRD_ID: product.PRD_ID,
          CODE: product.CODE,
          NAME: product.NAME,
          PRICE: product.PRICE,
          // 旧形式との互換性のため
          id: product.PRD_ID,
          product_code: product.CODE,
          product_name: product.NAME,
          price: product.PRICE,
          is_local: Boolean(product.is_local),
        };

        onProductFound(convertedProduct);
        if (externalCode === undefined) {
          setProductCode('');
        }
      } else if (response.status === 404) {
        console.log('⚠️ 新しいAPIで商品が見つかりません。旧APIを試します...');
        // 新しいAPIで見つからない場合、旧APIを試す
        const legacyUrl = getProductSearchUrlLegacy(searchCode);
        console.log('🔄 旧API商品検索:', legacyUrl);
        
        response = await fetch(legacyUrl);
        
        console.log('📡 旧API商品検索レスポンス:', {
          status: response.status,
          ok: response.ok
        });

        if (response.ok) {
          const legacyProduct = await response.json();
          console.log('✅ 旧API商品検索成功:', legacyProduct);
          
          // 旧形式から新形式に変換
          const convertedProduct: Product = {
            PRD_ID: legacyProduct.id || 0,
            CODE: legacyProduct.product_code || searchCode,
            NAME: legacyProduct.product_name || '',
            PRICE: legacyProduct.price || 0,
            // 旧形式との互換性のため
            id: legacyProduct.id,
            product_code: legacyProduct.product_code,
            product_name: legacyProduct.product_name,
            price: legacyProduct.price,
            is_local: Boolean(legacyProduct.is_local),
          };
          
          onProductFound(convertedProduct);
          if (externalCode === undefined) {
            setProductCode('');
          }
        } else {
          console.error('❌ 旧API商品検索失敗:', response.status);
          const errorMsg = '商品がマスタ未登録です';
          if (onError) onError(errorMsg);
          if (onSearchError) onSearchError(errorMsg);
        }
      } else {
        console.error('❌ 商品検索失敗:', response.status);
        const errorMsg = '商品の検索中にエラーが発生しました';
        if (onError) onError(errorMsg);
        if (onSearchError) onSearchError(errorMsg);
      }
    } catch (error) {
      console.error('💥 商品検索エラー:', error);
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
              読み込み中...
            </div>
          ) : (
            '読み込み'
          )}
        </button>
      </form>

      {showScanner && (
        <BarcodeScanner
          isActive={showScanner}
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
          onClose={closeScanner}
        />
      )}
    </>
  );
};

export default ProductInput;
