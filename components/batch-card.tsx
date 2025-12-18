"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { MessageCircle, LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BatchCardProps {
  id: string
  title: string
  image: string
  startDate: string
  endDate: string
  price: string
  originalPrice: string
  discount: string
  forText: string
}

export function BatchCard({
  id,
  title,
  image,
  startDate,
  endDate,
  price,
  originalPrice,
  discount,
  forText,
}: BatchCardProps) {
  const router = useRouter()

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
      <div className="relative">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          width={400}
          height={200}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <span className="bg-yellow-400 text-xs px-2 py-1 rounded">New</span>
          <span className="bg-white p-1 rounded">
            <MessageCircle className="w-4 h-4" />
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-2 text-sm sm:text-base">{title}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <LifeBuoy className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm">{forText}</span>
        </div>
        <div className="text-xs sm:text-sm text-gray-600 mb-4">
          <div>Starts on {startDate}</div>
          <div>Ends on {endDate}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-base sm:text-lg font-bold">₹{price}</span>
          <span className="text-xs sm:text-sm text-gray-500 line-through">₹{originalPrice}</span>
          <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">Discount of {discount}% applied</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 text-xs sm:text-sm" onClick={() => router.push(`/batch/${id}`)}>
            Explore
          </Button>
          <Button className="flex-1 text-xs sm:text-sm" onClick={() => router.push(`/batch/${id}/purchase`)}>
            BUY NOW
          </Button>
        </div>
      </div>
    </div>
  )
}

