'use client'

export default function LogoutButton() {
  return (
    <form action="/logout" method="post">
      <button type="submit" className="hover:underline">
        đăng xuất
      </button>
    </form>
  )
}
