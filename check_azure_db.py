#!/usr/bin/env python3
"""
AzureのMySQLデータベース内容確認スクリプト
"""

import os
import mysql.connector
from mysql.connector import Error
import ssl

def check_azure_database():
    # 環境変数から接続情報を取得
    db_config = {
        'host': os.getenv('DB_HOST', 'rdbs-step4-australia-east.mysql.database.azure.com'),
        'user': os.getenv('DB_USER', 'tech0sql1'),
        'password': os.getenv('DB_PASSWORD'),
        'database': os.getenv('DB_NAME', 'sayapos'),
        'port': int(os.getenv('DB_PORT', '3306')),
        'ssl_ca': '/opt/homebrew/share/ca-certificates/DigiCertGlobalRootCA.crt.pem',
        'ssl_verify_cert': True,
        'ssl_verify_identity': False,
        'autocommit': True
    }

    print('🔍 Azureデータベース接続テスト...')
    print(f'📡 接続先: {db_config["host"]}')
    print(f'👤 ユーザー: {db_config["user"]}')
    print(f'🗄️  データベース: {db_config["database"]}')

    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        print('✅ Azure MySQL接続成功!')
        print()
        
        # 1. テーブル一覧を確認
        print('📋 テーブル一覧:')
        cursor.execute('SHOW TABLES')
        tables = cursor.fetchall()
        for table in tables:
            print(f'   - {table[0]}')
        print()
        
        # 2. 商品マスタ（product_master）の内容確認
        print('🛍️  商品マスタ（product_master）:')
        cursor.execute('SELECT PRD_ID, CODE, NAME, PRICE FROM product_master ORDER BY PRD_ID')
        products = cursor.fetchall()
        for product in products:
            print(f'   ID:{product[0]} | コード:{product[1]} | 名前:{product[2]} | 価格:¥{product[3]}')
        print()
        
        # 3. 取引テーブル（transaction）の最新データ確認
        print('💰 取引テーブル（transaction）- 最新5件:')
        cursor.execute('''
            SELECT TRD_ID, EMP_CD, STORE_CD, POS_NO, TTL_AMT, TTL_AMT_EX_TAX, TRD_DATE 
            FROM transaction 
            ORDER BY TRD_ID DESC 
            LIMIT 5
        ''')
        transactions = cursor.fetchall()
        for tx in transactions:
            print(f'   取引ID:{tx[0]} | 担当者:{tx[1]} | 店舗:{tx[2]} | POS:{tx[3]} | 合計:¥{tx[4]} | 税抜:¥{tx[5]} | 日時:{tx[6]}')
        print()
        
        # 4. 取引明細テーブル（transaction_detail）の最新データ確認
        print('📝 取引明細（transaction_detail）- 最新10件:')
        cursor.execute('''
            SELECT td.DTL_ID, td.TRD_ID, td.PRD_ID, td.PRD_CODE, td.PRD_NAME, td.UNIT_PRICE, td.QTY, td.AMT
            FROM transaction_detail td
            ORDER BY td.DTL_ID DESC
            LIMIT 10
        ''')
        details = cursor.fetchall()
        for detail in details:
            print(f'   明細ID:{detail[0]} | 取引ID:{detail[1]} | 商品:{detail[4]} | 単価:¥{detail[5]} | 数量:{detail[6]} | 金額:¥{detail[7]}')
        print()
        
        # 5. 統計情報
        print('📊 統計情報:')
        cursor.execute('SELECT COUNT(*) FROM transaction')
        tx_count = cursor.fetchone()[0]
        print(f'   総取引数: {tx_count}件')
        
        cursor.execute('SELECT COUNT(*) FROM transaction_detail')
        detail_count = cursor.fetchone()[0]
        print(f'   総明細数: {detail_count}件')
        
        cursor.execute('SELECT SUM(TTL_AMT) FROM transaction')
        total_sales = cursor.fetchone()[0] or 0
        print(f'   総売上: ¥{total_sales}')
        
        # 6. 今日の取引確認
        print()
        print('📅 今日の取引:')
        cursor.execute('''
            SELECT TRD_ID, EMP_CD, TTL_AMT, TRD_DATE 
            FROM transaction 
            WHERE DATE(TRD_DATE) = CURDATE()
            ORDER BY TRD_ID DESC
        ''')
        today_transactions = cursor.fetchall()
        if today_transactions:
            for tx in today_transactions:
                print(f'   取引ID:{tx[0]} | 担当者:{tx[1]} | 合計:¥{tx[2]} | 時刻:{tx[3]}')
        else:
            print('   今日の取引はありません')
        
        cursor.close()
        connection.close()
        print()
        print('✅ データベース確認完了!')
        
    except Error as e:
        print(f'❌ データベース接続エラー: {e}')
    except Exception as e:
        print(f'💥 予期しないエラー: {e}')

if __name__ == "__main__":
    check_azure_database() 