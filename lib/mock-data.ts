export type Branch = {
  id: string
  name: string
  handle: string
  address: string
  phone: string
  businessHours: string
  parkingInfo: string
  bookingLink: string
  shortIntro: string
  longIntro: string
  heroImage: string
  isPublic: boolean
  lastUpdated: string
  syncStatus: "synced" | "pending" | "error"
  // Optional extended fields (used by site renderer)
  kakaoLink?: string
  naverMapUrl?: string
  transportGuide?: string
  landmarkGuide?: string
}

export type Doctor = {
  id: string
  name: string
  title: string
  specialty: string
  image: string
  isPublic: boolean
  isFeatured: boolean
  branchId: string
}

export type Equipment = {
  id: string
  name: string
  description: string
  image: string
  isPublic: boolean
  isFeatured: boolean
  branchId: string
}

export type Treatment = {
  id: string
  name: string
  category: string
  description: string
  price: string
  duration: string
  image: string
  isPublic: boolean
  isFeatured: boolean
  branchId: string
}

export type Event = {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  thumbnail: string
  status: "scheduled" | "active" | "ended"
  isHomepage: boolean
  branchId: string
}

export type FAQ = {
  id: string
  question: string
  answer: string
  category: string
  isPublic: boolean
  isChatbotPriority: boolean
  linkedTreatments: string[]
  linkedBranches: string[]
  priority: number
}

export type Notice = {
  id: string
  title: string
  startDate: string
  endDate: string
  importance: "low" | "medium" | "high"
  isTopBanner: boolean
  isChatbotPriority: boolean
  branchId: string
}

export type RecentUpdate = {
  id: string
  type: string
  title: string
  branch: string
  updatedBy: string
  updatedAt: string
}

export const branches: Branch[] = [
  {
    id: "main",
    name: "Tatoa Main",
    handle: "@tatoa_main",
    address: "123 Gangnam-daero, Gangnam-gu, Seoul",
    phone: "02-1234-5678",
    businessHours: "Mon-Sat 10:00-19:00, Sun Closed",
    parkingInfo: "Free parking available (B1-B2)",
    bookingLink: "https://booking.tatoa.kr/main",
    shortIntro: "Premium aesthetic clinic in the heart of Gangnam",
    longIntro: "Tatoa Main has been providing exceptional aesthetic treatments since 2015. Our team of board-certified physicians combines cutting-edge technology with personalized care to help you achieve your beauty goals.",
    heroImage: "/hero-main.jpg",
    isPublic: true,
    lastUpdated: "2026-04-15T10:30:00Z",
    syncStatus: "synced",
    kakaoLink: "https://pf.kakao.com/_tatoa_main",
    transportGuide: "지하철 2호선 강남역 3번 출구에서 도보 5분\n버스 146, 341번 강남역 정류장 하차",
    landmarkGuide: "강남역 CGV 건물 맞은편 / 스타벅스 강남점 2층"
  },
  {
    id: "sinsa",
    name: "Tatoa Sinsa",
    handle: "@tatoa_sinsa",
    address: "456 Sinsa-dong, Gangnam-gu, Seoul",
    phone: "02-2345-6789",
    businessHours: "Mon-Fri 10:00-20:00, Sat 10:00-18:00",
    parkingInfo: "Valet parking available",
    bookingLink: "https://booking.tatoa.kr/sinsa",
    shortIntro: "Boutique aesthetic experience in trendy Sinsa",
    longIntro: "Located in the fashionable Garosu-gil area, Tatoa Sinsa offers an intimate and exclusive aesthetic experience with our signature treatments and personalized consultations.",
    heroImage: "/hero-sinsa.jpg",
    isPublic: true,
    lastUpdated: "2026-04-14T15:45:00Z",
    syncStatus: "pending",
    kakaoLink: "https://pf.kakao.com/_tatoa_sinsa",
    transportGuide: "지하철 3호선 신사역 8번 출구에서 도보 3분\n가로수길 방향으로 직진",
    landmarkGuide: "신사역 가로수길 입구 / 나이키 매장 옆 건물"
  },
  {
    id: "gumi",
    name: "Tatoa Gumi",
    handle: "@tatoa_gumi",
    address: "789 Ingui-dong, Gumi-si, Gyeongbuk",
    phone: "054-123-4567",
    businessHours: "Mon-Sat 09:00-18:00",
    parkingInfo: "Free parking lot (50 spaces)",
    bookingLink: "https://booking.tatoa.kr/gumi",
    shortIntro: "Bringing premium aesthetics to Gumi",
    longIntro: "Tatoa Gumi brings the same level of excellence and care to the Gyeongbuk region, making premium aesthetic treatments accessible to our valued clients outside of Seoul.",
    heroImage: "/hero-gumi.jpg",
    isPublic: false,
    lastUpdated: "2026-04-10T09:00:00Z",
    syncStatus: "error",
    kakaoLink: "https://pf.kakao.com/_tatoa_gumi",
    transportGuide: "구미역에서 버스 10분 / 택시 8분\n인의동 주민센터 인근",
    landmarkGuide: "구미 인의동 CGV 건물 3층"
  }
]

export const doctors: Doctor[] = [
  { id: "d1", name: "Dr. Kim Min-ji", title: "Medical Director", specialty: "Facial Contouring", image: "/doctors/kim.jpg", isPublic: true, isFeatured: true, branchId: "main" },
  { id: "d2", name: "Dr. Park Seo-yeon", title: "Senior Physician", specialty: "Skin Rejuvenation", image: "/doctors/park.jpg", isPublic: true, isFeatured: true, branchId: "main" },
  { id: "d3", name: "Dr. Lee Jun-ho", title: "Physician", specialty: "Body Contouring", image: "/doctors/lee.jpg", isPublic: true, isFeatured: false, branchId: "main" },
  { id: "d4", name: "Dr. Choi Yuna", title: "Medical Director", specialty: "Anti-aging", image: "/doctors/choi.jpg", isPublic: true, isFeatured: true, branchId: "sinsa" },
  { id: "d5", name: "Dr. Jung Dae-won", title: "Senior Physician", specialty: "Laser Treatments", image: "/doctors/jung.jpg", isPublic: true, isFeatured: false, branchId: "sinsa" },
  { id: "d6", name: "Dr. Han Soo-min", title: "Medical Director", specialty: "General Aesthetics", image: "/doctors/han.jpg", isPublic: true, isFeatured: true, branchId: "gumi" },
]

export const equipment: Equipment[] = [
  { id: "e1", name: "Ulthera", description: "FDA-approved ultrasound skin lifting device", image: "/equipment/ulthera.jpg", isPublic: true, isFeatured: true, branchId: "main" },
  { id: "e2", name: "PicoSure", description: "Advanced picosecond laser for skin concerns", image: "/equipment/picosure.jpg", isPublic: true, isFeatured: true, branchId: "main" },
  { id: "e3", name: "Thermage FLX", description: "Radiofrequency skin tightening system", image: "/equipment/thermage.jpg", isPublic: true, isFeatured: false, branchId: "main" },
  { id: "e4", name: "Morpheus8", description: "Microneedling with RF technology", image: "/equipment/morpheus.jpg", isPublic: true, isFeatured: true, branchId: "sinsa" },
  { id: "e5", name: "CoolSculpting Elite", description: "Non-invasive fat reduction system", image: "/equipment/coolsculpting.jpg", isPublic: true, isFeatured: false, branchId: "sinsa" },
  { id: "e6", name: "Gentle Max Pro", description: "Dual-wavelength laser platform", image: "/equipment/gentlemax.jpg", isPublic: true, isFeatured: true, branchId: "gumi" },
]

export const treatments: Treatment[] = [
  { id: "t1", name: "Signature Lifting", category: "Lifting", description: "Our premium combination lifting treatment", price: "1,500,000 KRW", duration: "90 min", image: "/treatments/lifting.jpg", isPublic: true, isFeatured: true, branchId: "main" },
  { id: "t2", name: "Crystal Glow Facial", category: "Skin Care", description: "Deep hydration and brightening facial", price: "350,000 KRW", duration: "60 min", image: "/treatments/facial.jpg", isPublic: true, isFeatured: true, branchId: "main" },
  { id: "t3", name: "V-Line Contouring", category: "Contouring", description: "Non-surgical jaw contouring", price: "800,000 KRW", duration: "45 min", image: "/treatments/vline.jpg", isPublic: true, isFeatured: false, branchId: "main" },
  { id: "t4", name: "Laser Toning", category: "Skin Care", description: "Pigmentation and tone correction", price: "200,000 KRW", duration: "30 min", image: "/treatments/toning.jpg", isPublic: true, isFeatured: true, branchId: "sinsa" },
  { id: "t5", name: "Body Sculpting", category: "Body", description: "Targeted fat reduction treatment", price: "500,000 KRW", duration: "60 min", image: "/treatments/body.jpg", isPublic: true, isFeatured: false, branchId: "sinsa" },
  { id: "t6", name: "Anti-Aging Package", category: "Anti-aging", description: "Comprehensive rejuvenation program", price: "2,000,000 KRW", duration: "120 min", image: "/treatments/antiaging.jpg", isPublic: true, isFeatured: true, branchId: "gumi" },
]

export const events: Event[] = [
  { id: "ev1", title: "Spring Glow Special", description: "20% off all brightening treatments", startDate: "2026-04-01", endDate: "2026-04-30", thumbnail: "/events/spring.jpg", status: "active", isHomepage: true, branchId: "main" },
  { id: "ev2", title: "New Member Welcome", description: "Complimentary consultation + 10% off first treatment", startDate: "2026-01-01", endDate: "2026-12-31", thumbnail: "/events/welcome.jpg", status: "active", isHomepage: true, branchId: "main" },
  { id: "ev3", title: "Mother's Day Package", description: "Special duo packages for mother and daughter", startDate: "2026-05-01", endDate: "2026-05-14", thumbnail: "/events/mothers.jpg", status: "scheduled", isHomepage: false, branchId: "sinsa" },
  { id: "ev4", title: "Winter Hydration", description: "Deep moisturizing treatments at special prices", startDate: "2025-12-01", endDate: "2026-02-28", thumbnail: "/events/winter.jpg", status: "ended", isHomepage: false, branchId: "gumi" },
  { id: "ev5", title: "Grand Opening Celebration", description: "Special prices for Gumi branch opening", startDate: "2026-05-15", endDate: "2026-06-15", thumbnail: "/events/opening.jpg", status: "scheduled", isHomepage: true, branchId: "gumi" },
]

export const faqs: FAQ[] = [
  { id: "f1", question: "What should I do before my first visit?", answer: "Please arrive 15 minutes early to complete registration. Bring your ID and any relevant medical records.", category: "General", isPublic: true, isChatbotPriority: true, linkedTreatments: [], linkedBranches: ["main", "sinsa", "gumi"], priority: 1 },
  { id: "f2", question: "Is the lifting treatment painful?", answer: "Most patients experience minimal discomfort. We apply numbing cream before the procedure and offer comfort measures throughout.", category: "Treatments", isPublic: true, isChatbotPriority: true, linkedTreatments: ["t1"], linkedBranches: ["main"], priority: 2 },
  { id: "f3", question: "How long do results last?", answer: "Results vary by treatment. Lifting treatments typically last 12-18 months, while skincare treatments may require monthly maintenance.", category: "Results", isPublic: true, isChatbotPriority: true, linkedTreatments: ["t1", "t2"], linkedBranches: ["main", "sinsa"], priority: 3 },
  { id: "f4", question: "Do you offer payment plans?", answer: "Yes, we partner with several financing options. Please inquire at the front desk for available plans.", category: "Payment", isPublic: true, isChatbotPriority: false, linkedTreatments: [], linkedBranches: ["main", "sinsa", "gumi"], priority: 4 },
  { id: "f5", question: "Can I cancel or reschedule my appointment?", answer: "Please notify us at least 24 hours in advance. Late cancellations may incur a fee.", category: "Booking", isPublic: true, isChatbotPriority: true, linkedTreatments: [], linkedBranches: ["main", "sinsa", "gumi"], priority: 5 },
]

export const notices: Notice[] = [
  { id: "n1", title: "Holiday Hours: Closed April 22-24", startDate: "2026-04-15", endDate: "2026-04-25", importance: "high", isTopBanner: true, isChatbotPriority: true, branchId: "main" },
  { id: "n2", title: "New Equipment: Morpheus8 Now Available", startDate: "2026-04-10", endDate: "2026-04-30", importance: "medium", isTopBanner: false, isChatbotPriority: true, branchId: "sinsa" },
  { id: "n3", title: "Parking Notice: B2 Under Maintenance", startDate: "2026-04-16", endDate: "2026-04-18", importance: "medium", isTopBanner: true, isChatbotPriority: false, branchId: "main" },
]

export const recentUpdates: RecentUpdate[] = [
  { id: "u1", type: "Branch Info", title: "Updated business hours", branch: "Tatoa Main", updatedBy: "Admin Kim", updatedAt: "2026-04-15T10:30:00Z" },
  { id: "u2", type: "Event", title: "Spring Glow Special activated", branch: "Tatoa Main", updatedBy: "Admin Park", updatedAt: "2026-04-14T16:00:00Z" },
  { id: "u3", type: "Doctor", title: "Added Dr. Choi profile", branch: "Tatoa Sinsa", updatedBy: "Admin Kim", updatedAt: "2026-04-14T14:20:00Z" },
  { id: "u4", type: "Notice", title: "Holiday hours announcement", branch: "Tatoa Main", updatedBy: "Admin Lee", updatedAt: "2026-04-14T11:00:00Z" },
  { id: "u5", type: "Treatment", title: "Updated pricing for V-Line", branch: "Tatoa Main", updatedBy: "Admin Kim", updatedAt: "2026-04-13T09:45:00Z" },
  { id: "u6", type: "FAQ", title: "Added new FAQ about results", branch: "All Branches", updatedBy: "Admin Park", updatedAt: "2026-04-12T15:30:00Z" },
]

export const kpiData = {
  totalBranches: 3,
  activeBranches: 2,
  totalDoctors: 6,
  totalTreatments: 6,
  totalEvents: 4,
  monthlyVisits: 1284,
  monthlyRevenue: 48500000,
  avgRating: 4.8,
  updatedToday: 3,
  expiringSoon: 2,
  staleContent: 1,
  lastSyncTime: "2026-04-27T09:00:00Z",
}

export type BranchWebsite = {
  id: string
  branchId: string
  status: "draft" | "review" | "published"
  hasUnpublishedChanges: boolean
  previewUrl: string
  liveUrl: string
  lastPublishedAt: string | null
  lastUpdatedAt: string
}

export const branchWebsites: BranchWebsite[] = [
  {
    id: "bw1",
    branchId: "main",
    status: "published",
    hasUnpublishedChanges: true,
    previewUrl: "/preview/site/main",
    liveUrl: "/preview/site/main?mode=live",
    lastPublishedAt: "2026-04-20T10:00:00Z",
    lastUpdatedAt: "2026-04-27T09:00:00Z",
  },
  {
    id: "bw2",
    branchId: "sinsa",
    status: "review",
    hasUnpublishedChanges: true,
    previewUrl: "/preview/site/sinsa",
    liveUrl: "/preview/site/sinsa?mode=live",
    lastPublishedAt: "2026-04-15T14:00:00Z",
    lastUpdatedAt: "2026-04-26T17:30:00Z",
  },
  {
    id: "bw3",
    branchId: "gumi",
    status: "draft",
    hasUnpublishedChanges: false,
    previewUrl: "/preview/site/gumi",
    liveUrl: "/preview/site/gumi?mode=live",
    lastPublishedAt: null,
    lastUpdatedAt: "2026-04-10T09:00:00Z",
  },
]
