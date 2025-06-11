import { Product } from '../types/Product'

interface ProductInfoProps {
  product: Product;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
  // 新しいAPI仕様（Lv1）を優先し、旧形式にフォールバック
  const productCode = product.CODE || product.product_code || '';
  const productName = product.NAME || product.product_name || '';
  const price = product.PRICE || product.price || 0;
  const category = product.category || '未分類';
  const taxRate = product.tax_rate;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">商品情報</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">商品コード:</span>
          <span className="font-medium">{productCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">商品名:</span>
          <span className="font-medium">{productName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">価格:</span>
          <span className="font-bold text-lg text-blue-600">¥{price.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">カテゴリ:</span>
          <span className="font-medium">{category}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">税率:</span>
          <span className="font-medium">
            {typeof taxRate === 'number' ? `${(taxRate * 100).toFixed(0)}%` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
