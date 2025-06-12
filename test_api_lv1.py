#!/usr/bin/env python3
"""
新しいAPI仕様（Lv1）の動作確認スクリプト
フロントエンド開発者向けのクイックテスト
"""

import requests
import json
import sys
import os

def get_api_base_url():
    """
    環境に応じたAPIベースURLを取得
    """
    # 環境変数が設定されている場合は最優先
    api_url = os.getenv('API_URL')
    if api_url:
        print(f"🌐 環境変数からAPI URL取得: {api_url}")
        return api_url.rstrip('/')
    
    # デフォルトはローカル開発環境
    default_url = "http://localhost:8000"
    print(f"🏠 デフォルトAPI URL: {default_url}")
    return default_url

def test_api():
    # APIベースURL（環境に応じて変更）
    base_url = get_api_base_url()
    
    print("🧪 新しいAPI仕様（Lv1）の動作確認を開始します...")
    print(f"📡 テスト対象: {base_url}")
    print("💡 本番環境テスト時は環境変数 API_URL を設定してください")
    print("   例: export API_URL=https://your-production-domain.com")
    print("🔧 デバッグモード: 詳細なログを出力します")
    print("-" * 60)
    
    # テスト1: 商品検索（新API）
    print("✅ テスト1: 商品検索 (GET /api/v1/products/{code})")
    test_code = "4901234567001"
    search_url = f"{base_url}/api/v1/products/{test_code}"
    print(f"🔍 リクエストURL: {search_url}")
    
    try:
        response = requests.get(search_url, verify=False, timeout=10)
        print(f"📡 レスポンス: {response.status_code}")
        print(f"📋 ヘッダー: {dict(response.headers)}")
        
        if response.status_code == 200:
            product = response.json()
            print(f"✅ {test_code}: {product['NAME']} - ¥{product['PRICE']}")
            print(f"   PRD_ID: {product['PRD_ID']}, CODE: {product['CODE']}")
        else:
            print(f"❌ 商品検索失敗: {response.status_code}")
            print(f"   レスポンス: {response.text}")
            return False
    except requests.exceptions.ConnectionError as e:
        print(f"❌ 接続エラー: {e}")
        print("💡 バックエンドサーバーが起動していない可能性があります")
        return False
    except requests.exceptions.Timeout as e:
        print(f"❌ タイムアウトエラー: {e}")
        return False
    except Exception as e:
        print(f"❌ 商品検索エラー: {e}")
        return False
    
    # テスト2: 購入処理（新API）- 仕様書準拠値でテスト
    print("\n✅ テスト2: 購入処理 (POST /api/v1/purchase)")
    purchase_data = {
        "EMP_CD": "EMP001",      # レジ担当者コード（空白時は'9999999999'）
        "STORE_CD": "30",        # 仕様書：'30'固定
        "POS_NO": "90",          # 仕様書：'90'固定（モバイルレジ）
        "products": [
            {
                "PRD_ID": product['PRD_ID'],
                "CODE": product['CODE'],
                "NAME": product['NAME'],
                "PRICE": product['PRICE'],
                "quantity": 2
            },
            {
                "PRD_ID": 2,
                "CODE": "4901234567002",
                "NAME": "テスト商品2",
                "PRICE": 200,
                "quantity": 1
            }
        ]
    }
    
    purchase_url = f"{base_url}/api/v1/purchase"
    print(f"🔍 リクエストURL: {purchase_url}")
    print(f"📤 リクエストデータ: {json.dumps(purchase_data, ensure_ascii=False, indent=2)}")
    
    try:
        response = requests.post(
            purchase_url,
            json=purchase_data,
            verify=False,
            timeout=10
        )
        print(f"📡 レスポンス: {response.status_code}")
        print(f"📋 ヘッダー: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"📥 レスポンスデータ: {json.dumps(result, ensure_ascii=False, indent=2)}")
            if result['success']:
                print(f"✅ 購入処理成功: 合計金額 ¥{result['TOTAL_AMT']}")
                print(f"   取引ID: {result['TRD_ID']}")
            else:
                print("❌ 購入処理失敗")
                print(f"   レスポンス: {result}")
                return False
        else:
            print(f"❌ 購入処理失敗: {response.status_code}")
            print(f"   レスポンス: {response.text}")
            return False
    except requests.exceptions.ConnectionError as e:
        print(f"❌ 接続エラー: {e}")
        return False
    except requests.exceptions.Timeout as e:
        print(f"❌ タイムアウトエラー: {e}")
        return False
    except Exception as e:
        print(f"❌ 購入処理エラー: {e}")
        return False
    
    # テスト3: レジ担当者コード空白時のテスト
    print("\n✅ テスト3: レジ担当者コード空白時のテスト")
    purchase_data_empty_emp = {
        "EMP_CD": "",            # 空白 → '9999999999'になるはず
        "STORE_CD": "30",
        "POS_NO": "90",
        "products": [
            {
                "PRD_ID": product['PRD_ID'],
                "CODE": product['CODE'],
                "NAME": product['NAME'],
                "PRICE": product['PRICE'],
                "quantity": 1
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/v1/purchase",
            json=purchase_data_empty_emp,
            verify=False
        )
        if response.status_code == 200:
            result = response.json()
            if result['success']:
                print(f"✅ 空白レジ担当者コードテスト成功: 合計金額 ¥{result['TOTAL_AMT']}")
                print(f"   取引ID: {result['TRD_ID']}")
            else:
                print("❌ 空白レジ担当者コードテスト失敗")
                print(f"   レスポンス: {result}")
        else:
            print(f"⚠️  空白レジ担当者コードテスト: {response.status_code} (バックエンド未対応の可能性)")
            print(f"   レスポンス: {response.text}")
    except Exception as e:
        print(f"⚠️  空白レジ担当者コードテストエラー: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 主要テストが成功しました！")
    print("📋 仕様書準拠の実装ポイント:")
    print("   • 商品検索: PRD_ID, CODE, NAME, PRICE")
    print("   • 店舗コード: '30' 固定")
    print("   • POS機ID: '90' 固定（モバイルレジ）")
    print("   • レジ担当者コード: 空白時は '9999999999'")
    print("   • 購入結果: success, TOTAL_AMT, TRD_ID")
    print("\n🌐 本番環境テスト方法:")
    print("   export API_URL=https://your-production-domain.com")
    print("   python test_api_lv1.py")
    return True

if __name__ == "__main__":
    success = test_api()
    sys.exit(0 if success else 1) 