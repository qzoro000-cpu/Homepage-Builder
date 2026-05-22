"use client"

import {
  Settings,
  User,
  Bell,
  Shield,
  Globe,
  Database,
  Bot,
  Palette,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const settingsSections = [
  {
    title: "프로필 설정",
    description: "계정 및 환경설정 관리",
    icon: User,
    items: [
      { label: "프로필 수정", description: "이름, 이메일, 아바타 업데이트" },
      { label: "비밀번호 변경", description: "보안 자격증명 업데이트" },
      { label: "이중 인증", description: "추가 보안 계층 설정" },
    ],
  },
  {
    title: "알림",
    description: "알림 수신 방법 설정",
    icon: Bell,
    items: [
      { label: "이메일 알림", description: "이메일로 업데이트 수신", hasToggle: true, defaultOn: true },
      { label: "푸시 알림", description: "브라우저 푸시 알림", hasToggle: true, defaultOn: false },
      { label: "동기화 알림", description: "챗봇 동기화 실패 시 알림", hasToggle: true, defaultOn: true },
    ],
  },
  {
    title: "보안 및 접근",
    description: "권한 및 접근 제어 관리",
    icon: Shield,
    items: [
      { label: "역할 관리", description: "관리자 역할 및 권한 설정" },
      { label: "API 키", description: "API 액세스 토큰 관리" },
      { label: "감사 로그", description: "시스템 활동 내역 보기" },
    ],
  },
  {
    title: "연동",
    description: "외부 서비스 연결",
    icon: Globe,
    items: [
      { label: "예약 시스템", description: "예약 시스템 연동 설정" },
      { label: "분석", description: "Google Analytics 등 연결" },
      { label: "CRM 연동", description: "고객 관계 관리 도구와 동기화" },
    ],
  },
  {
    title: "데이터베이스 및 스토리지",
    description: "데이터 및 백업 관리",
    icon: Database,
    items: [
      { label: "백업 설정", description: "자동 데이터 백업 설정" },
      { label: "데이터 내보내기", description: "다양한 형식으로 콘텐츠 내보내기" },
      { label: "스토리지 사용량", description: "미디어 스토리지 보기 및 관리" },
    ],
  },
  {
    title: "챗봇 설정",
    description: "AI 챗봇 동작 설정",
    icon: Bot,
    items: [
      { label: "지식베이스", description: "챗봇 학습 데이터 관리" },
      { label: "응답 템플릿", description: "기본 응답 커스터마이즈" },
      { label: "동기화 일정", description: "자동 동기화 시간 설정" },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">설정</h1>
        <p className="text-sm text-muted-foreground">
          계정, 알림 및 시스템 환경설정 관리
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {settingsSections.map((section) => (
          <Card key={section.title} className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">{section.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {section.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {section.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-muted/50 cursor-pointer group"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  {item.hasToggle ? (
                    <Switch defaultChecked={item.defaultOn} />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Theme Settings */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">외관</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                관리자 대시보드 외관 커스터마이즈
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium">색상 테마</Label>
              <p className="text-xs text-muted-foreground mt-1">
                라이트 및 다크 모드 선택
              </p>
            </div>
            <div className="flex items-center rounded-xl border border-border bg-muted p-1">
              <button className="rounded-lg bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                라이트
              </button>
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                다크
              </button>
              <button className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                시스템
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-destructive">위험 구역</CardTitle>
          <CardDescription className="text-muted-foreground">
            전체 조직에 영향을 미치는 되돌릴 수 없는 작업
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-destructive/30 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">전체 지점 데이터 초기화</p>
              <p className="text-xs text-muted-foreground">
                모든 콘텐츠를 삭제하고 새로 시작합니다. 이 작업은 취소할 수 없습니다.
              </p>
            </div>
            <Button variant="outline" className="rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              데이터 초기화
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-destructive/30 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">조직 삭제</p>
              <p className="text-xs text-muted-foreground">
                조직 및 관련 데이터를 영구 삭제합니다.
              </p>
            </div>
            <Button variant="outline" className="rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              삭제
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
