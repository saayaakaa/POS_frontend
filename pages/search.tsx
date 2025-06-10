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
  const [cart, setCart] = useState<any[]>([])
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
    return 'https://localhost:8000';
  };

  useEffect(() => {
    fetchPurchaseHistory()
  }, [])

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

  const handleSearch = async () => {
    if (!code) return
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${getApiBaseUrl()}/products/${code}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json()
        setProduct(data)
        setSearchError("")
      } else if (res.status === 404) {
        setProduct(null)
        setSearchError("商品が見つかりません")
      } else {
        setProduct(null)
        setSearchError(`サーバーエラー: HTTP ${res.status} - ${res.statusText}`)
      }
    } catch (err: any) {
      console.error("検索失敗:", err)
      setProduct(null)
      if (err.name === 'AbortError') {
        setSearchError("タイムアウト: サーバーの応答が遅すぎます")
      } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setSearchError("ネットワークエラー: サーバーに接続できません")
      } else {
        setSearchError(`通信エラー: ${err.name} - ${err.message}`)
      }
    }
  }

  // ここから先のカート追加、購入処理、UI等は必要に応じて続けてください
  return (
    <div>
      {/* JSXコード（UI部分）をこのあとに追加してください */}
    </div>
  )
}
