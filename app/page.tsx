import { redirect } from "next/navigation";

// Root page redirects via middleware. This is a fallback.
export default function HomePage() {
  redirect("/login");
}
