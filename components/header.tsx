import { ChevronRight } from "lucide-react"
import { ProfileDropdown } from "./profile-dropdown"

export function Header() {
  return (
    <header className="bg-white p-4 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2">
          <span className="text-yellow-500">⭐</span>
          <span className="hidden sm:inline">12th - IIT JEE</span>
          <ChevronRight className="w-4 h-4" />
        </div>
        <ProfileDropdown />
      </div>
    </header>
  )
}

