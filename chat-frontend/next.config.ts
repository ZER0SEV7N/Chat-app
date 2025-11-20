import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  devIndicators : false,
  reactStrictMode: true,

  //Permite IPs o dominios que usas en desarrollo
  allowedDevOrigins: [
    "http://localhost:3001",
    "http://192.168.1.51:3001", // ← tu IP local o la de tu red Wi-Fi
  ],
};

export default nextConfig;
