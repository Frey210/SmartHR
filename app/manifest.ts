import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MTC Attendance",
    short_name: "MTC Attendance",
    description: "Pencatatan kehadiran dan dokumentasi kerja PT Media Teknologi Celebes",
    start_url: "/",
    display: "standalone",
    background_color: "#198AFF",
    theme_color: "#198AFF",
    icons: [{ src: "/mtc-logo.jpg", sizes: "640x640", type: "image/jpeg", purpose: "maskable" }],
  };
}
