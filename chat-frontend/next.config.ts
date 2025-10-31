import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  devIndicators : false,
  reactStrictMode: true,

  //Permite IPs o dominios que usas en desarrollo
  allowedDevOrigins: [
    "http://localhost:3001",
    "http://172.26.176.1:3001", // ← tu IP local o la de tu red Wi-Fi
  ],
};

export default nextConfig;
