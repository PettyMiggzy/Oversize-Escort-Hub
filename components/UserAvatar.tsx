"use client"
import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

interface UserAvatarProps {
  userId?: string
  name?: string
  avatarUrl?: string | null
  size?: number
  showUpload?: boolean
  onUpload?: (url: string) => void
}

// Get initials from name
function getInitials(name?: string): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?"
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase()
}

// Simple hash for color
function nameColor(name?: string): string {
  if (!name) return "#ff6600"
  const colors = ["#f60", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#f59e0b", "#06b6d4"]
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

export function UserAvatar({ userId, name, avatarUrl, size = 36, showUpload = false, onUpload }: UserAvatarProps) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const initials = getInitials(name)
  const color = nameColor(name)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    try {
      const ext = file.name.split(".").pop()
      const path = `avatars/${userId}/avatar.${ext}`
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true })
      if (error) { console.error(error); return }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      onUpload?.(data.publicUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name ?? "Avatar"}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.12)" }}
        />
      ) : (
        <div style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.38,
          fontWeight: 700,
          color: "#000",
          border: "2px solid rgba(255,255,255,0.12)",
          flexShrink: 0,
          userSelect: "none",
        }}>
          {initials}
        </div>
      )}
      {showUpload && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Upload photo"
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#ff6600",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "#000",
              fontWeight: 700,
            }}
          >
            {uploading ? "…" : "+"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
        </>
      )}
    </div>
  )
}

export default UserAvatar
