"use client"

import { useState, useEffect } from "react"
import ProductInput from '../components/ProductInput'

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  price: number;
  tax_rate?: number;
  category?: string;
  is_local?: boolean;
}

interface CartItem {
  id: number;
  product_code: string;
  product_name: string;
  price: number;
  quantity: number;
}

interface PurchaseHistoryItem {
  id: number;
  purchase_date: string;
  total_amount: number;
  items: {
    product_code: string;
    product_name: string;
    price: number;
    quantity: number;
    total_price: number;
  }[];
}

interface TaxBreakdown {
  [key: string]: {
    subtotal: number;
    tax: number;
  };
}

export default function ProductSearchPage() {
  const [code, setCode] = useState("")
  const [product, setProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [lastPurchase, setLastPurchase] = useState<{totalAmount: number, purchaseId: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false)
  const [showTaxDetails, setShowTaxDetails] = useState(false)
  const [searchError, setSearchError] = useState("")

  const getApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return `https://${hostname}`;
    }
    return process.env.NEXT_PUBLIC_API_URL;
  };

  useEffect(() => {
    fetchPurchaseHistory()
  }, [])

  console.log(process.env.NEXT_PUBLIC_API_URL)

  const fetchPurchaseHistory = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${getApiBaseUrl()}/purchase-history?limit=5`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId);
      if (response.ok) {
        const result = await response.json()
        setPurchaseHistory(result.data)
      } else {
        console.error(`購入履歴取得エラー: HTTP ${response.status} - ${response.statusText}`)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('購入履歴取得タイムアウト')
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('購入履歴取得: ネットワークエラー')
      } else {
        console.error('購入履歴の取得に失敗しました:', error)
      }
    }
  }

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
    
    const existingItem = cart.find(item => item.product_code === product.product_code);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_code === product.product_code
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: product.id,
        product_code: product.product_code,
        product_name: product.product_name,
        price: product.price,
        quantity: 1
      };
      setCart([...cart, newItem]);
    }
    
    // 商品追加後、商品表示をクリア
    setProduct(null);
    setCode('');
  };

  const updateQuantity = (productCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product_code !== productCode));
    } else {
      setCart(cart.map(item =>
        item.product_code === productCode
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (productCode: string) => {
    setCart(cart.filter(item => item.product_code !== productCode));
  };

  const handlePurchase = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      const purchaseData = {
        items: cart.map(item => ({
          product_code: item.product_code,
          quantity: item.quantity
        }))
      };

      const response = await fetch(`${getApiBaseUrl()}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      if (response.ok) {
        const result = await response.json();
        setLastPurchase({
          totalAmount: result.total_amount,
          purchaseId: result.purchase_id
        });
        setShowSuccessPopup(true);
        setCart([]);
        await fetchPurchaseHistory();
        
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
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

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">購入ID:</span>
                <span className="font-bold text-green-700">{lastPurchase.purchaseId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">合計金額:</span>
                <span className="font-bold text-green-700">¥{lastPurchase.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-400 to-green-600 hover:opacity-90 transition"
            >
              閉じる
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
                  {product.product_name}
                </h3>
                <div className="text-3xl font-bold text-orange-500 mb-6">
                  ¥{product.price.toLocaleString()}
                </div>
                <button
                  onClick={addToCart}
                  className="w-full py-4 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-xl font-bold text-lg hover:opacity-90 transition flex items-center justify-center space-x-2"
                >
                  <span>➕</span>
                  <span>カートに追加</span>
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
            <div className="text-3xl font-bold text-gray-800">
              ¥{totalAmount.toLocaleString()}
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
                {cart.map((item) => (
                  <div key={item.product_code} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                      <p className="text-sm text-gray-600">¥{item.price.toLocaleString()} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product_code, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_code, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product_code)}
                        className="ml-2 text-red-500 hover:text-red-700 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
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
