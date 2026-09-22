import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const variant = req.nextUrl.searchParams.get("variant") || "compliant";
  const brand = req.nextUrl.searchParams.get("brand") || "ACME";

  const isCompliant = variant === "compliant";
  const hasCompetitor = variant === "competitor";
  const belowFold = variant === "belowfold";
  const noLogo = variant === "nologo";

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TechBlog Demo Publisher - ${variant}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 960px; margin: 0 auto; padding: 24px; background: #fdfcf8; color: #1a1a1a; }
  header { border-bottom: 1px solid #e8e3db; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; }
  .ad { border: 2px dashed #4f46e5; background: #eef0ff; padding: 16px; margin: 16px 0; position: relative; }
  .ad-label { position: absolute; top: -10px; left: 12px; background: #4f46e5; color: white; font-family: monospace; font-size: 10px; padding: 2px 6px; }
  .logo { width: 48px; height: 48px; background: #1a1a1a; color: white; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 12px; font-weight: bold; }
  .competitor { border: 2px dashed #991b1b; background: #fef2f2; padding: 12px; margin: 12px 0; }
  .fold { border-top: 2px dashed #d97706; margin: 24px 0; padding-top: 8px; font-family: monospace; font-size: 10px; color: #92400e; }
  .content { line-height: 1.6; }
</style>
</head>
<body>
<header>
  <div style="font-weight: bold; font-size: 20px;">TechBlog.example.com</div>
  <div style="font-family: monospace; font-size: 11px; color: #6b6b6b;">DEMO PUBLISHER • ${variant.toUpperCase()} • ${new Date().toISOString()}</div>
</header>

<div class="content">
  <h1>Why ${brand} Launch Changes Everything</h1>
  <p>Published today • 5 min read • By Demo Publisher</p>
  
  ${isCompliant || hasCompetitor ? `
  <div class="ad">
    <div class="ad-label">AD • 300x250 • ABOVE FOLD</div>
    <div style="display: flex; gap: 12px; align-items: center;">
      ${noLogo ? `<div style="width:48px;height:48px;background:#e8e3db;"></div>` : `<div class="logo">${brand}</div>`}
      <div>
        <div style="font-weight: bold;">${brand} Launch - $20 off</div>
        <div style="font-size: 12px; color: #6b6b6b;">Sponsored • ${brand.toLowerCase()}.com/launch • Main content region</div>
        <div style="font-size: 11px; margin-top: 4px;"><a href="https://${brand.toLowerCase()}.com/launch" style="color: #4f46e5;">Visit ${brand}.com/launch →</a></div>
      </div>
    </div>
  </div>
  ` : ''}

  ${hasCompetitor ? `
  <div class="competitor">
    <div style="font-family: monospace; font-size: 10px; background: #991b1b; color: white; display: inline-block; padding: 2px 6px; margin-bottom: 6px;">COMPETITOR XYZ</div>
    <div>XYZ Corp - Better than ${brand}? Check our comparison.</div>
  </div>
  ` : ''}

  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
  
  ${belowFold ? `
  <div class="fold">FOLD LINE • 800px • BELOW FOLD CONTENT STARTS</div>
  <div class="ad">
    <div class="ad-label">AD • 300x250 • BELOW FOLD</div>
    <div style="display: flex; gap: 12px; align-items: center;">
      <div class="logo">${brand}</div>
      <div>
        <div style="font-weight: bold;">${brand} Launch - $20 off</div>
        <div style="font-size: 12px; color: #6b6b6b;">Sponsored • Below fold</div>
      </div>
    </div>
  </div>
  ` : ''}

  ${!isCompliant && !hasCompetitor && !belowFold && !noLogo ? `
  <p><em>No advertisement present on this page variant. This simulates a publisher who removed the ad early or never placed it. GenLayer should detect NON_COMPLIANT.</em></p>
  ` : ''}

  <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
  <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
</div>

<footer style="margin-top: 48px; border-top: 1px solid #e8e3db; padding-top: 12px; font-family: monospace; font-size: 10px; color: #6b6b6b;">
  DEMO PUBLISHER • Variant: ${variant} • Brand: ${brand} • This page is intentionally simple for GenLayer screenshot rendering. For real verification, validators render this URL via gl.nondet.web.render(mode='screenshot').
</footer>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html", "Cache-Control": "no-cache" },
  });
}
