"use client"

import { useState, useRef } from "react"
import { X, Upload, Check, Search, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { TreatmentAsset } from "@/lib/treatment-store"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImagePickerTab = "upload" | "library" | "hq"

type Props = {
  /** Branch-specific assets available to pick from */
  libraryAssets: TreatmentAsset[]
  /** HQ / inherited assets available to pick from */
  hqAssets?: TreatmentAsset[]
  /** Called when the user confirms an asset selection */
  onSelect: (asset: TreatmentAsset) => void
  /**
   * If provided, the "새 업로드" tab is shown.
   * The callback must create the asset in the store and return it.
   */
  onUploadAndSelect?: (file: File) => TreatmentAsset | Promise<TreatmentAsset>
  onClose: () => void
  /** Highlights the currently linked asset */
  currentAssetId?: string
  title?: string
  /** Which tab to show first */
  initialTab?: ImagePickerTab
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImagePickerModal({
  libraryAssets,
  hqAssets = [],
  onSelect,
  onUploadAndSelect,
  onClose,
  currentAssetId,
  title = "이미지 선택",
  initialTab,
}: Props) {
  const defaultTab: ImagePickerTab = initialTab ?? (onUploadAndSelect ? "upload" : "library")
  const [tab, setTab] = useState<ImagePickerTab>(defaultTab)
  const [search, setSearch] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<{ file: File; url: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const imageLibrary = libraryAssets.filter((a) => a.fileType === "image")
  const imageHq = hqAssets.filter((a) => a.fileType === "image")

  const q = search.toLowerCase()
  const filteredLibrary = q
    ? imageLibrary.filter((a) => (a.title ?? a.fileName).toLowerCase().includes(q))
    : imageLibrary
  const filteredHq = q
    ? imageHq.filter((a) => (a.title ?? a.fileName).toLowerCase().includes(q))
    : imageHq

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return
    if (uploadPreview?.url) URL.revokeObjectURL(uploadPreview.url)
    setUploadPreview({ file, url: URL.createObjectURL(file) })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleUploadConfirm() {
    if (!uploadPreview || !onUploadAndSelect) return
    setUploading(true)
    try {
      const asset = await onUploadAndSelect(uploadPreview.file)
      onSelect(asset)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="bg-background rounded-xl shadow-2xl w-[720px] max-h-[82vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="font-semibold text-base">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Search bar ── */}
        <div className="px-5 pt-3 pb-1 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 h-8 text-sm"
              placeholder="파일명 또는 제목으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as ImagePickerTab)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-5 mt-2 shrink-0 w-fit">
            {onUploadAndSelect && (
              <TabsTrigger value="upload">새 업로드</TabsTrigger>
            )}
            <TabsTrigger value="library">
              라이브러리
              <Badge className="ml-1.5 text-[10px] bg-muted text-muted-foreground">{imageLibrary.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="hq">
              본사 공통
              <Badge className="ml-1.5 text-[10px] bg-muted text-muted-foreground">{imageHq.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* ── Upload tab ── */}
          {onUploadAndSelect && (
            <TabsContent value="upload" className="flex-1 px-5 pb-5 overflow-y-auto mt-0 pt-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {!uploadPreview ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl h-52 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors select-none",
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                  )}
                >
                  <Upload className={cn("h-9 w-9 transition-colors", dragOver ? "text-primary" : "text-muted-foreground")} />
                  <div className="text-center">
                    <p className="text-sm font-medium">이미지를 드래그하거나 클릭해서 선택</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG · JPG · WebP — 최대 20MB</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border bg-muted/30 aspect-video max-h-56 flex items-center justify-center">
                    <img
                      src={uploadPreview.url}
                      alt="preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{uploadPreview.file.name}</span>
                    <span className="shrink-0 text-muted-foreground/70">
                      ({(uploadPreview.file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUploadConfirm} disabled={uploading}>
                      {uploading ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          업로드 중...
                        </span>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          이 이미지 사용
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        URL.revokeObjectURL(uploadPreview.url)
                        setUploadPreview(null)
                      }}
                    >
                      다시 선택
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          )}

          {/* ── Library tab ── */}
          <TabsContent value="library" className="flex-1 px-5 pb-5 overflow-y-auto mt-0 pt-3">
            {filteredLibrary.length === 0 ? (
              <EmptyState message={search ? "검색 결과가 없습니다." : "업로드된 이미지가 없습니다."} />
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {filteredLibrary.map((asset) => (
                  <AssetThumb
                    key={asset.id}
                    asset={asset}
                    selected={asset.id === currentAssetId}
                    onSelect={() => onSelect(asset)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── HQ tab ── */}
          <TabsContent value="hq" className="flex-1 px-5 pb-5 overflow-y-auto mt-0 pt-3">
            {filteredHq.length === 0 ? (
              <EmptyState message={search ? "검색 결과가 없습니다." : "본사 공통 이미지가 없습니다."} />
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {filteredHq.map((asset) => (
                  <AssetThumb
                    key={asset.id}
                    asset={asset}
                    selected={asset.id === currentAssetId}
                    onSelect={() => onSelect(asset)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Footer ── */}
        <div className="border-t px-5 py-3 flex items-center justify-between shrink-0 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {currentAssetId ? "현재 선택된 이미지가 있습니다. 새로 선택하면 교체됩니다." : "이미지를 선택하세요."}
          </p>
          <Button variant="ghost" size="sm" onClick={onClose}>취소</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AssetThumb({
  asset,
  selected,
  onSelect,
}: {
  asset: TreatmentAsset
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={asset.title ?? asset.fileName}
      className={cn(
        "relative rounded-lg overflow-hidden border-2 aspect-square transition-all",
        selected
          ? "border-primary ring-2 ring-primary/30 shadow-md"
          : "border-transparent hover:border-primary/40 hover:shadow-sm"
      )}
    >
      <img
        src={asset.fileUrl}
        alt={asset.title ?? asset.fileName}
        className="w-full h-full object-cover"
      />
      {selected && (
        <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5 shadow">
          <Check className="h-2.5 w-2.5 text-white" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1.5">
        <p className="text-[10px] text-white truncate leading-tight">
          {asset.title ?? asset.fileName}
        </p>
      </div>
    </button>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <ImageIcon className="h-8 w-8 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
