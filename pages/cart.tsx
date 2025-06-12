import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { CartItem, PurchaseRequest, PurchaseResponse } from '../types/Product';
import { getPurchaseUrl } from '../utils/api';

interface LastPurchase {
  totalAmount: number;
  transactionId: string;
}

const Cart: NextPage = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<LastPurchase | null>(null);

  useEffect(() => {
    if (router.query.items) {
      try {
        const items = JSON.parse(router.query.items as string);
        setCartItems(items);
      } catch (error) {
        console.error('カートデータの解析に失敗しました:', error);
      }
    }
  }, [router.query.items]);

  const updateQuantity = (productCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter(item => (item.CODE || item.product_code) !== productCode));
    } else {
      setCartItems(cartItems.map(item =>
        (item.CODE || item.product_code) === productCode
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeItem = (productCode: string) => {
    setCartItems(cartItems.filter(item => (item.CODE || item.product_code) !== productCode));
  };

  const handlePurchase = async () => {
    if (cartItems.length === 0) return;
    
    setLoading(true);
    try {
      // 新しいAPI仕様（Lv1）に対応した購入処理
      const purchaseData: PurchaseRequest = {
        EMP_CD: "9999999999",  // 仕様書：空白の場合のデフォルト値
        STORE_CD: "30",        // 仕様書：'30'固定
        POS_NO: "90",          // 仕様書：'90'固定（モバイルレジ）
        products: cartItems.map(item => ({
          PRD_ID: item.PRD_ID || item.id || 0,
          CODE: item.CODE || item.product_code || '',
          NAME: item.NAME || item.product_name || '',
          PRICE: item.PRICE || item.price || 0,
          quantity: item.quantity
        }))
      };

      console.log('購入処理開始:', {
        url: getPurchaseUrl(),
        data: purchaseData
      });

      const response = await fetch(getPurchaseUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      console.log('購入処理レスポンス:', {
        status: response.status,
        ok: response.ok
      });

      if (response.ok) {
        const result: PurchaseResponse = await response.json();
        console.log('購入処理成功:', result);
        setLastPurchase({
          totalAmount: result.TOTAL_AMT,
          transactionId: result.TRD_ID
        });
        setShowSuccessPopup(true);
        setCartItems([]);
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        console.error('購入処理エラー:', errorData);
        router.push(`/result?success=false&error=${encodeURIComponent(errorData.detail || '購入処理に失敗しました')}`);
      }
    } catch (error) {
      console.error('購入処理エラー:', error);
      router.push(`/result?success=false&error=${encodeURIComponent('サーバーとの通信に失敗しました')}`);
    } finally {
      setLoading(false);
    }
  };

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => {
    const price = item.PRICE || item.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">
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
                  <span className="text-gray-600">取引ID:</span>
                  <span className="font-bold text-green-700">{lastPurchase.transactionId}</span>
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
        
        {/* カート内容表示 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🛒 カート確認
          </h1>
          
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-500 mb-4">カートは空です</p>
              <Link
                href="/search"
                className="inline-block bg-gradient-to-r from-orange-400 to-pink-400 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
              >
                商品を探す
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                // 新しいAPI仕様（Lv1）を優先し、旧形式にフォールバック
                const productCode = item.CODE || item.product_code || '';
                const productName = item.NAME || item.product_name || '';
                const price = item.PRICE || item.price || 0;
                
                return (
                  <div key={productCode} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{productName}</h3>
                      <p className="text-sm text-gray-600">¥{price.toLocaleString()} × {item.quantity}</p>
                      <p className="font-bold text-orange-600">小計: ¥{(price * item.quantity).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(productCode, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(productCode, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(productCode)}
                        className="ml-2 text-red-500 hover:text-red-700 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">合計数量:</span>
                  <span className="text-lg font-bold">{totalQuantity}個</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-semibold">合計金額:</span>
                  <span className="text-2xl font-bold text-orange-600">¥{totalAmount.toLocaleString()}</span>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handlePurchase}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '処理中...' : '購入する'}
                  </button>
                  
                  <Link
                    href="/search"
                    className="block w-full py-3 bg-gray-500 text-white rounded-xl font-semibold text-center hover:bg-gray-600 transition"
                  >
                    商品検索に戻る
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;