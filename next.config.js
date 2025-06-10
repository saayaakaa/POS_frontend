/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    compiler: {
        styledComponents: true,
    },
    // サーバー外部パッケージ設定（Next.js 15対応）
    serverExternalPackages: [],
    // standalone 出力設定（Azure App Service 用）
    output: 'standalone',

    // 開発時のHTTPS設定
    ...(process.env.NODE_ENV === 'development' && process.env.HTTPS === 'true' && {
        server: {
            https: {
                key: './certs/localhost.key',
                cert: './certs/localhost.crt',
            },
        },
    }),
};

module.exports = nextConfig;
