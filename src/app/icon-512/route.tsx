import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: "#080d08",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 100,
        }}
      >
        <div
          style={{
            fontSize: 290,
            fontWeight: 900,
            color: "#4ade80",
            lineHeight: 1,
          }}
        >
          JS
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
