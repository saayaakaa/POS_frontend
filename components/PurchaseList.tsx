import { CartItem } from '../types/Product';

interface PurchaseListProps {
  items: CartItem[];
  onUpdateQuantity: (productCode: string, quantity: number) => void;
  onRemoveItem: (productCode: string) => void;
}

const PurchaseList: React.FC<PurchaseListProps> = ({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem 
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">購入リスト</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {items.map((item) => {
          // 新しいAPI仕様（Lv1）を優先し、旧形式にフォールバック
          const productCode = item.CODE || item.product_code || '';
          const productName = item.NAME || item.product_name || '';
          const price = item.PRICE || item.price || 0;
          
          return (
            <div key={productCode} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {productName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    商品コード: {productCode}
                  </p>
                  <p className="text-sm text-gray-500">
                    単価: ¥{price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateQuantity(productCode, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(productCode, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ¥{(price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(productCode)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="削除"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {items.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          カートに商品がありません
        </div>
      )}
    </div>
  );
};

export default PurchaseList; 