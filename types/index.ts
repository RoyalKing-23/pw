export interface Batch {
  id: string
  name: string
  type: "online" | "offline"
  batches: {
    title: string
    image: string
    startDate: string
    endDate: string
    price: string
    originalPrice: string
    discount: string
    forText: string
  }[]
}

export interface WeekDay {
  name: string
  date: string
  day: number
  isToday?: boolean
  isYesterday?: boolean
}

