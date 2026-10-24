export type UserRole = "ADMIN" | "HR" | "EMPLOYEE";

export function roleHome(role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "HR") return "/hr";
  return "/employee";
}

export function canReviewAttendance(role: string) {
  return role === "ADMIN" || role === "HR";
}
