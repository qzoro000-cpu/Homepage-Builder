"use client"

import { useSiteData } from "../layout"
import { PreviewBooking } from "@/components/site/sections/booking-preview"

export default function BookingPage() {
  const { snapshot } = useSiteData()

  if (!snapshot) return null

  const bookingValues = snapshot.homepage.bookingValues ?? {}
  const branch = snapshot.branch
  const branches = [
    {
      id: branch.id,
      name: branch.name,
      address: branch.address,
      isPublic: true,
    },
  ]

  return (
    <PreviewBooking
      values={bookingValues}
      branchId={branch.id}
      branches={branches}
      mode="page"
    />
  )
}
