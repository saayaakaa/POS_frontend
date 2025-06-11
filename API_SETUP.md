# API設定ガイド

## 概要
フロントエンドアプリケーションは、統一されたAPI URL取得ロジックを使用して、開発環境と本番環境の両方で動作します。

## API URL自動判定ロジック

### 優先順位
1. **環境変数** `NEXT_PUBLIC_API_URL` が設定されている場合
2. **本番環境の自動判定**（以下のドメインを含む場合）
   - azurewebsites.net
   - herokuapp.com
   - vercel.app
   - netlify.app
   - railway.app
   - その他（localhost、127.0.0.1以外）
3. **ローカル開発環境**（https://localhost:8443）

## 環境変数設定

### 本番環境
```bash
# 本番環境のAPI URLを明示的に設定する場合
export NEXT_PUBLIC_API_URL=https://your-production-domain.com
```

### 開発環境
```bash
# 通常は設定不要（自動でhttps://localhost:8443が使用される）
# 異なるポートを使用する場合のみ設定
export NEXT_PUBLIC_API_URL=https://localhost:8080
```

## テストスクリプト

### ローカル環境でのテスト
```bash
python test_api_lv1.py
```

### 本番環境でのテスト
```bash
export API_URL=https://your-production-domain.com
python test_api_lv1.py
```

## 対応API仕様

### 新しいAPI（Lv1仕様）
- 商品検索: `GET /api/v1/products/{code}`
- 購入処理: `POST /api/v1/purchase`

### 旧API（互換性のため）
- 商品検索: `GET /products/{code}`
- 購入処理: `POST /purchase`

## トラブルシューティング

### API URLの確認
ブラウザの開発者ツールのコンソールで、以下のログを確認してください：
- `API URL (環境変数): ...`
- `本番環境API URL: ...`
- `ローカル開発環境API URL: ...`

### よくある問題
1. **CORS エラー**: 本番環境でCORS設定が正しく行われているか確認
2. **SSL証明書エラー**: HTTPSが正しく設定されているか確認
3. **404エラー**: APIエンドポイントが正しくデプロイされているか確認

## ファイル構成
- `utils/api.ts`: 共通API設定ユーティリティ
- `components/ProductInput.tsx`: 商品検索コンポーネント
- `pages/search.tsx`: メイン検索ページ
- `pages/cart.tsx`: カートページ
- `test_api_lv1.py`: APIテストスクリプト 