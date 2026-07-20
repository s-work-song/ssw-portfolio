import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.LOCAL_DEV_IP
    ? [process.env.LOCAL_DEV_IP]
    : [], // 스마트폰 IP는 .env.local에서 관리하여 Git에 올라가지 않도록 처리
};

export default nextConfig;
