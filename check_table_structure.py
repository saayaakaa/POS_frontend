#!/usr/bin/env python3
"""
データベーステーブル構造確認スクリプト
DBイメージ（Lv1）との構造比較用
"""

import mysql.connector
import os
from dotenv import load_dotenv

def check_table_structure():
    load_dotenv()
    
    # データベース接続
    conn = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'rdbs-step4-australia-east.mysql.database.azure.com'),
        user=os.getenv('DB_USER', 'tech0sql1'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME', 'sayapos'),
        ssl_disabled=False,
        ssl_verify_cert=True,
        ssl_verify_identity=False
    )
    
    cursor = conn.cursor()
    
    print('📋 DBイメージ（Lv1）構造確認')
    print('=' * 80)
    
    # 商品マスタテーブルの構造確認
    print('🏪 商品マスタ (product_master) テーブル構造:')
    print('-' * 60)
    cursor.execute('DESCRIBE product_master')
    for row in cursor.fetchall():
        field, type_, null, key, default, extra = row
        print(f'   {field:<15} {type_:<15} {key:<5} {null:<5} {default or "":<10} {extra}')
    
    print()
    
    # 取引テーブルの構造確認
    print('💰 取引 (transaction) テーブル構造:')
    print('-' * 60)
    cursor.execute('DESCRIBE transaction')
    for row in cursor.fetchall():
        field, type_, null, key, default, extra = row
        print(f'   {field:<15} {type_:<15} {key:<5} {null:<5} {default or "":<10} {extra}')
    
    print()
    
    # 取引明細テーブルの構造確認
    print('📝 取引明細 (transaction_detail) テーブル構造:')
    print('-' * 60)
    cursor.execute('DESCRIBE transaction_detail')
    for row in cursor.fetchall():
        field, type_, null, key, default, extra = row
        print(f'   {field:<15} {type_:<15} {key:<5} {null:<5} {default or "":<10} {extra}')
    
    print()
    print('=' * 80)
    print('📊 DBイメージ（Lv1）との構造比較:')
    print()
    
    # 商品マスタの期待構造
    print('✅ 商品マスタ期待構造:')
    print('   PRD_ID (PK) integer - 商品一意キー')
    print('   CODE char(13) - 商品コード (Unique制約)')
    print('   NAME varchar(50) - 商品名称')
    print('   PRICE integer - 商品単価')
    
    print()
    
    # 取引テーブルの期待構造
    print('✅ 取引テーブル期待構造:')
    print('   TRD_ID (PK) integer - 取引一意キー')
    print('   DATETIME timestamp - 取引日時')
    print('   EMP_CD char(10) - レジ担当者コード')
    print('   STORE_CD char(5) - 店舗コード')
    print('   POS_NO char(5) - POS機ID')
    print('   TOTAL_AMT integer - 合計金額')
    
    print()
    
    # 取引明細の期待構造
    print('✅ 取引明細期待構造:')
    print('   TRD_ID (PK) integer - 取引一意キー')
    print('   DTL_ID (PK) integer - 取引明細一意キー')
    print('   PRD_ID integer - 商品一意キー')
    print('   PRD_CODE char(13) - 商品コード')
    print('   PRD_NAME varchar(50) - 商品名称')
    print('   PRD_PRICE integer - 商品単価')
    
    conn.close()

if __name__ == "__main__":
    check_table_structure() 