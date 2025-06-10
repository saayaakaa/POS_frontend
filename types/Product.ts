// types/Product.ts

export interface Product {
    id: number;
    product_code: string;
    product_name: string;
    price: number;
    tax_rate: number;
    category?: string;
    is_local?: number;
  }
  