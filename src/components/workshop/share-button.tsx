'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Copy, ExternalLink, Image as ImageIcon, Link2, Loader2, MessageSquareQuote, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type ShareButtonProps = {
  code: string
  levelId: number
  languageName: string
  levelTitle: string
  codename: string
  lastOutput: string
  lastImage: string | null
  onShared: () => void  // callback to award 'sharer' achievement
}

function defaultMentorQuote(languageName: string, levelId: number, levelTitle: string, hasGraphic: boolean) {
  if (hasGraphic) {
    return `Nexus 老炮：图都画出来了，${languageName} Lv.${levelId} 这次总算不是只会让终端干瞪眼。`
  }
  return `Nexus 老炮：${languageName} Lv.${levelId}「${levelTitle}」过了。代码能跑，说明这次键盘没有白挨打。`
}

export function ShareButton({
  code,
  levelId,
  languageName,
  levelTitle,
  codename,
  lastOutput,
  lastImage,
  onShared,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [mentorQuote, setMentorQuote] = useState(() => defaultMentorQuote(languageName, levelId, levelTitle, !!lastImage))
  const [publishToWall, setPublishToWall] = useState(true)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [wallPublic, setWallPublic] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyTextDone, setCopyTextDone] = useState(false)

  async function handleShare() {
    if (isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          levelId,
          language: languageName,
          title: title.trim() || null,
          outputText: lastOutput || null,
          outputImage: lastImage,
          hasGraphic: !!lastImage,
          mentorQuote,
          codename,
          publishToWall,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Share failed')
      setShareUrl(data.url)
      setWallPublic(Boolean(data.wallPublic))
      if (data.warning === 'mentor_wall_migration_missing') {
        toast.warning('分享已生成，但吐槽墙字段还没迁移，暂时不会上墙。')
      }
      onShared()
    } catch (err) {
      toast.error(`分享失败：${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCopy() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('链接已复制到剪贴板！')
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleCopyPostText() {
    if (!shareUrl) return
    const text = [
      `我被 CodeNexus 的 AI 编程导师当场扎了一刀：`,
      `「${mentorQuote}」`,
      '',
      `但 ${languageName} Lv.${levelId}「${levelTitle}」确实过了。`,
      shareUrl,
    ].join('\n')
    await navigator.clipboard.writeText(text)
    setCopyTextDone(true)
    toast.success('小红书/微博文案已复制')
    setTimeout(() => setCopyTextDone(false), 2000)
  }

  function handleClose() {
    setIsOpen(false)
    setShareUrl(null)
    setWallPublic(false)
    setTitle('')
    setMentorQuote(defaultMentorQuote(languageName, levelId, levelTitle, !!lastImage))
    setPublishToWall(true)
    setCopied(false)
    setCopyTextDone(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="cn-focus-ring flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-xs text-white/40 transition-all hover:border-cyan-300/24 hover:text-cyan-100/70"
      >
        <Share2 className="h-3 w-3" />
        分享
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 18, filter: 'blur(8px)' }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 10, filter: 'blur(6px)' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full max-w-md rounded-lg border border-cyan-300/18 bg-black/94 p-6 shadow-[0_28px_110px_rgba(0,0,0,0.72),0_0_60px_rgba(34,211,238,0.1)]"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
                  <Link2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">生成导师吐槽分享卡</h2>
                  <p className="text-xs text-white/40">代码公开链接 + Nexus 老炮语录</p>
                </div>
              </div>

              {!shareUrl ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-white/8 bg-white/[0.025] p-3">
                    <pre className="max-h-24 overflow-hidden font-mono text-xs leading-relaxed text-cyan-50/60">
                      {code.split('\n').slice(0, 6).join('\n')}
                      {code.split('\n').length > 6 && '\n...'}
                    </pre>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40">作品标题（可选）</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={`例如：我的第一个 ${languageName} 程序`}
                      maxLength={100}
                      className="cn-focus-ring w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-cyan-300/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-white/40">
                      <MessageSquareQuote className="h-3.5 w-3.5 text-cyan-200/55" />
                      导师吐槽语录
                    </label>
                    <textarea
                      value={mentorQuote}
                      onChange={(e) => setMentorQuote(e.target.value.slice(0, 280))}
                      rows={3}
                      maxLength={280}
                      className="cn-focus-ring w-full resize-none rounded-lg border border-cyan-300/16 bg-cyan-300/[0.045] px-3 py-2 text-sm leading-relaxed text-cyan-50/78 outline-none transition-colors placeholder:text-white/20 focus:border-cyan-300/50"
                    />
                    <p className="text-right font-mono text-[10px] text-white/22">{mentorQuote.length}/280</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPublishToWall(!publishToWall)}
                    className="cn-focus-ring flex w-full items-start gap-3 rounded-lg border border-cyan-300/14 bg-cyan-300/[0.035] px-3 py-2 text-left transition-colors hover:border-cyan-300/26"
                  >
                    <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                      publishToWall ? 'border-cyan-300/70 bg-cyan-300 text-black' : 'border-white/18 bg-black/35'
                    }`}>
                      {publishToWall && <Check className="h-3 w-3" />}
                    </span>
                    <span>
                      <span className="block text-xs font-semibold text-white/72">公开到 /wall 吐槽墙</span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-white/34">
                        分享链接本来就是公开的；勾选后会进入精选墙，别人能从那里点回你的代码卡。
                      </span>
                    </span>
                  </button>

                  {lastImage && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300/70">
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>图形输出将一并分享</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <Button variant="outline" onClick={handleClose} className="flex-1 border-white/12 bg-transparent text-white/50 hover:text-white">
                      取消
                    </Button>
                    <Button
                      onClick={handleShare}
                      disabled={isLoading}
                      className="flex-1 bg-cyan-300 font-semibold text-black hover:bg-cyan-200"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          生成中...
                        </span>
                      ) : '生成分享卡'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="py-2 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/24 bg-emerald-300/10 text-emerald-200">
                      <Check className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-white">链接已生成</p>
                    <p className="mt-1 text-xs text-white/40">
                      {wallPublic ? '已进入公开吐槽墙，也可以单独分享链接。' : '分享给朋友，让他们看看你的代码。'}
                    </p>
                  </div>

                  <div className="rounded-lg border border-cyan-300/16 bg-cyan-300/[0.045] p-3">
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-cyan-200/48">
                      <MessageSquareQuote className="h-3 w-3" />
                      Nexus Quote
                    </p>
                    <p className="text-sm leading-relaxed text-cyan-50/72">“{mentorQuote}”</p>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                    <span className="flex-1 truncate font-mono text-sm text-cyan-200/72">{shareUrl}</span>
                    <button
                      onClick={handleCopy}
                      className="cn-focus-ring flex flex-shrink-0 items-center gap-1 rounded-lg border border-cyan-300/30 bg-cyan-300/12 px-2.5 py-1 text-xs font-medium text-cyan-100 transition-colors hover:bg-cyan-300/22"
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? '已复制' : '复制'}
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <Button variant="outline" onClick={handleClose} className="flex-1 border-white/12 bg-transparent text-white/50">
                      关闭
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCopyPostText}
                      className="flex-1 border-cyan-300/18 bg-cyan-300/[0.06] text-cyan-100/72 hover:text-cyan-50"
                    >
                      {copyTextDone ? '已复制文案' : '复制发帖文案'}
                    </Button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cn-focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/80 py-2 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
                    >
                      查看效果
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
