import { SectionDivider } from "@/components/SectionDivider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function Contact() {
  return (
    <section className="container px-4 py-16 sm:px-6">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">联系</h1>
      <SectionDivider />
      <div className="mx-auto max-w-sm space-y-6">
        <Card>
          <CardContent className="pt-6">
            <dl className="space-y-2">
              <dt className="font-semibold">微信</dt>
              <dd className="text-muted-foreground text-sm">扫码添加</dd>
            </dl>
            <div className="mt-4">
              <img
                src="/image/Image_20250314201247.jpg"
                alt="WeChat QR"
                className="rounded-lg border border-border w-48 h-auto"
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href="/resume/简历 中文.pdf" download>简历 (中文)</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/resume/简历 _1_ (1).pdf" download>Resume (EN)</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
