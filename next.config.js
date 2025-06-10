/** @type {import('next').NextConfig} */
const nextConfig = {
    // Azure App Service用の設定に変更
    output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
    trailingSlash: true,
    images: {
        unoptimized: true
    },
    reactStrictMode: true,
    compiler: {
        styledComponents: true,
    },
    // サーバー外部パッケージ設定（Next.js 15対応）
    serverExternalPackages: [],
    // 開発時のHTTPS設定
    ...(process.env.NODE_ENV === 'development' && process.env.HTTPS === 'true' && {
        server: {
            https: {
                key: './certs/localhost.key',
                cert: './certs/localhost.crt',
            },
        },
    }),
}

module.exports = nextConfig
