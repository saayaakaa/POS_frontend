import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

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

interface LastPurchase {
  totalAmount: number;
  purchaseId: string;
}

const Cart: NextPage = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<LastPurchase | null>(null);

  const getApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return `http://${hostname}:8000`;
    }
    return 'http://localhost:8000';
  };

  useEffect(() => {
    if (router.query.items) {
      try {
        const items = JSON.parse(router.query.items as string);
        setCartItems(items);
      } catch (error) {
        console.error('カートデータの解析に失敗しました:', error);
      }
    }
    fetchPurchaseHistory();
  }, [router.query.items]);

  const fetchPurchaseHistory = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/purchase-history?limit=5`);
      if (response.ok) {
        const result = await response.json();
        setPurchaseHistory(result.data);
      }
    } catch (error) {
      console.error('購入履歴の取得に失敗しました:', error);
    }
  };

  const updateQuantity = (productCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter(item => item.product_code !== productCode));
    } else {
      setCartItems(cartItems.map(item =>
        item.product_code === productCode
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeItem = (productCode: string) => {
    setCartItems(cartItems.filter(item => item.product_code !== productCode));
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const purchaseData = {
        items: cartItems.map(item => ({
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
        setCartItems([]);
        await fetchPurchaseHistory();
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
      } else {
        const errorData = await response.json();
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
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
        {/* ...省略（商品一覧や履歴UIなど） */}
      </div>
    </div>
  );
};

export default Cart;
