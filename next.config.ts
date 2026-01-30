import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  sw: "/sw.js",
  register: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/~offline",
  },
});

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default withPWAConfig(nextConfig);
