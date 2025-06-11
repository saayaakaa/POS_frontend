import { useState } from 'react';
import { POSSettings } from '../types/Product';

interface POSSettingsProps {
  settings: POSSettings;
  onSettingsChange: (settings: POSSettings) => void;
  className?: string;
}

const POSSettingsComponent: React.FC<POSSettingsProps> = ({
  settings,
  onSettingsChange,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field: keyof POSSettings, value: string) => {
    onSettingsChange({
      ...settings,
      [field]: value
    });
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">⚙️</span>
          <span className="font-semibold text-gray-700">POS設定</span>
        </div>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-gray-100">
          <div>
            <label htmlFor="empCode" className="block text-sm font-medium text-gray-700 mb-1">
              レジ担当者コード
            </label>
            <input
              type="text"
              id="empCode"
              value={settings.EMP_CD}
              onChange={(e) => handleInputChange('EMP_CD', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              placeholder="例: EMP001（空白時は9999999999）"
            />
            <p className="mt-1 text-xs text-gray-500">
              空白の場合、自動的に '9999999999' が設定されます
            </p>
          </div>
          
          <div>
            <label htmlFor="storeCode" className="block text-sm font-medium text-gray-700 mb-1">
              店舗コード（固定値）
            </label>
            <input
              type="text"
              id="storeCode"
              value="30"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500">
              仕様書により '30' で固定されています
            </p>
          </div>
          
          <div>
            <label htmlFor="posNo" className="block text-sm font-medium text-gray-700 mb-1">
              POS機ID（固定値）
            </label>
            <input
              type="text"
              id="posNo"
              value="90"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500">
              仕様書により '90'（モバイルレジ）で固定されています
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              📋 仕様書準拠設定<br/>
              • 店舗コード: '30' 固定<br/>
              • POS機ID: '90' 固定（モバイルレジ）<br/>
              • レジ担当者コード: 空白時は '9999999999'
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSSettingsComponent; 