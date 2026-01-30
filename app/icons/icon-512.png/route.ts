import React from "react";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export function GET(_req: NextRequest) {
  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          background: "#FF9A8B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontSize: 140,
          fontWeight: 800,
          letterSpacing: 4,
        },
      },
      "吃了吗"
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
