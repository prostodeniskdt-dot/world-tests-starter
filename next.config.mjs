/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Требуется для деплоя через Dockerfile (Timeweb Cloud, др.)
  // Без этого шаблон "Next.js" в App Platform использует статический экспорт,
  // который ломает API routes и возвращает HTML вместо JS → Unexpected token '<'
  output: "standalone",
};

export default nextConfig;
