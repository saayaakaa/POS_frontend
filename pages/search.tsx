"use client"

import { useState } from "react"
import ProductInput from '../components/ProductInput'
import POSSettingsComponent from '../components/POSSettings'
import { Product, CartItem, PurchaseRequest, PurchaseResponse, POSSettings } from '../types/Product'
import { getPurchaseUrl, getPurchaseUrlLegacy } from '../utils/api'

export default function ProductSearchPage() {
  const [code, setCode] = useState("")
  const [product, setProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [lastPurchase, setLastPurchase] = useState<{totalAmount: number, transactionId: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState("")
  
  // POS設定の状態管理
  const [posSettings, setPosSettings] = useState<POSSettings>({
    EMP_CD: "EMP001",
    STORE_CD: "30",      // 仕様書：'30'固定
    POS_NO: "90"         // 仕様書：'90'固定（モバイルレジ）
  })

  const handleProductFound = (foundProduct: Product) => {
    setProduct(foundProduct);
    setSearchError('');
    console.log('商品が見つかりました:', foundProduct);
  };

  const handleError = (errorMessage: string) => {
    setSearchError(errorMessage);
    setProduct(null);
  };

  const addToCart = () => {
    if (!product) return;
    
    // 新しい形式と旧形式の両方に対応
    const productCode = product.CODE || product.product_code || '';
    const productName = product.NAME || product.product_name || '';
    const productPrice = product.PRICE || product.price || 0;
    const productId = product.PRD_ID || product.id || 0;
    
    const existingItem = cart.find(item => (item.CODE || item.product_code) === productCode);
    
    if (existingItem) {
      setCart(cart.map(item =>
        (item.CODE || item.product_code) === productCode
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        PRD_ID: productId,
        CODE: productCode,
        NAME: productName,
        PRICE: productPrice,
        quantity: 1,
        // 旧形式との互換性のため
        id: productId,
        product_code: productCode,
        product_name: productName,
        price: productPrice
      };
      setCart([...cart, newItem]);
    }
    
    // 商品追加後、商品表示をクリア
    setProduct(null);
    setCode('');
  };

  const updateQuantity = (productCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => (item.CODE || item.product_code) !== productCode));
    } else {
      setCart(cart.map(item =>
        (item.CODE || item.product_code) === productCode
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productCode: string) => {
    setCart(cart.filter(item => (item.CODE || item.product_code) !== productCode));
  };

  const handlePurchase = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      // 仕様書準拠：レジ担当者コードが空白の場合は'9999999999'
      const empCode = posSettings.EMP_CD.trim() || "9999999999";
      
      // 新しいAPI形式でのリクエスト
      const purchaseData: PurchaseRequest = {
        EMP_CD: empCode,
        STORE_CD: "30",      // 仕様書：'30'固定
        POS_NO: "90",        // 仕様書：'90'固定（モバイルレジ）
        products: cart.map(item => ({
          PRD_ID: item.PRD_ID || item.id || 0,
          CODE: item.CODE || item.product_code || '',
          NAME: item.NAME || item.product_name || '',
          PRICE: item.PRICE || item.price || 0,
          quantity: item.quantity
        }))
      };

      // 新しいAPIエンドポイントを試す
      let response = await fetch(getPurchaseUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      if (response.ok) {
        const result: PurchaseResponse = await response.json();
        setLastPurchase({
          totalAmount: result.TOTAL_AMT,
          transactionId: result.TRD_ID
        });
        setShowSuccessPopup(true);
        setCart([]);
      } else if (response.status === 404) {
        // 新しいAPIが利用できない場合、旧APIを試す（互換性のため）
        const fallbackData = {
          items: cart.map(item => ({
            product_code: item.CODE || item.product_code,
            quantity: item.quantity
          }))
        };

        response = await fetch(getPurchaseUrlLegacy(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fallbackData),
        });

        if (response.ok) {
          const result = await response.json();
          setLastPurchase({
            totalAmount: result.total_amount || result.TOTAL_AMT,
            transactionId: result.purchase_id || result.TRD_ID
          });
          setShowSuccessPopup(true);
          setCart([]);
        } else {
          const errorData = await response.json();
          alert(`購入処理に失敗しました: ${errorData.detail || '不明なエラー'}`);
        }
      } else {
        const errorData = await response.json();
        alert(`購入処理に失敗しました: ${errorData.detail || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('購入処理エラー:', error);
      alert('サーバーとの通信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    // 全項目をクリア
    setProduct(null);
    setCode('');
    setSearchError('');
    setLastPurchase(null);
  };

  const totalAmount = cart.reduce((sum, item) => sum + ((item.PRICE || item.price || 0) * item.quantity), 0);
  // 税込金額を計算（税率10%と仮定）
  const totalAmountWithTax = Math.floor(totalAmount * 1.1);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* 成功ポップアップ */}
      {showSuccessPopup && lastPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">購入完了！</h2>
            <p className="text-gray-600 mb-4">ご購入ありがとうございました！</p>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">取引ID:</span>
                <span className="font-bold text-green-700">{lastPurchase.transactionId}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-semibold">合計金額（税込）:</span>
                <span className="font-bold text-green-700 text-lg">¥{Math.floor(lastPurchase.totalAmount * 1.1).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">（税抜）:</span>
                <span className="text-green-600 text-sm">¥{lastPurchase.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={handleClosePopup}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-400 to-green-600 hover:opacity-90 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 text-center border-b">
          <h1 className="text-xl font-bold text-gray-700 tracking-wider">
            TECHONE STATIONERY
          </h1>
        </div>

        <div className="p-6 space-y-6">
          {/* POS設定 */}
          <POSSettingsComponent
            settings={posSettings}
            onSettingsChange={setPosSettings}
          />

          {/* 商品コード入力・スキャン */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              商品コード入力・スキャン
            </h2>
            <ProductInput
              onProductFound={handleProductFound}
              onError={handleError}
              code={code}
              onCodeChange={setCode}
            />
            
            {searchError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{searchError}</p>
              </div>
            )}
          </div>

          {/* 商品情報表示 */}
          {product && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {product.NAME || product.product_name}
                </h3>
                <div className="text-3xl font-bold text-orange-500 mb-6">
                  ¥{(product.PRICE || product.price || 0).toLocaleString()}
                </div>
                <button
                  onClick={addToCart}
                  className="w-full py-4 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-xl font-bold text-lg hover:opacity-90 transition flex items-center justify-center space-x-2"
                >
                  <span>➕</span>
                  <span>追加</span>
                </button>
              </div>
            </div>
          )}

          {/* 合計金額 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-2xl">💰</span>
              <span className="text-lg font-semibold text-gray-700">合計金額</span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              ¥{totalAmountWithTax.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              （税抜：¥{totalAmount.toLocaleString()}）
            </div>
          </div>

          {/* カート */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl">🛒</span>
              <span className="text-lg font-semibold text-gray-700">カート</span>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                商品を追加してください
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => {
                  const itemCode = item.CODE || item.product_code || '';
                  const itemName = item.NAME || item.product_name || '';
                  const itemPrice = item.PRICE || item.price || 0;
                  
                  return (
                    <div key={itemCode} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{itemName}</h4>
                        <p className="text-sm text-gray-600">¥{itemPrice.toLocaleString()} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(itemCode, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(itemCode, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(itemCode)}
                          className="ml-2 text-red-500 hover:text-red-700 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 購入ボタン */}
          <button
            onClick={handlePurchase}
            disabled={cart.length === 0 || loading}
            className="w-full py-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <span>🛒</span>
            <span>{loading ? '処理中...' : '購入する'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
