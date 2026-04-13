import { redirect } from "next/navigation"

export default function LoadsRedirectPage() {
  redirect("/?board=flat")
  }