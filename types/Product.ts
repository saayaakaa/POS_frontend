// types/Product.ts

export interface Product {
    PRD_ID: number;
    CODE: string;
    NAME: string;
    PRICE: number;
    // 旧形式との互換性のため
    id?: number;
    product_code?: string;
    product_name?: string;
    price?: number;
    tax_rate?: number;
    category?: string;
    is_local?: boolean;
}

export interface CartItem {
    PRD_ID: number;
    CODE: string;
    NAME: string;
    PRICE: number;
    quantity: number;
    // 旧形式との互換性のため
    id?: number;
    product_code?: string;
    product_name?: string;
    price?: number;
}

export interface PurchaseRequest {
    EMP_CD: string;
    STORE_CD: string;
    POS_NO: string;
    products: {
        PRD_ID: number;
        CODE: string;
        NAME: string;
        PRICE: number;
        quantity: number;
    }[];
}

export interface PurchaseResponse {
    success: boolean;
    TOTAL_AMT: number;
    TRD_ID: string;
}

export interface POSSettings {
    EMP_CD: string;
    STORE_CD: string;
    POS_NO: string;
}
  