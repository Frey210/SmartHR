import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MTC Attendance",
    short_name: "MTC Attendance",
    description: "Pencatatan kehadiran dan dokumentasi kerja PT Media Teknologi Celebes",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F7F9",
    theme_color: "#2B3C5A",
    icons: [{ src: "/mtc-logo.jpg", sizes: "any", type: "image/jpeg" }],
  };
}
