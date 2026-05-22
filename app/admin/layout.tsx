"use client"

import { useState, createContext, useContext } from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import { OptionProvider } from "@/lib/option-context"
import { StaffProvider } from "@/lib/staff-store"
import { EquipmentProvider } from "@/lib/equipment-store"
import { TreatmentProvider } from "@/lib/treatment-store"
import { DomainProvider } from "@/lib/domain-store"
import { ContentRelationProvider } from "@/lib/content-relation-store"
import { LandingDraftProvider } from "@/lib/landing-draft-store"
import { MediaProvider } from "@/lib/media-store"
import { BranchWebsiteProvider } from "@/lib/branch-website-store"
import { SessionUser, DEFAULT_SESSION } from "@/lib/rbac"

// ─── Branch Context ────────────────────────────────────────────────────────────

type BranchContextType = {
  selectedBranch: string
  setSelectedBranch: (branch: string) => void
}

const BranchContext = createContext<BranchContextType>({
  selectedBranch: "main",
  setSelectedBranch: () => {},
})

export const useBranch = () => useContext(BranchContext)

// ─── Auth/Session Context ──────────────────────────────────────────────────────

type SessionContextType = {
  currentUser: SessionUser
  setCurrentUser: (user: SessionUser) => void
}

const SessionContext = createContext<SessionContextType>({
  currentUser: DEFAULT_SESSION,
  setCurrentUser: () => {},
})

export const useSession = () => useContext(SessionContext)

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [selectedBranch, setSelectedBranch] = useState("main")
  const [currentUser, setCurrentUser] = useState<SessionUser>(DEFAULT_SESSION)

  return (
    <SessionContext.Provider value={{ currentUser, setCurrentUser }}>
      <BranchContext.Provider value={{ selectedBranch, setSelectedBranch }}>
        <OptionProvider>
          <StaffProvider>
            <EquipmentProvider>
              <TreatmentProvider>
              <DomainProvider>
                <ContentRelationProvider>
                  <LandingDraftProvider>
                  <MediaProvider>
                  <BranchWebsiteProvider>
                  <div className="min-h-screen bg-background">
                    <AdminSidebar />
                    <AdminHeader
                      selectedBranch={selectedBranch}
                      onBranchChange={setSelectedBranch}
                    />
                    <main className="ml-64 pt-16">
                      <div className="p-6">{children}</div>
                    </main>
                  </div>
                  </BranchWebsiteProvider>
                  </MediaProvider>
                  </LandingDraftProvider>
                </ContentRelationProvider>
              </DomainProvider>
              </TreatmentProvider>
            </EquipmentProvider>
          </StaffProvider>
        </OptionProvider>
      </BranchContext.Provider>
    </SessionContext.Provider>
  )
}
