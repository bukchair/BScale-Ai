import React, { useState } from 'react';
import { ShoppingCart, Package, DollarSign, Tag } from 'lucide-react';

const mockProducts = [
  { id: 1, name: 'נעלי ריצה מקצועיות', sku: 'SHOE-001', stock: 45, shortDesc: 'נעלי ריצה נוחות.', longDesc: 'נעלי ריצה מקצועיות עם סוליה בולמת זעזועים. מתאימות לריצות ארוכות.', price: '₪450', category: 'הנעלה' },
  { id: 2, name: 'שעון חכם ספורט', sku: 'WATCH-002', stock: 12, shortDesc: 'שעון חכם למעקב.', longDesc: 'שעון חכם עם מד דופק, GPS ומעקב שינה. עמיד במים.', price: '₪890', category: 'אלקטרוניקה' },
  { id: 3, name: 'אוזניות אלחוטיות', sku: 'AUDIO-003', stock: 0, shortDesc: 'אוזניות בלוטוס.', longDesc: 'אוזניות אלחוטיות עם סינון רעשים אקטיבי וסוללה ל-24 שעות.', price: '₪350', category: 'אלקטרוניקה' },
];

export function WooCommerce() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">מוצרים (WooCommerce)</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">רשימת מוצרים</h3>
          </div>
          <ul className="divide-y divide-gray-200 h-[600px] overflow-y-auto">
            {mockProducts.map((product) => (
              <li 
                key={product.id} 
                className={`px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedProduct?.id === product.id ? 'bg-indigo-50 border-r-4 border-indigo-500' : ''}`}
                onClick={() => setSelectedProduct(product)}
              >
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm font-bold text-gray-900">{product.price}</p>
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">מק"ט: {product.sku}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.stock > 0 ? `במלאי (${product.stock})` : 'אזל המלאי'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 bg-white shadow rounded-lg overflow-hidden flex flex-col">
          {selectedProduct ? (
            <>
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  {selectedProduct.name}
                </h3>
              </div>
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm font-medium">מחיר</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{selectedProduct.price}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Tag className="w-4 h-4" />
                      <span className="text-sm font-medium">קטגוריה</span>
                    </div>
                    <p className="text-lg font-medium text-gray-900">{selectedProduct.category}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תיאור קצר</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-800">
                    {selectedProduct.shortDesc}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תיאור מלא</label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap">
                    {selectedProduct.longDesc}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-12 min-h-[400px]">
              <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg">בחר מוצר מהרשימה כדי לצפות בפרטים</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
