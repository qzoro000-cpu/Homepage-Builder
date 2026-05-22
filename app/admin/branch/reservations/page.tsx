"use client"

import { useState, useMemo } from "react"
import {
  Search, Download, ChevronLeft, ChevronRight, X,
  Clock, Tag, FileText,
  AlertCircle, CheckCircle2, Clock4, RefreshCcw, Minus,
  TrendingUp, CalendarCheck, Zap,
  Calendar, MapPin, CreditCard, Grip, Bell, Inbox,
  Plus, Lock, Unlock, Trash2, Star,
  MessageCircle, Mail, Smartphone, Send, Settings,
  CheckCheck, Eye, EyeOff, ChevronDown, ChevronUp, TestTube,
  Check, AlarmClock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type ReservationStatus = "대기" | "확정" | "확인필요" | "변경요청" | "완료" | "부도"
type UTMSource        = "카카오" | "네이버" | "인스타그램" | "직접" | "기타"
type VisitType        = "신환" | "재진"
type LoginMethod      = "kakao" | "google" | "phone"
type ReminderKey      = "week" | "threeDays" | "dayOf"

type ReservationReminders = { week: boolean; threeDays: boolean; dayOf: boolean }

type Reservation = {
  id: string; name: string; phone: string; email?: string
  branchId: string; branchName: string
  treatments: string[]; treatmentCategory: string
  slot: string; date: string; time: string
  visitType: VisitType; status: ReservationStatus
  utmSource: UTMSource; loginMethod: LoginMethod
  createdAt: string; amount: number; note: string
  reminders: ReservationReminders
}

type BookingSlot = { id: string; label: string; enabled: boolean }

type ReminderScheduleItem = { enabled: boolean; sendAt: string }

type NotifSettings = {
  kakao: { enabled: boolean; channelId: string; apiKey: string; senderKey: string; template: string }
  email: { enabled: boolean; senderEmail: string; senderName: string; smtpHost: string; smtpPort: string; template: string }
  sms:   { enabled: boolean; senderPhone: string; provider: string; apiKey: string; apiSecret: string; template: string }
  reminderSchedule: {
    enabled: boolean
    channel: "auto" | "kakao" | "email" | "sms"
    week:      ReminderScheduleItem
    threeDays: ReminderScheduleItem
    dayOf:     ReminderScheduleItem
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ReservationStatus, {
  bg: string; text: string; border: string; icon: React.ElementType; dot: string
}> = {
  "대기":     { bg:"#fef9c3", text:"#854d0e", border:"#fbbf24", icon:Clock4,       dot:"#f59e0b" },
  "확정":     { bg:"#dcfce7", text:"#14532d", border:"#4ade80", icon:CheckCircle2, dot:"#22c55e" },
  "확인필요": { bg:"#fee2e2", text:"#7f1d1d", border:"#f87171", icon:AlertCircle,  dot:"#ef4444" },
  "변경요청": { bg:"#f3e8ff", text:"#581c87", border:"#c084fc", icon:RefreshCcw,   dot:"#a855f7" },
  "완료":     { bg:"#f3f4f6", text:"#374151", border:"#d1d5db", icon:Minus,        dot:"#6b7280" },
  "부도":     { bg:"#fef2f2", text:"#7f1d1d", border:"#fca5a5", icon:AlertCircle,  dot:"#dc2626" },
}

const UTM_CFG: Record<UTMSource, { color: string; bg: string; label: string }> = {
  "카카오":     { color:"#5a4a00", bg:"#fee500", label:"카카오" },
  "네이버":     { color:"#003d1f", bg:"#03c75a", label:"네이버" },
  "인스타그램": { color:"#ffffff", bg:"#e1306c", label:"인스타" },
  "직접":       { color:"#374151", bg:"#e5e7eb", label:"직접"   },
  "기타":       { color:"#6b7280", bg:"#f3f4f6", label:"기타"   },
}

const NOTIF_CHANNEL: Record<LoginMethod, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  kakao:  { label:"카카오 알림톡", icon:MessageCircle, color:"#5a4a00", bg:"#fee500" },
  google: { label:"이메일",        icon:Mail,          color:"#1a56db", bg:"#dbeafe" },
  phone:  { label:"SMS",           icon:Smartphone,    color:"#374151", bg:"#f3f4f6" },
}

const SLOT_LABELS = "ABCDEFGHIJKLMNOP"

const DEFAULT_SLOTS: BookingSlot[] = [
  { id:"A", label:"예약A", enabled:true },
  { id:"B", label:"예약B", enabled:true },
  { id:"C", label:"예약C", enabled:true },
]

const DEFAULT_NOTIF: NotifSettings = {
  kakao: {
    enabled: true, channelId: "@tatoa_main", apiKey: "",
    senderKey: "",
    template: `[예약 확정 안내]\n안녕하세요, {name}님.\n{branchName} 예약이 확정되었습니다.\n\n■ 예약 일시: {date} {time}\n■ 시술: {treatments}\n■ 예상 금액: ₩{amount}\n\n문의: 02-1234-5678\nTATOA 드림`,
  },
  email: {
    enabled: false, senderEmail: "noreply@tatoa.kr", senderName: "TATOA 피부과",
    smtpHost: "smtp.gmail.com", smtpPort: "587",
    template: `안녕하세요, {name}님.\n{branchName} 예약이 확정되었습니다.\n\n예약 일시: {date} {time}\n시술: {treatments}\n예상 금액: ₩{amount}\n\n감사합니다.\nTATOA 피부과 드림`,
  },
  sms: {
    enabled: true, senderPhone: "0212345678", provider: "CoolSMS",
    apiKey: "", apiSecret: "",
    template: `[TATOA] {name}님, {branchName} 예약이 확정되었습니다. 일시: {date} {time}. 문의: 02-1234-5678`,
  },
  reminderSchedule: {
    enabled:  true,
    channel:  "auto",
    week:      { enabled: true,  sendAt: "10:00" },
    threeDays: { enabled: true,  sendAt: "10:00" },
    dayOf:     { enabled: true,  sendAt: "08:00" },
  },
}

// ─── Reminder config ──────────────────────────────────────────────────────────

const REMINDER_ITEMS: { key: ReminderKey; label: string; desc: string; daysBefore: number }[] = [
  { key: "week",      label: "1주일 전 알림",   desc: "예약 7일 전 발송",    daysBefore: 7 },
  { key: "threeDays", label: "3일 전 알림",      desc: "예약 3일 전 발송",    daysBefore: 3 },
  { key: "dayOf",     label: "당일 오전 알림",   desc: "예약 당일 오전 발송", daysBefore: 0 },
]

/** 발송 예정일 계산: 예약일로부터 daysBefore만큼 앞 */
function reminderSendDate(reservationDate: string, daysBefore: number): string {
  const d = new Date(reservationDate)
  d.setDate(d.getDate() - daysBefore)
  return d.toISOString().split("T")[0]
}
/** 가장 가까운 7일 내 발송 예정 리마인더 목록 */
function getUpcomingReminders(
  reservations: Reservation[],
  settings: NotifSettings
): { reservation: Reservation; key: ReminderKey; label: string; sendDate: string; sendAt: string }[] {
  if (!settings.reminderSchedule.enabled) return []
  const results: { reservation: Reservation; key: ReminderKey; label: string; sendDate: string; sendAt: string }[] = []
  const until = dateOffset(7)
  for (const r of reservations) {
    if (r.status === "부도" || r.status === "완료") continue
    for (const item of REMINDER_ITEMS) {
      if (!settings.reminderSchedule[item.key].enabled) continue
      if (!r.reminders[item.key]) continue
      const sd = reminderSendDate(r.date, item.daysBefore)
      if (sd >= TODAY && sd <= until) {
        results.push({
          reservation: r,
          key:      item.key,
          label:    item.label,
          sendDate: sd,
          sendAt:   settings.reminderSchedule[item.key].sendAt,
        })
      }
    }
  }
  return results.sort((a, b) => (a.sendDate + a.sendAt).localeCompare(b.sendDate + b.sendAt))
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const TODAY = "2026-04-22"
function dateOffset(days: number) {
  const d = new Date(TODAY); d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}
function fmtDate(s: string) { return s.replace(/-/g, ". ") }
function fmtCreated(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2,"0")
  return `${d.getFullYear()}. ${p(d.getMonth()+1)}. ${p(d.getDate())}.`
}
function fillTemplate(tpl: string, r: Reservation) {
  return tpl
    .replace(/{name}/g, r.name)
    .replace(/{branchName}/g, r.branchName)
    .replace(/{date}/g, fmtDate(r.date))
    .replace(/{time}/g, r.time)
    .replace(/{treatments}/g, r.treatments.join(", "))
    .replace(/{amount}/g, r.amount.toLocaleString())
    .replace(/{phone}/g, r.phone)
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// reminders 논리:
// - 과거/완료/부도: 모두 false (이미 지난 날짜)
// - 오늘 예약:  week/threeDays는 이미 지남 → false, dayOf만 opt-in 여부
// - 내일(+1):   week는 아직 멀어 미체크, threeDays 아직 멀어 false, dayOf만
// - +3일:       3일 전=오늘 → 3일 알림 발송 대상. week false
// - +7일:       7일 전=오늘 → 1주일 알림 발송 대상
const ALL_RESERVATIONS: Reservation[] = [
  { id:"r19", name:"문서준", phone:"01090123567",                   branchId:"main",  branchName:"강남점", treatments:["피코슈어","레이저 토닝"],    treatmentCategory:"레이저",  slot:"A", date:dateOffset(-1), time:"14:00", visitType:"재진", status:"완료",     utmSource:"카카오",     loginMethod:"kakao",  createdAt:"2026-04-15T14:00:00Z", amount:500000,  note:"",                     reminders:{ week:false, threeDays:false, dayOf:false } },
  { id:"r20", name:"백예린", phone:"01012345671",                   branchId:"gumi",  branchName:"구미점", treatments:["크리스탈 글로우"],           treatmentCategory:"스킨케어",slot:"B", date:dateOffset(-2), time:"10:30", visitType:"신환", status:"부도",     utmSource:"직접",       loginMethod:"phone",  createdAt:"2026-04-10T09:00:00Z", amount:350000,  note:"연락 두절",             reminders:{ week:false, threeDays:false, dayOf:false } },
  // TODAY 09:00 → FULL (A+B+C)
  { id:"r7",  name:"노지훈", phone:"01023456791",                   branchId:"main",  branchName:"강남점", treatments:["써마지 FLX"],               treatmentCategory:"리프팅",  slot:"A", date:TODAY,          time:"09:00", visitType:"신환", status:"확정",     utmSource:"네이버",     loginMethod:"google", email:"noji@email.com",    createdAt:"2026-04-19T16:00:00Z", amount:800000,  note:"",                     reminders:{ week:false, threeDays:false, dayOf:true  } },
  { id:"rx1", name:"이현아", phone:"01034577000",                   branchId:"main",  branchName:"강남점", treatments:["울쎄라"],                   treatmentCategory:"리프팅",  slot:"B", date:TODAY,          time:"09:00", visitType:"재진", status:"확정",     utmSource:"직접",       loginMethod:"phone",  createdAt:"2026-04-20T08:00:00Z", amount:1500000, note:"",                     reminders:{ week:false, threeDays:false, dayOf:false } },
  { id:"rx2", name:"권민준", phone:"01056780001",                   branchId:"main",  branchName:"강남점", treatments:["항노화 패키지"],             treatmentCategory:"항노화",  slot:"C", date:TODAY,          time:"09:00", visitType:"신환", status:"대기",     utmSource:"인스타그램", loginMethod:"phone",  createdAt:"2026-04-21T09:30:00Z", amount:2000000, note:"",                     reminders:{ week:false, threeDays:false, dayOf:true  } },
  // TODAY 10:00
  { id:"r2",  name:"이서연", phone:"01023456789", email:"seo@g.com", branchId:"main",  branchName:"강남점", treatments:["울쎄라"],                   treatmentCategory:"리프팅",  slot:"A", date:TODAY,          time:"10:00", visitType:"재진", status:"확정",     utmSource:"네이버",     loginMethod:"google", createdAt:"2026-04-20T14:10:00Z", amount:1500000, note:"VIP 고객",              reminders:{ week:false, threeDays:false, dayOf:true  } },
  { id:"rx3", name:"서지우", phone:"01078900002",                   branchId:"main",  branchName:"강남점", treatments:["크리스탈 글로우"],           treatmentCategory:"스킨케어",slot:"B", date:TODAY,          time:"10:00", visitType:"신환", status:"대기",     utmSource:"카카오",     loginMethod:"kakao",  createdAt:"2026-04-22T06:00:00Z", amount:350000,  note:"",                     reminders:{ week:false, threeDays:false, dayOf:false } },
  // TODAY 10:30
  { id:"r6",  name:"한수민", phone:"01078901234",                   branchId:"gumi",  branchName:"구미점", treatments:["항노화 패키지"],             treatmentCategory:"항노화",  slot:"A", date:TODAY,          time:"10:30", visitType:"신환", status:"대기",     utmSource:"네이버",     loginMethod:"phone",  createdAt:"2026-04-22T07:55:00Z", amount:2000000, note:"",                     reminders:{ week:false, threeDays:false, dayOf:true  } },
  // TODAY 11:30
  { id:"r3",  name:"박지민", phone:"01034567890",                   branchId:"main",  branchName:"강남점", treatments:["크리스탈 글로우"],           treatmentCategory:"스킨케어",slot:"A", date:TODAY,          time:"11:30", visitType:"신환", status:"대기",     utmSource:"인스타그램", loginMethod:"phone",  createdAt:"2026-04-21T08:45:00Z", amount:350000,  note:"",                     reminders:{ week:false, threeDays:false, dayOf:true  } },
  { id:"rx4", name:"홍가람", phone:"01022220003",                   branchId:"sinsa", branchName:"신사점", treatments:["레이저 토닝"],               treatmentCategory:"레이저",  slot:"B", date:TODAY,          time:"11:30", visitType:"재진", status:"변경요청", utmSource:"카카오",     loginMethod:"kakao",  createdAt:"2026-04-22T09:00:00Z", amount:200000,  note:"시간 조정 요청",        reminders:{ week:false, threeDays:false, dayOf:false } },
  // TODAY 14:00
  { id:"r4",  name:"최유나", phone:"01056789012",                   branchId:"sinsa", branchName:"신사점", treatments:["레이저 토닝","피부관리"],    treatmentCategory:"레이저",  slot:"A", date:TODAY,          time:"14:00", visitType:"재진", status:"확인필요", utmSource:"카카오",     loginMethod:"kakao",  createdAt:"2026-04-21T10:20:00Z", amount:400000,  note:"알레르기 이력 확인 필요", reminders:{ week:false, threeDays:false, dayOf:true  } },
  // TODAY 15:30
  { id:"r5",  name:"정대원", phone:"01067890123",                   branchId:"main",  branchName:"강남점", treatments:["써마지 FLX"],               treatmentCategory:"리프팅",  slot:"A", date:TODAY,          time:"15:30", visitType:"신환", status:"변경요청", utmSource:"직접",       loginMethod:"phone",  createdAt:"2026-04-20T16:00:00Z", amount:800000,  note:"시간 변경 요청됨",      reminders:{ week:false, threeDays:false, dayOf:false } },
  // TODAY 16:00
  { id:"r8",  name:"석다은", phone:"01034567892",                   branchId:"main",  branchName:"강남점", treatments:["항노화 패키지"],             treatmentCategory:"항노화",  slot:"A", date:TODAY,          time:"16:00", visitType:"재진", status:"대기",     utmSource:"인스타그램", loginMethod:"phone",  createdAt:"2026-04-22T06:30:00Z", amount:2000000, note:"",                     reminders:{ week:false, threeDays:false, dayOf:true  } },
  // Yesterday
  { id:"r1",  name:"김일우", phone:"01053756275",                   branchId:"sinsa", branchName:"신사점", treatments:["사각턱 보톡스"],             treatmentCategory:"윤곽",    slot:"A", date:"2026-04-21",   time:"12:30", visitType:"신환", status:"대기",     utmSource:"카카오",     loginMethod:"kakao",  createdAt:"2026-04-18T09:22:00Z", amount:200000,  note:"",                     reminders:{ week:false, threeDays:false, dayOf:false } },
  // Tomorrow (+1) → 3일 전 아직 아님, dayOf는 내일
  { id:"r9",  name:"김민정", phone:"01089012345",                   branchId:"main",  branchName:"강남점", treatments:["V라인 윤곽"],               treatmentCategory:"윤곽",    slot:"A", date:dateOffset(1),  time:"10:00", visitType:"재진", status:"확정",     utmSource:"인스타그램", loginMethod:"phone",  createdAt:"2026-04-19T11:30:00Z", amount:600000,  note:"",                     reminders:{ week:false, threeDays:false, dayOf:true  } },
  { id:"r10", name:"오예진", phone:"01090123456",                   branchId:"sinsa", branchName:"신사점", treatments:["피코슈어"],                 treatmentCategory:"레이저",  slot:"B", date:dateOffset(1),  time:"10:00", visitType:"신환", status:"대기",     utmSource:"카카오",     loginMethod:"kakao",  createdAt:"2026-04-22T09:10:00Z", amount:300000,  note:"",                     reminders:{ week:false, threeDays:false, dayOf:false } },
  { id:"rx5", name:"박태준", phone:"01011110004", email:"pt@g.com",  branchId:"main",  branchName:"강남점", treatments:["레이저 토닝"],               treatmentCategory:"레이저",  slot:"C", date:dateOffset(1),  time:"10:00", visitType:"신환", status:"대기",     utmSource:"네이버",     loginMethod:"google", createdAt:"2026-04-22T10:00:00Z", amount:200000,  note:"",                     reminders:{ week:false, threeDays:false, dayOf:true  } },
  // +2
  { id:"r11", name:"류현우", phone:"01012345670",                   branchId:"main",  branchName:"강남점", treatments:["울쎄라","써마지"],           treatmentCategory:"리프팅",  slot:"A", date:dateOffset(2),  time:"13:00", visitType:"재진", status:"확정",     utmSource:"직접",       loginMethod:"phone",  createdAt:"2026-04-18T14:20:00Z", amount:2300000, note:"패키지 할인 적용",      reminders:{ week:false, threeDays:true,  dayOf:true  } },
  { id:"r12", name:"심나연", phone:"01023456780", email:"sy@g.com",  branchId:"sinsa", branchName:"신사점", treatments:["크리스탈 글로우"],           treatmentCategory:"스킨케어",slot:"A", date:dateOffset(2),  time:"09:30", visitType:"신환", status:"대기",     utmSource:"네이버",     loginMethod:"google", createdAt:"2026-04-22T10:00:00Z", amount:350000,  note:"",                     reminders:{ week:false, threeDays:true,  dayOf:true  } },
  { id:"r21", name:"구나래", phone:"01023456792",                   branchId:"main",  branchName:"강남점", treatments:["울쎄라"],                   treatmentCategory:"리프팅",  slot:"B", date:dateOffset(2),  time:"13:00", visitType:"신환", status:"대기",     utmSource:"인스타그램", loginMethod:"phone",  createdAt:"2026-04-22T13:10:00Z", amount:1500000, note:"",                     reminders:{ week:false, threeDays:false, dayOf:true  } },
  // +3 → 3일 전 알림=오늘 발송 대상
  { id:"r13", name:"강태양", phone:"01034567801",                   branchId:"main",  branchName:"강남점", treatments:["레이저 토닝"],               treatmentCategory:"레이저",  slot:"A", date:dateOffset(3),  time:"14:30", visitType:"재진", status:"확정",     utmSource:"카카오",     loginMethod:"kakao",  createdAt:"2026-04-21T13:00:00Z", amount:200000,  note:"",                     reminders:{ week:false, threeDays:true,  dayOf:true  } },
  { id:"r14", name:"윤소희", phone:"01045678912",                   branchId:"gumi",  branchName:"구미점", treatments:["항노화 패키지","피부관리"],  treatmentCategory:"항노화",  slot:"A", date:dateOffset(3),  time:"11:00", visitType:"신환", status:"대기",     utmSource:"인스타그램", loginMethod:"phone",  createdAt:"2026-04-22T08:30:00Z", amount:2200000, note:"",                     reminders:{ week:false, threeDays:true,  dayOf:false } },
  { id:"r15", name:"임채원", phone:"01056789023",                   branchId:"main",  branchName:"강남점", treatments:["써마지 FLX"],               treatmentCategory:"리프팅",  slot:"A", date:dateOffset(4),  time:"10:00", visitType:"재진", status:"확정",     utmSource:"직접",       loginMethod:"phone",  createdAt:"2026-04-20T09:00:00Z", amount:800000,  note:"",                     reminders:{ week:false, threeDays:true,  dayOf:true  } },
  { id:"r16", name:"신유리", phone:"01067890134",                   branchId:"sinsa", branchName:"신사점", treatments:["보톡스","필러"],             treatmentCategory:"윤곽",    slot:"A", date:dateOffset(5),  time:"15:00", visitType:"신환", status:"대기",     utmSource:"카카오",     loginMethod:"kakao",  createdAt:"2026-04-22T11:20:00Z", amount:450000,  note:"",                     reminders:{ week:false, threeDays:true,  dayOf:true  } },
  { id:"r17", name:"조민수", phone:"01078901345", email:"jms@g.com", branchId:"main",  branchName:"강남점", treatments:["울쎄라"],                   treatmentCategory:"리프팅",  slot:"A", date:dateOffset(6),  time:"09:00", visitType:"신환", status:"대기",     utmSource:"네이버",     loginMethod:"google", createdAt:"2026-04-22T12:00:00Z", amount:1500000, note:"",                     reminders:{ week:true,  threeDays:true,  dayOf:true  } },
  // +7 → 1주일 전 알림=오늘 발송 대상
  { id:"r18", name:"황지수", phone:"01089012456",                   branchId:"sinsa", branchName:"신사점", treatments:["V라인 윤곽"],               treatmentCategory:"윤곽",    slot:"A", date:dateOffset(7),  time:"11:30", visitType:"재진", status:"대기",     utmSource:"인스타그램", loginMethod:"phone",  createdAt:"2026-04-12T10:00:00Z", amount:600000,  note:"",                     reminders:{ week:true,  threeDays:true,  dayOf:true  } },
  { id:"r22", name:"마준혁", phone:"01034567893",                   branchId:"sinsa", branchName:"신사점", treatments:["보디 스컬팅"],               treatmentCategory:"항노화",  slot:"A", date:dateOffset(4),  time:"14:00", visitType:"신환", status:"대기",     utmSource:"네이버",     loginMethod:"phone",  createdAt:"2026-04-22T14:00:00Z", amount:500000,  note:"",                     reminders:{ week:false, threeDays:true,  dayOf:false } },
]

const SORTED_RESERVATIONS = [...ALL_RESERVATIONS].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
)

const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const t = 9*60 + i*30
  return `${Math.floor(t/60).toString().padStart(2,"0")}:${(t%60).toString().padStart(2,"0")}`
})

// ─── KPI Bar ──────────────────────────────────────────────────────────────────

function KpiBar({ reservations }: { reservations: Reservation[] }) {
  const todayList  = reservations.filter(r => r.date === TODAY)
  const waitList   = reservations.filter(r => r.status === "대기")
  const needCheck  = reservations.filter(r => r.status === "확인필요")
  const weekTotal  = reservations.filter(r => r.date >= TODAY && r.date <= dateOffset(6)).reduce((s,r) => s+r.amount, 0)
  const todayTotal = todayList.reduce((s,r) => s+r.amount, 0)
  const kpis = [
    { label:"오늘 예약",    value:`${todayList.length}건`,               sub:`예상 ₩${(todayTotal/10000).toFixed(0)}만`, icon:CalendarCheck, color:"#c9a85c" },
    { label:"대기 중",      value:`${waitList.length}건`,                sub:"확인 필요",                                 icon:Clock4,        color:"#f59e0b" },
    { label:"확인 필요",    value:`${needCheck.length}건`,               sub:"즉시 연락",                                 icon:AlertCircle,   color:"#ef4444" },
    { label:"이번 주 예상", value:`₩${(weekTotal/10000).toFixed(0)}만`,  sub:"7일 합산",                                  icon:TrendingUp,    color:"#22c55e" },
  ]
  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {kpis.map(k => {
        const Icon = k.icon
        return (
          <div key={k.label} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background:`${k.color}18` }}>
              <Icon className="h-4 w-4" style={{ color:k.color }} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">{k.label}</div>
              <div className="text-base font-bold leading-none text-foreground">{k.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────

function StatusBadge({ status, size="sm" }: { status: ReservationStatus; size?: "sm"|"xs" }) {
  const cfg = STATUS_CFG[status]; const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1 rounded-full font-medium"
      style={{ background:cfg.bg, color:cfg.text, border:`1px solid ${cfg.border}`,
        fontSize: size==="xs"?10:11, padding: size==="xs"?"1px 6px":"2px 8px" }}>
      <Icon style={{ width:size==="xs"?9:10, height:size==="xs"?9:10 }} />{status}
    </span>
  )
}
function UTMBadge({ utm }: { utm: UTMSource }) {
  const cfg = UTM_CFG[utm]
  return <span className="inline-flex items-center rounded-full font-semibold"
    style={{ background:cfg.bg, color:cfg.color, fontSize:10, padding:"1px 7px" }}>{cfg.label}</span>
}
function Row({ icon:Icon, label, value }: { icon:React.ElementType; label:string; value:React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      <span className="text-xs text-foreground font-medium flex-1">{value}</span>
    </div>
  )
}

// ─── Notification Modal ───────────────────────────────────────────────────────

function NotificationModal({
  reservation, notifSettings, onConfirm, onCancel,
}: {
  reservation: Reservation
  notifSettings: NotifSettings
  onConfirm: () => void
  onCancel: () => void
}) {
  const r   = reservation
  const ch  = NOTIF_CHANNEL[r.loginMethod]
  const ChIcon = ch.icon

  // Get the right template
  const tpl = r.loginMethod === "kakao" ? notifSettings.kakao.template
            : r.loginMethod === "google" ? notifSettings.email.template
            : notifSettings.sms.template

  const preview = fillTemplate(tpl, r)

  const recipient = r.loginMethod === "google"
    ? (r.email || r.phone)
    : r.phone

  // Check if channel is enabled
  const chEnabled = r.loginMethod === "kakao" ? notifSettings.kakao.enabled
                  : r.loginMethod === "google" ? notifSettings.email.enabled
                  : notifSettings.sms.enabled

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel} />
      <div className="fixed z-[70] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background:"#dcfce7" }}>
              <Send className="h-4 w-4 text-green-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">예약 확정 알림 발송</h3>
              <p className="text-xs text-muted-foreground">{r.name}님의 예약을 확정하고 알림을 발송합니다</p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Channel info */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ background:ch.bg }}>
              <ChIcon className="h-4 w-4" style={{ color:ch.color }} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-foreground">{ch.label} 발송</div>
              <div className="text-xs text-muted-foreground mt-0.5">수신자: {recipient}</div>
            </div>
            {!chEnabled && (
              <span className="text-[10px] text-red-500 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 font-medium">
                미설정
              </span>
            )}
            {chEnabled && (
              <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 font-medium">
                설정됨
              </span>
            )}
          </div>

          {/* Message preview */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">메시지 미리보기</p>
            <div className="bg-muted/40 border border-border rounded-xl p-3 max-h-40 overflow-y-auto">
              <pre className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-sans">{preview}</pre>
            </div>
          </div>

          {!chEnabled && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                해당 채널이 설정되지 않았습니다. <strong>알림 설정</strong> 탭에서 API 키를 입력해주세요.
                발송 없이 예약 상태만 확정할 수도 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-border">
          <Button variant="outline" className="flex-1 h-9 text-sm" onClick={onCancel}>
            취소
          </Button>
          <Button variant="outline" className="flex-1 h-9 text-sm text-muted-foreground" onClick={onConfirm}>
            발송 없이 확정
          </Button>
          <Button
            className="flex-1 h-9 text-sm gap-1.5"
            onClick={onConfirm}
            disabled={!chEnabled}
          >
            <Send className="h-3.5 w-3.5" />
            {chEnabled ? "확인 후 발송" : "설정 후 발송"}
          </Button>
        </div>
      </div>
    </>
  )
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ reservation, onClose, onStatusChange, onRequestConfirm }: {
  reservation: Reservation | null
  onClose: () => void
  onStatusChange: (id: string, status: ReservationStatus) => void
  onRequestConfirm: (r: Reservation) => void
}) {
  if (!reservation) return null
  const r = reservation
  const ch = NOTIF_CHANNEL[r.loginMethod]
  const ChIcon = ch.icon

  function handleStatusClick(status: ReservationStatus) {
    if (status === "확정") {
      onRequestConfirm(r)
    } else {
      onStatusChange(r.id, status)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-[360px] bg-card border-l border-border shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground text-base">{r.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">{r.phone}</p>
              {/* Notification channel indicator */}
              <span className="inline-flex items-center gap-1 rounded-full text-[9px] font-semibold px-1.5 py-0"
                style={{ background:ch.bg, color:ch.color }}>
                <ChIcon style={{ width:8, height:8 }} />{ch.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={r.status} />
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="bg-muted/40 rounded-xl p-4 space-y-2.5">
            <Row icon={MapPin}     label="지점"     value={r.branchName} />
            <Row icon={Tag}        label="시술"     value={r.treatments.join(", ")} />
            <Row icon={Clock}      label="예약 일시" value={`${fmtDate(r.date)} ${r.time}`} />
            <Row icon={Star}       label="방문 구분" value={r.visitType} />
            <Row icon={CreditCard} label="예상 금액" value={`₩${r.amount.toLocaleString()}`} />
            <Row icon={Zap}        label="UTM"     value={<UTMBadge utm={r.utmSource} />} />
            <Row icon={ChIcon}     label="알림 채널" value={<span className="text-xs font-semibold" style={{ color:ch.color }}>{ch.label}</span>} />
            <Row icon={Calendar}   label="신청일"   value={fmtCreated(r.createdAt)} />
          </div>

          {/* Status change */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">상태 변경</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(STATUS_CFG) as ReservationStatus[]).map(s => {
                const cfg = STATUS_CFG[s]; const active = r.status === s
                return (
                  <button key={s} onClick={() => handleStatusClick(s)}
                    className="relative rounded-lg py-1.5 px-2 text-[11px] font-medium border transition-all"
                    style={{
                      background: active ? cfg.bg : "transparent",
                      color: active ? cfg.text : "#6b7280",
                      borderColor: active ? cfg.border : "#e5e7eb",
                      fontWeight: active ? 700 : 400,
                    }}>
                    {s}
                    {s === "확정" && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 flex items-center justify-center rounded-full bg-green-500">
                        <Send style={{ width:6, height:6, color:"white" }} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Send className="h-3 w-3 text-green-600" />
              <span className="text-green-700 font-medium">확정</span> 선택 시 알림 발송 확인 팝업이 표시됩니다
            </p>
          </div>

          {/* Reminder preferences (customer opted in) */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              리마인더 수신 동의
            </p>
            <div className="rounded-xl border border-border overflow-hidden">
              {REMINDER_ITEMS.map((item, i) => {
                const checked = r.reminders[item.key]
                // Calculate when this reminder would send
                const sendDate = reminderSendDate(r.date, item.daysBefore)
                const isPast   = sendDate < TODAY
                const isToday  = sendDate === TODAY
                return (
                  <div key={item.key}
                    className={cn("flex items-center justify-between px-3 py-2 gap-2",
                      i < REMINDER_ITEMS.length - 1 && "border-b border-border/60",
                      checked ? "bg-background" : "bg-muted/20"
                    )}>
                    <div className="flex items-center gap-2.5">
                      {/* Checkbox indicator */}
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                        checked ? "bg-primary border-primary" : "border-muted-foreground/30 bg-background"
                      )}>
                        {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      <div>
                        <div className={cn("text-xs font-medium", checked ? "text-foreground" : "text-muted-foreground line-through")}>
                          {item.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                      </div>
                    </div>
                    {/* Send status badge */}
                    {checked && (
                      <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0",
                        isPast  ? "text-muted-foreground bg-muted border-border"
                        : isToday ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-blue-700 bg-blue-50 border-blue-200"
                      )}>
                        {isPast ? "발송완료" : isToday ? "오늘 발송" : sendDate.slice(5).replace("-",".")}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">메모</p>
            <textarea defaultValue={r.note} placeholder="내부 메모를 입력하세요..." rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={onClose}>닫기</Button>
          <Button size="sm" className="flex-1 text-xs h-8">저장</Button>
        </div>
      </div>
    </>
  )
}

// ─── Tab 1: Booking List ──────────────────────────────────────────────────────

function BookingListTab({ reservations, onSelect }: { reservations: Reservation[]; onSelect: (r: Reservation) => void }) {
  const [search, setSearch]       = useState("")
  const [branchFilter, setBranch] = useState("전체 지점")
  const [statusFilter, setStatus] = useState("전체")
  const [dateFrom, setDateFrom]   = useState("")
  const [dateTo, setDateTo]       = useState("")
  const BRANCHES = ["전체 지점","강남점","신사점","구미점"]
  const STATUSES = ["전체", ...Object.keys(STATUS_CFG) as ReservationStatus[]]
  const filtered = useMemo(() => reservations.filter(r => {
    const q = search.toLowerCase()
    return (!q || r.name.includes(q) || r.phone.includes(q) || r.branchName.includes(q)) &&
      (branchFilter==="전체 지점" || r.branchName===branchFilter) &&
      (statusFilter==="전체"      || r.status===statusFilter) &&
      (!dateFrom || r.date>=dateFrom) && (!dateTo || r.date<=dateTo)
  }), [reservations, search, branchFilter, statusFilter, dateFrom, dateTo])

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="이름, 전화번호, 지점 검색..." className="h-9 pl-9 text-sm" />
        </div>
        <select value={branchFilter} onChange={e=>setBranch(e.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none">{BRANCHES.map(o=><option key={o}>{o}</option>)}</select>
        <select value={statusFilter} onChange={e=>setStatus(e.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none">{STATUSES.map(o=><option key={o}>{o}</option>)}</select>
        <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none" />
        <span className="text-muted-foreground text-sm">~</span>
        <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none" />
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs ml-auto"><Download className="h-3.5 w-3.5" />CSV 내보내기</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">{["이름","연락처","지점","시술","날짜/시간","구분","UTM","알림채널","상태","신청일"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length===0?(<tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">검색 결과가 없습니다</td></tr>)
            :filtered.map((r,i)=>{
              const ch = NOTIF_CHANNEL[r.loginMethod]; const ChIcon=ch.icon
              return(
              <tr key={r.id} onClick={()=>onSelect(r)} className={cn("border-b border-border/60 cursor-pointer transition-colors hover:bg-muted/40", i%2===0?"bg-background":"bg-muted/10")}>
                <td className="px-4 py-3 font-semibold text-foreground">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{r.phone}</td>
                <td className="px-4 py-3 text-foreground text-xs">{r.branchName}</td>
                <td className="px-4 py-3 text-foreground text-xs max-w-[140px]"><span className="truncate block">{r.treatments.join(", ")}</span></td>
                <td className="px-4 py-3 text-foreground text-xs whitespace-nowrap">{fmtDate(r.date)} {r.time}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{r.visitType}</span></td>
                <td className="px-4 py-3"><UTMBadge utm={r.utmSource} /></td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full text-[10px] font-semibold px-2 py-0.5" style={{ background:ch.bg, color:ch.color }}>
                    <ChIcon style={{ width:9, height:9 }} />{ch.label}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} size="xs" /></td>
                <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{fmtCreated(r.createdAt)}</td>
              </tr>
            )})}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-border bg-muted/20"><span className="text-xs text-muted-foreground">총 {filtered.length}건</span></div>
      </div>
    </div>
  )
}

// ─── Panel 1: Inbox ───────────────────────────────────────────────────────────

function InboxPanel({ reservations, selectedId, onSelect }: {
  reservations: Reservation[]; selectedId: string|null; onSelect: (r:Reservation)=>void
}) {
  const inboxList = useMemo(()=>[...reservations].filter(r=>r.date>=dateOffset(-2)).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()),[reservations])
  const isNew = (r:Reservation) => r.createdAt >= `${TODAY}T00:00:00Z`
  return (
    <div className="flex flex-col bg-card border border-border rounded-xl overflow-hidden shrink-0" style={{ width:264 }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20 shrink-0">
        <Inbox className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">인박스</span>
        <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 leading-4">{inboxList.filter(isNew).length} New</span>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {inboxList.map(r=>{
          const utmCfg=UTM_CFG[r.utmSource]; const ch=NOTIF_CHANNEL[r.loginMethod]; const ChIcon=ch.icon
          const _isNew=isNew(r); const isSelected=selectedId===r.id
          return(
            <div key={r.id} onClick={()=>onSelect(r)}
              className={cn("px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50",isSelected&&"bg-primary/5 border-l-2 border-l-primary",_isNew&&!isSelected&&"bg-amber-50/50")}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {_isNew&&<span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-300 rounded-full px-1.5 py-0 leading-4 shrink-0">NEW</span>}
                  <span className="text-sm font-semibold text-foreground truncate">{r.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">({r.visitType})</span>
                </div>
                <span className="text-[9px] font-bold rounded-full px-1.5 shrink-0" style={{ background:utmCfg.bg, color:utmCfg.color }}>{utmCfg.label}</span>
              </div>
              <div className="text-xs text-muted-foreground truncate mb-1.5">{r.treatments.join(", ")}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" />{fmtDate(r.date)} {r.time}</div>
                <StatusBadge status={r.status} size="xs" />
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="inline-flex items-center gap-0.5 text-[9px] rounded-full px-1.5 font-medium" style={{ background:ch.bg, color:ch.color }}>
                  <ChIcon style={{ width:7, height:7 }} />{ch.label}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">₩{r.amount.toLocaleString()}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Heatmap Calendar ────────────────────────────────────────────────────────

function HeatmapCalendar({ reservations, selectedDate, onSelect }: {
  reservations:Reservation[]; selectedDate:string; onSelect:(d:string)=>void
}) {
  const [viewYear, setViewYear]   = useState(2026)
  const [viewMonth, setViewMonth] = useState(3)
  const countByDate = useMemo(()=>{ const m:Record<string,number>={}; reservations.forEach(r=>{m[r.date]=(m[r.date]||0)+1}); return m },[reservations])
  const firstDay=new Date(viewYear,viewMonth,1).getDay()
  const totalDays=new Date(viewYear,viewMonth+1,0).getDate()
  const cells:(number|null)[]=[...Array(firstDay).fill(null),...Array.from({length:totalDays},(_,i)=>i+1)]
  const maxCount=Math.max(1,...Object.values(countByDate))
  function heatBg(c:number){if(!c)return undefined;const t=c/maxCount;if(t>.75)return"#c9a85c";if(t>.5)return"#d4b87a";if(t>.25)return"#e2cfa0";return"#eddfa8"}
  function prev(){viewMonth===0?(setViewYear(y=>y-1),setViewMonth(11)):setViewMonth(m=>m-1)}
  function next(){viewMonth===11?(setViewYear(y=>y+1),setViewMonth(0)):setViewMonth(m=>m+1)}
  return (
    <div className="bg-muted/30 border-b border-border px-4 py-3 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{viewYear}.{String(viewMonth+1).padStart(2,"0")}</span>
          <span className="text-[10px] text-muted-foreground">예약 히트맵</span>
        </div>
        <div className="flex gap-0.5">
          <button onClick={prev} className="rounded p-1 hover:bg-muted"><ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" /></button>
          <button onClick={next} className="rounded p-1 hover:bg-muted"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">{["일","월","화","수","목","금","토"].map(d=><div key={d} className="text-center text-[10px] text-muted-foreground">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day,idx)=>{
          if(day===null)return<div key={idx}/>
          const dateStr=`${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
          const count=countByDate[dateStr]||0
          const isSelected=selectedDate===dateStr; const isToday=dateStr===TODAY
          return(
            <button key={idx} onClick={()=>onSelect(dateStr)}
              className="flex flex-col items-center justify-center rounded transition-all"
              style={{ minHeight:36, background:isSelected?"#c9a85c":(heatBg(count)??"transparent"), outline:isToday?"2px solid #c9a85c":"none", outlineOffset:1 }}>
              <span className="text-[10px] leading-tight font-medium" style={{ color:isSelected?"#fff":count>0?"#5a3a00":"#9ca3af" }}>{day}</span>
              {count>0?(
                <span className="text-[11px] font-bold leading-tight" style={{ color:isSelected?"rgba(255,255,255,0.9)":"#7c4e00" }}>{count}명</span>
              ):(
                <span className="text-[10px] leading-tight opacity-0">0</span>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-[9px] text-muted-foreground">적음</span>
        {["#eddfa8","#e2cfa0","#d4b87a","#c9a85c"].map(c=><div key={c} className="w-5 h-3 rounded-sm" style={{ background:c }}/>)}
        <span className="text-[9px] text-muted-foreground">많음</span>
      </div>
    </div>
  )
}

// ─── Timeline Panel ───────────────────────────────────────────────────────────

type MovedInfo = { r: Reservation; newSlot: string; newTime: string }

function TimelinePanel({ reservations, timelineDate, onDateChange, onSelect, highlightId, onMoveReservation, onSendMoveNotification }: {
  reservations: Reservation[]; timelineDate: string; onDateChange: (d:string)=>void
  onSelect: (r:Reservation)=>void; highlightId: string|null
  onMoveReservation: (id:string, newSlot:string, newTime:string)=>void
  onSendMoveNotification: (r:Reservation, newSlot:string, newTime:string)=>void
}) {
  const [slots, setSlots]           = useState<BookingSlot[]>(DEFAULT_SLOTS)
  const [draggingId, setDraggingId] = useState<string|null>(null)
  const [dropTarget, setDropTarget] = useState<{slotId:string;time:string}|null>(null)
  const [movedInfo, setMovedInfo]   = useState<MovedInfo|null>(null)
  const [sentNotif, setSentNotif]   = useState<string|null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null)

  const dayRes = useMemo(()=>reservations.filter(r=>r.date===timelineDate),[reservations,timelineDate])
  const enabledSlots = slots.filter(s=>s.enabled)

  function addSlot() {
    const nextChar=SLOT_LABELS[slots.length]??`#${slots.length+1}`
    setSlots(prev=>[...prev,{id:nextChar,label:`예약${nextChar}`,enabled:true}])
  }
  function toggleSlot(id:string) { setSlots(prev=>prev.map(s=>s.id===id?{...s,enabled:!s.enabled}:s)) }

  function deleteSlot(id:string) {
    const hasBookings = dayRes.some(r => r.slot === id)
    if (hasBookings) {
      setDeleteConfirm(id) // show confirmation
    } else {
      setSlots(prev=>prev.filter(s=>s.id!==id))
    }
  }
  function confirmDeleteSlot(id:string) {
    setSlots(prev=>prev.filter(s=>s.id!==id))
    setDeleteConfirm(null)
  }

  function getSlotBooking(slotId:string,time:string){return dayRes.find(r=>r.time===time&&r.slot===slotId)??null}
  function isTimeFull(time:string){return enabledSlots.length>0&&enabledSlots.every(s=>!!getSlotBooking(s.id,time))}
  function getTimeCount(time:string){return dayRes.filter(r=>r.time===time).length}

  function handleDrop(slotId:string,time:string){
    if(!draggingId)return
    const r=reservations.find(x=>x.id===draggingId)
    if(r&&(r.slot!==slotId||r.time!==time)){
      onMoveReservation(draggingId,slotId,time)
      // Store moved info for notification toast (include updated slot/time for template)
      setMovedInfo({ r:{ ...r, slot:slotId, time }, newSlot:slotId, newTime:time })
      setSentNotif(null)
    }
    setDraggingId(null); setDropTarget(null)
  }

  function handleSendNotif() {
    if(!movedInfo) return
    onSendMoveNotification(movedInfo.r, movedInfo.newSlot, movedInfo.newTime)
    const ch = NOTIF_CHANNEL[movedInfo.r.loginMethod]
    setSentNotif(`${movedInfo.r.name}님에게 ${ch.label}로 변경 알림이 발송되었습니다.`)
    setMovedInfo(null)
    setTimeout(()=>setSentNotif(null), 4000)
  }

  return (
    <div className="flex flex-col bg-card border border-border rounded-xl overflow-hidden flex-1 min-w-0">

      {/* Delete confirmation mini-modal */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 rounded-xl">
          <div className="bg-card border border-border rounded-xl p-4 shadow-lg max-w-[280px]">
            <p className="text-sm font-semibold text-foreground mb-1">예약{deleteConfirm} 열 삭제</p>
            <p className="text-xs text-muted-foreground mb-3">해당 슬롯에 예약이 있습니다. 삭제하면 예약 데이터가 슬롯 없이 유지됩니다. 계속할까요?</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={()=>setDeleteConfirm(null)}>취소</Button>
              <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={()=>confirmDeleteSlot(deleteConfirm)}>삭제</Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20 shrink-0 flex-wrap gap-y-2">
        <div className="flex items-center gap-2">
          <Clock4 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">타임라인</span>
        </div>
        <input type="date" value={timelineDate} onChange={e=>onDateChange(e.target.value)}
          className="h-7 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none" />

        {/* Slot management */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground mr-0.5">슬롯:</span>
          {slots.map(slot=>(
            <div key={slot.id} className="flex items-center gap-0.5">
              <button onClick={()=>toggleSlot(slot.id)} title={slot.enabled?"클릭하여 비활성화":"클릭하여 활성화"}
                className={cn("flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-l-lg text-xs font-semibold border transition-all",
                  slot.enabled?"bg-primary/10 text-primary border-primary/40 hover:bg-primary/20"
                             :"bg-muted text-muted-foreground border-border line-through opacity-60 hover:opacity-80")}>
                {slot.enabled?<Unlock className="h-2.5 w-2.5"/>:<Lock className="h-2.5 w-2.5"/>}
                {slot.label}
              </button>
              <button onClick={()=>deleteSlot(slot.id)} title="열 삭제"
                className={cn("flex items-center justify-center px-1 py-1 rounded-r-lg border border-l-0 text-muted-foreground transition-all hover:bg-red-50 hover:text-red-500 hover:border-red-200",
                  slot.enabled?"border-primary/40 bg-primary/5":"border-border bg-muted opacity-60")}>
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          <button onClick={addSlot}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-all">
            <Plus className="h-2.5 w-2.5" />열 추가
          </button>
        </div>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {(Object.entries(STATUS_CFG) as [ReservationStatus,typeof STATUS_CFG[ReservationStatus]][]).map(([k,v])=>(
            <span key={k} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ background:v.dot }}/>{k}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Grip className="h-3 w-3"/>드래그 이동</span>
      </div>

      {/* Move notification toast — rich card with send button */}
      {movedInfo && (() => {
        const ch = NOTIF_CHANNEL[movedInfo.r.loginMethod]
        const ChIcon = ch.icon
        return (
          <div className="mx-3 mt-2 shrink-0">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border shadow-md">
              {/* Channel icon */}
              <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                style={{ background: ch.bg }}>
                <ChIcon className="h-4 w-4" style={{ color: ch.color }} />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {movedInfo.r.name}님 &rarr; 예약{movedInfo.newSlot} {movedInfo.newTime} 이동 완료
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {ch.label}로 변경 알림을 발송하시겠습니까?
                </p>
              </div>
              {/* Send button */}
              <Button size="sm" className="h-7 text-xs gap-1.5 shrink-0 bg-primary hover:bg-primary/90"
                onClick={handleSendNotif}>
                <Send className="h-3 w-3" />
                알림 발송
              </Button>
              {/* Dismiss */}
              <button onClick={()=>setMovedInfo(null)}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )
      })()}

      {/* Sent confirmation toast */}
      {sentNotif && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2 shrink-0">
          <CheckCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />{sentNotif}
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto relative">
        <HeatmapCalendar reservations={reservations} selectedDate={timelineDate} onSelect={onDateChange} />

        <div className="min-w-max">
          {/* Column headers */}
          <div className="flex border-b border-border sticky top-0 bg-card z-10">
            <div className="shrink-0 px-3 py-2.5 border-r border-border text-xs text-muted-foreground font-medium" style={{width:88}}>시간</div>
            {slots.map(slot=>(
              <div key={slot.id} className={cn("flex-1 min-w-[148px] px-3 py-2.5 border-r border-border text-center",!slot.enabled&&"bg-muted/40")}>
                <div className={cn("text-xs font-bold",slot.enabled?"text-foreground":"text-muted-foreground line-through")}>{slot.label}</div>
                <div className="text-[9px] mt-0.5" style={{ color:slot.enabled?"#c9a85c":"#9ca3af" }}>
                  {slot.enabled?`${dayRes.filter(r=>r.slot===slot.id).length}명 예약됨`:"비활성"}
                </div>
              </div>
            ))}
          </div>

          {/* Time rows */}
          {TIME_SLOTS.map((time,ti)=>{
            const full=isTimeFull(time); const count=getTimeCount(time)
            return(
              <div key={time} className={cn("flex border-b border-border/40",ti%2===0?"bg-background":"bg-muted/10",full&&"bg-red-50/40")}>
                <div className="shrink-0 px-2 py-2 border-r border-border flex flex-col items-center justify-center gap-0.5" style={{width:88}}>
                  <span className="text-[11px] font-semibold text-foreground">{time}</span>
                  {count>0&&<span className="text-[9px] text-muted-foreground">({count}명)</span>}
                  {full&&<span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-200 rounded-full px-1.5 leading-4">마감</span>}
                </div>
                {slots.map(slot=>{
                  const booking=getSlotBooking(slot.id,time)
                  const isDisabled=!slot.enabled
                  const isDropTgt=dropTarget?.slotId===slot.id&&dropTarget?.time===time
                  const isDragging=draggingId===booking?.id
                  const canDrop=!isDisabled&&!booking&&draggingId!==null

                  return(
                    <div key={slot.id}
                      className={cn("flex-1 min-w-[148px] px-2 py-1.5 border-r border-border/60 min-h-[56px] flex flex-col gap-1 transition-colors",
                        isDisabled&&"bg-[repeating-linear-gradient(45deg,#f8f8f8,#f8f8f8_5px,#f1f1f1_5px,#f1f1f1_10px)]",
                        isDropTgt&&"bg-primary/8 outline outline-2 outline-primary/40 outline-offset-[-2px] rounded")}
                      onDragOver={e=>{if(canDrop){e.preventDefault();setDropTarget({slotId:slot.id,time})}}}
                      onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setDropTarget(null)}}
                      onDrop={()=>{if(canDrop)handleDrop(slot.id,time)}}
                    >
                      {booking&&(
                        <div
                          draggable
                          onDragStart={e=>{e.dataTransfer.effectAllowed="move";setDraggingId(booking.id)}}
                          onDragEnd={()=>{setDraggingId(null);setDropTarget(null)}}
                          onClick={()=>onSelect(booking)}
                          className={cn("rounded-lg px-2 py-1.5 cursor-grab active:cursor-grabbing border transition-all select-none",
                            highlightId===booking.id&&"ring-2 ring-primary ring-offset-1 scale-[1.02]",
                            isDragging&&"opacity-30")}
                          style={{ background:STATUS_CFG[booking.status].bg, borderColor:STATUS_CFG[booking.status].border }}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <Grip className="h-2.5 w-2.5 shrink-0 opacity-40" style={{ color:STATUS_CFG[booking.status].text }}/>
                            <span className="text-[11px] font-bold truncate flex-1" style={{ color:STATUS_CFG[booking.status].text }}>{booking.name}</span>
                            <span className="text-[8px] font-bold rounded-full px-1 shrink-0" style={{ background:UTM_CFG[booking.utmSource].bg, color:UTM_CFG[booking.utmSource].color }}>{UTM_CFG[booking.utmSource].label}</span>
                          </div>
                          <div className="text-[10px] truncate" style={{ color:STATUS_CFG[booking.status].text, opacity:.8 }}>{booking.treatments[0]}</div>
                          <div className="text-[9px] mt-0.5 flex items-center gap-1.5" style={{ color:STATUS_CFG[booking.status].text, opacity:.65 }}>
                            <span>{booking.visitType}</span><span>·</span><span>₩{(booking.amount/10000).toFixed(0)}만</span>
                          </div>
                        </div>
                      )}
                      {!booking&&!isDisabled&&isDropTgt&&(
                        <div className="flex-1 rounded-lg border-2 border-dashed border-primary/60 flex items-center justify-center min-h-[40px]">
                          <span className="text-[10px] text-primary font-medium">여기에 놓기</span>
                        </div>
                      )}
                      {isDisabled&&!booking&&(
                        <div className="flex-1 flex items-center justify-center min-h-[40px]">
                          <span className="text-[9px] text-muted-foreground/50">비활성</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: Schedule ─────────────────────────────────────────────────────────

function ScheduleTab({ reservations, onOpenDrawer, onMoveReservation, onSendMoveNotification }: {
  reservations: Reservation[]; onOpenDrawer: (r:Reservation)=>void
  onMoveReservation: (id:string,slot:string,time:string)=>void
  onSendMoveNotification: (r:Reservation,slot:string,time:string)=>void
}) {
  const [selectedInboxId, setSelectedInboxId] = useState<string|null>(null)
  const [timelineDate, setTimelineDate]       = useState(TODAY)
  const [highlightId, setHighlightId]         = useState<string|null>(null)

  function handleInboxSelect(r:Reservation) {
    setSelectedInboxId(r.id); setTimelineDate(r.date)
    setHighlightId(r.id); setTimeout(()=>setHighlightId(null),2500); onOpenDrawer(r)
  }
  function handleTimelineSelect(r:Reservation) { setSelectedInboxId(r.id); onOpenDrawer(r) }

  return (
    <div className="flex gap-3 h-[calc(100vh-300px)] min-h-[580px]">
      <InboxPanel reservations={reservations} selectedId={selectedInboxId} onSelect={handleInboxSelect} />
      <TimelinePanel reservations={reservations} timelineDate={timelineDate} onDateChange={setTimelineDate}
        onSelect={handleTimelineSelect} highlightId={highlightId} onMoveReservation={onMoveReservation}
        onSendMoveNotification={onSendMoveNotification} />
    </div>
  )
}

// ─── Tab 3: Notification Settings ────────────────────────────────────────────

function SettingsField({ label, hint, children }: { label:string; hint?:string; children:React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
      {hint&&<p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function SecretInput({ value, onChange, placeholder }: { value:string; onChange:(v:string)=>void; placeholder?:string }) {
  const [show,setShow]=useState(false)
  return (
    <div className="relative">
      <Input type={show?"text":"password"} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="h-8 text-xs pr-8 font-mono" />
      <button type="button" onClick={()=>setShow(s=>!s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show?<EyeOff className="h-3.5 w-3.5"/>:<Eye className="h-3.5 w-3.5"/>}
      </button>
    </div>
  )
}

function NotifSection({ title, icon:Icon, color, bg, enabled, onToggle, children }: {
  title:string; icon:React.ElementType; color:string; bg:string
  enabled:boolean; onToggle:()=>void; children:React.ReactNode
}) {
  const [open,setOpen]=useState(true)
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/20 cursor-pointer" onClick={()=>setOpen(o=>!o)}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ background:bg }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="text-sm font-semibold text-foreground flex-1">{title}</span>
        <div className="flex items-center gap-2" onClick={e=>e.stopPropagation()}>
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border",
            enabled?"text-green-700 bg-green-50 border-green-200":"text-muted-foreground bg-muted border-border")}>
            {enabled?"활성":"비활성"}
          </span>
          <button onClick={onToggle}
            className={cn("w-10 h-5 rounded-full transition-colors relative shrink-0",enabled?"bg-primary":"bg-muted border border-border")}>
            <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",enabled?"left-5":"left-0.5")}/>
          </button>
        </div>
        {open?<ChevronUp className="h-4 w-4 text-muted-foreground"/>:<ChevronDown className="h-4 w-4 text-muted-foreground"/>}
      </div>
      {open&&<div className="px-4 py-4 space-y-3 bg-background">{children}</div>}
    </div>
  )
}

function NotificationSettingsTab({ settings, onUpdate, reservations }: {
  settings: NotifSettings; onUpdate: (s:NotifSettings)=>void
  reservations: Reservation[]
}) {
  const [localSettings, setLocal] = useState<NotifSettings>(settings)
  const [saved, setSaved]         = useState(false)

  function update(path:string, value:string|boolean) {
    setLocal(prev=>{
      const next=JSON.parse(JSON.stringify(prev)) as NotifSettings
      const parts=path.split(".")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cur:any=next
      for(let i=0;i<parts.length-1;i++) cur=cur[parts[i]]
      cur[parts[parts.length-1]]=value
      return next
    })
  }

  function handleSave() {
    onUpdate(localSettings)
    setSaved(true)
    setTimeout(()=>setSaved(false),2500)
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-bold text-foreground">알림 발송 설정</h2>
          <p className="text-xs text-muted-foreground mt-0.5">예약 확정 시 고객에게 발송될 채널과 메시지를 설정합니다</p>
        </div>
        <div className="flex items-center gap-2">
          {saved&&<span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 flex items-center gap-1">
            <CheckCheck className="h-3 w-3"/>저장 완료
          </span>}
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave}>
            <CheckCheck className="h-3.5 w-3.5"/>설정 저장
          </Button>
        </div>
      </div>

      {/* Channel activation overview */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-xl border border-border">
        {([
          { key:"kakao", label:"카카오 알림톡", icon:MessageCircle, color:"#5a4a00", bg:"#fee500", enabled:localSettings.kakao.enabled },
          { key:"email", label:"이메일",        icon:Mail,          color:"#1a56db", bg:"#dbeafe", enabled:localSettings.email.enabled },
          { key:"sms",   label:"SMS",           icon:Smartphone,    color:"#374151", bg:"#f3f4f6", enabled:localSettings.sms.enabled   },
        ]).map(ch=>{
          const Icon=ch.icon
          return(
            <div key={ch.key} className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ background:ch.bg }}>
                <Icon className="h-4 w-4" style={{ color:ch.color }}/>
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">{ch.label}</div>
                <div className={cn("text-[10px] font-medium",ch.enabled?"text-green-600":"text-muted-foreground")}>
                  {ch.enabled?"● 활성화":"○ 비활성"}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 템플릿 변수 참고 */}
      <div className="p-3 rounded-lg border border-border bg-muted/20">
        <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">템플릿 변수 (메시지에 삽입됨)</p>
        <div className="flex flex-wrap gap-1.5">
          {["{name}","{branchName}","{date}","{time}","{treatments}","{amount}","{phone}"].map(v=>(
            <code key={v} className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 text-foreground font-mono">{v}</code>
          ))}
        </div>
      </div>

      {/* Kakao */}
      <NotifSection title="카카오 알림톡" icon={MessageCircle} color="#5a4a00" bg="#fee500"
        enabled={localSettings.kakao.enabled} onToggle={()=>update("kakao.enabled",!localSettings.kakao.enabled)}>
        <div className="grid grid-cols-2 gap-3">
          <SettingsField label="채널 ID" hint="카카오 비즈니스 채널 ID (예: @tatoa_main)">
            <Input value={localSettings.kakao.channelId} onChange={e=>update("kakao.channelId",e.target.value)} placeholder="@your_channel" className="h-8 text-xs" />
          </SettingsField>
          <SettingsField label="Sender Key" hint="카카오 알림톡 API 발신키">
            <SecretInput value={localSettings.kakao.senderKey} onChange={v=>update("kakao.senderKey",v)} placeholder="발신키 입력" />
          </SettingsField>
          <SettingsField label="API Key" hint="REST API 인증 키">
            <SecretInput value={localSettings.kakao.apiKey} onChange={v=>update("kakao.apiKey",v)} placeholder="API 키 입력" />
          </SettingsField>
        </div>
        <SettingsField label="메시지 템플릿">
          <textarea value={localSettings.kakao.template} onChange={e=>update("kakao.template",e.target.value)} rows={6}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono leading-relaxed" />
        </SettingsField>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
          <TestTube className="h-3 w-3"/>테스트 발송
        </Button>
      </NotifSection>

      {/* Email */}
      <NotifSection title="이메일 (Google 로그인 고객)" icon={Mail} color="#1a56db" bg="#dbeafe"
        enabled={localSettings.email.enabled} onToggle={()=>update("email.enabled",!localSettings.email.enabled)}>
        <div className="grid grid-cols-2 gap-3">
          <SettingsField label="발신 이메일">
            <Input value={localSettings.email.senderEmail} onChange={e=>update("email.senderEmail",e.target.value)} placeholder="noreply@clinic.com" className="h-8 text-xs" />
          </SettingsField>
          <SettingsField label="발신자명">
            <Input value={localSettings.email.senderName} onChange={e=>update("email.senderName",e.target.value)} placeholder="TATOA 피부과" className="h-8 text-xs" />
          </SettingsField>
          <SettingsField label="SMTP 호스트">
            <Input value={localSettings.email.smtpHost} onChange={e=>update("email.smtpHost",e.target.value)} placeholder="smtp.gmail.com" className="h-8 text-xs" />
          </SettingsField>
          <SettingsField label="SMTP 포트">
            <Input value={localSettings.email.smtpPort} onChange={e=>update("email.smtpPort",e.target.value)} placeholder="587" className="h-8 text-xs" />
          </SettingsField>
        </div>
        <SettingsField label="이메일 템플릿">
          <textarea value={localSettings.email.template} onChange={e=>update("email.template",e.target.value)} rows={6}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono leading-relaxed" />
        </SettingsField>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
          <TestTube className="h-3 w-3"/>테스트 발송
        </Button>
      </NotifSection>

      {/* SMS */}
      <NotifSection title="SMS (일반 고객)" icon={Smartphone} color="#374151" bg="#f3f4f6"
        enabled={localSettings.sms.enabled} onToggle={()=>update("sms.enabled",!localSettings.sms.enabled)}>
        <div className="grid grid-cols-2 gap-3">
          <SettingsField label="발신 번호" hint="010, 02 등 등록된 번호">
            <Input value={localSettings.sms.senderPhone} onChange={e=>update("sms.senderPhone",e.target.value)} placeholder="0212345678" className="h-8 text-xs" />
          </SettingsField>
          <SettingsField label="SMS 제공업체">
            <select value={localSettings.sms.provider} onChange={e=>update("sms.provider",e.target.value)}
              className="w-full h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none">
              {["CoolSMS","NCP (Naver Cloud)","KT","SKT","기타"].map(p=><option key={p}>{p}</option>)}
            </select>
          </SettingsField>
          <SettingsField label="API Key">
            <SecretInput value={localSettings.sms.apiKey} onChange={v=>update("sms.apiKey",v)} placeholder="API 키 입력" />
          </SettingsField>
          <SettingsField label="API Secret">
            <SecretInput value={localSettings.sms.apiSecret} onChange={v=>update("sms.apiSecret",v)} placeholder="Secret 입력" />
          </SettingsField>
        </div>
        <SettingsField label="SMS 템플릿" hint="SMS는 90byte(한글 45자) 이내 권장">
          <textarea value={localSettings.sms.template} onChange={e=>update("sms.template",e.target.value)} rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono leading-relaxed" />
          <p className="text-[10px] text-muted-foreground text-right">{localSettings.sms.template.length}자</p>
        </SettingsField>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
          <TestTube className="h-3 w-3"/>테스트 발송
        </Button>
      </NotifSection>

      {/* ── 리마인더 자동 발송 ─────────────────────────────────────────── */}
      <NotifSection title="리마인더 자동 발송" icon={AlarmClock} color="#0e7490" bg="#cffafe"
        enabled={localSettings.reminderSchedule.enabled}
        onToggle={()=>update("reminderSchedule.enabled",!localSettings.reminderSchedule.enabled)}>

        <p className="text-xs text-muted-foreground">
          고객이 예약 시 선택한 리마인더 항목에 따라 자동으로 알림을 발송합니다.
          채널은 각 고객의 로그인 방법(카카오·이메일·SMS)으로 자동 결정됩니다.
        </p>

        {/* Channel override */}
        <SettingsField label="발송 채널" hint="'자동'은 고객 로그인 방법 기준으로 채널 선택">
          <select value={localSettings.reminderSchedule.channel}
            onChange={e=>update("reminderSchedule.channel",e.target.value)}
            className="w-full h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none">
            <option value="auto">자동 (고객 로그인 기준)</option>
            <option value="kakao">카카오 알림톡 (전체 강제)</option>
            <option value="email">이메일 (전체 강제)</option>
            <option value="sms">SMS (전체 강제)</option>
          </select>
        </SettingsField>

        {/* Per-reminder type settings */}
        <div className="space-y-2">
          {REMINDER_ITEMS.map(item => {
            const sched = localSettings.reminderSchedule[item.key]
            return (
              <div key={item.key} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 bg-cyan-50 border border-cyan-200">
                  <Bell className="h-4 w-4 text-cyan-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                </div>
                {/* Send time input */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground shrink-0">발송 시각</span>
                  <input type="time" value={sched.sendAt}
                    onChange={e=>update(`reminderSchedule.${item.key}.sendAt`,e.target.value)}
                    className="h-7 w-[76px] rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none" />
                </div>
                {/* Toggle */}
                <button onClick={()=>update(`reminderSchedule.${item.key}.enabled`,!sched.enabled)}
                  className={cn("w-10 h-5 rounded-full transition-colors relative shrink-0",
                    sched.enabled?"bg-cyan-600":"bg-muted border border-border")}>
                  <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
                    sched.enabled?"left-5":"left-0.5")}/>
                </button>
              </div>
            )
          })}
        </div>

        {/* ── 발송 예정 미리보기 ────────────────────────── */}
        {(() => {
          const upcoming = getUpcomingReminders(reservations, localSettings)
          return (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border">
                <CalendarCheck className="h-3.5 w-3.5 text-cyan-700" />
                <span className="text-xs font-semibold text-foreground">발송 예정 (오늘 ~ 7일 이내)</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{upcoming.length}건</span>
              </div>
              {upcoming.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  발송 예정인 리마인더가 없습니다
                </div>
              ) : (
                <div className="divide-y divide-border/60 max-h-64 overflow-y-auto">
                  {upcoming.map((u, i) => {
                    const ch = NOTIF_CHANNEL[
                      localSettings.reminderSchedule.channel === "auto"
                        ? u.reservation.loginMethod
                        : localSettings.reminderSchedule.channel as LoginMethod
                    ]
                    const ChIcon = ch.icon
                    const isToday = u.sendDate === TODAY
                    return (
                      <div key={`${u.reservation.id}-${u.key}`}
                        className={cn("flex items-center gap-3 px-4 py-2.5",
                          isToday && "bg-amber-50/60")}>
                        {/* Date badge */}
                        <div className={cn("text-center shrink-0 w-10",)}>
                          <div className={cn("text-[9px] font-bold rounded px-1 py-0.5",
                            isToday ? "text-amber-700 bg-amber-100" : "text-muted-foreground bg-muted")}>
                            {isToday ? "오늘" : u.sendDate.slice(5).replace("-","/")}
                          </div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">{u.sendAt}</div>
                        </div>
                        {/* Customer */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">{u.reservation.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {u.label} · 예약 {u.reservation.date.slice(5).replace("-","/")} {u.reservation.time}
                          </div>
                        </div>
                        {/* Channel badge */}
                        <span className="inline-flex items-center gap-1 rounded-full text-[9px] font-semibold px-1.5 py-0.5 shrink-0"
                          style={{ background:ch.bg, color:ch.color }}>
                          <ChIcon style={{ width:8, height:8 }}/>{ch.label}
                        </span>
                        {/* Status */}
                        {isToday && (
                          <span className="text-[9px] font-bold text-amber-600 shrink-0 flex items-center gap-0.5">
                            <AlarmClock style={{ width:9, height:9 }}/>발송 예정
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}
      </NotifSection>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const [activeTab, setActiveTab]       = useState<"list"|"schedule"|"settings">("list")
  const [reservations, setReservations] = useState<Reservation[]>(SORTED_RESERVATIONS)
  const [drawerRes, setDrawerRes]       = useState<Reservation|null>(null)
  const [notifSettings, setNotifSettings] = useState<NotifSettings>(DEFAULT_NOTIF)

  // Notification confirmation flow
  const [pendingConfirm, setPendingConfirm] = useState<Reservation|null>(null)
  const [sentMsg, setSentMsg]               = useState<string|null>(null)

  function handleStatusChange(id:string, status:ReservationStatus) {
    setReservations(prev=>prev.map(r=>r.id===id?{...r,status}:r))
    setDrawerRes(prev=>prev?.id===id?{...prev,status}:prev)
  }

  function handleRequestConfirm(r:Reservation) {
    setPendingConfirm(r)
  }

  function handleNotifConfirm() {
    if(!pendingConfirm) return
    handleStatusChange(pendingConfirm.id,"확정")
    const ch = NOTIF_CHANNEL[pendingConfirm.loginMethod]
    setSentMsg(`${pendingConfirm.name}님에게 ${ch.label}로 예약 확정 알림이 발송되었습니다.`)
    setTimeout(()=>setSentMsg(null),4000)
    setPendingConfirm(null)
  }

  function handleMoveReservation(id:string, newSlot:string, newTime:string) {
    setReservations(prev=>prev.map(r=>r.id===id?{...r,slot:newSlot,time:newTime}:r))
  }

  function handleSendMoveNotification(r:Reservation, newSlot:string, newTime:string) {
    const ch = NOTIF_CHANNEL[r.loginMethod]
    setSentMsg(`${r.name}님에게 ${ch.label}로 예약 변경 알림이 발송되었습니다. (→ 예약${newSlot} ${newTime})`)
    setTimeout(()=>setSentMsg(null), 4000)
  }

  const tabs = [
    { key:"list"     as const, label:"예약 목록",          icon:FileText     },
    { key:"schedule" as const, label:"날짜별 스케줄 관리", icon:CalendarCheck },
    { key:"settings" as const, label:"알림 설정",          icon:Settings     },
  ]

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground">예약 관리</h1>
        <p className="text-sm text-muted-foreground mt-0.5">실시간 예약 현황 및 스케줄을 관리합니다</p>
      </div>

      {/* Sent notification toast */}
      {sentMsg&&(
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 flex items-center gap-2">
          <CheckCheck className="h-4 w-4 text-green-600 shrink-0"/>{sentMsg}
        </div>
      )}

      <KpiBar reservations={reservations} />

      <div className="flex gap-1 mb-5 p-1 bg-muted rounded-xl w-fit">
        {tabs.map(t=>{
          const Icon=t.icon
          return(
            <button key={t.key} onClick={()=>setActiveTab(t.key)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab===t.key?"bg-card text-foreground shadow-sm border border-border":"text-muted-foreground hover:text-foreground")}>
              <Icon className="h-4 w-4"/>{t.label}
            </button>
          )
        })}
      </div>

      {activeTab==="list"&&<BookingListTab reservations={reservations} onSelect={setDrawerRes}/>}
      {activeTab==="schedule"&&<ScheduleTab reservations={reservations} onOpenDrawer={setDrawerRes} onMoveReservation={handleMoveReservation} onSendMoveNotification={handleSendMoveNotification}/>}
      {activeTab==="settings"&&<NotificationSettingsTab settings={notifSettings} onUpdate={setNotifSettings} reservations={reservations}/>}

      {/* Detail drawer */}
      <DetailDrawer reservation={drawerRes} onClose={()=>setDrawerRes(null)}
        onStatusChange={handleStatusChange} onRequestConfirm={handleRequestConfirm}/>

      {/* Notification confirmation modal */}
      {pendingConfirm&&(
        <NotificationModal
          reservation={pendingConfirm}
          notifSettings={notifSettings}
          onConfirm={handleNotifConfirm}
          onCancel={()=>setPendingConfirm(null)}
        />
      )}
    </div>
  )
}
