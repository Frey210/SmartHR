import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MTC Attendance",
    short_name: "MTC Attendance",
    description: "Pencatatan kehadiran dan dokumentasi kerja PT Media Teknologi Celebes",
    start_url: "/",
    display: "standalone",
    background_color: "#2999DE",
    theme_color: "#248FDC",
    icons: [{ src: "/mtc-logo.jpg", sizes: "any", type: "image/jpeg" }],
  };
}
