import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

const SCREENSHOT_DIR = path.join(process.cwd(), "screenshots");

async function capture() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log("🚀 Launching Edge browser via Playwright...");
  const browser = await chromium.launch({ channel: "msedge" });

  const pagesToCapture = [
    { name: "feed_desktop", url: "http://localhost:3000/feed", viewport: { width: 1440, height: 900 } },
    { name: "feed_mobile", url: "http://localhost:3000/feed", viewport: { width: 390, height: 844 } },
    { name: "swipe_desktop", url: "http://localhost:3000/swipe", viewport: { width: 1440, height: 900 } },
    { name: "swipe_mobile", url: "http://localhost:3000/swipe", viewport: { width: 390, height: 844 } },
    { name: "ranks_desktop", url: "http://localhost:3000/ranks", viewport: { width: 1440, height: 900 } },
    { name: "ranks_mobile", url: "http://localhost:3000/ranks", viewport: { width: 390, height: 844 } },
    { name: "pollview_desktop", url: "http://localhost:3000/polls/alg-aus-win", viewport: { width: 1440, height: 900 } },
    { name: "pollview_mobile", url: "http://localhost:3000/polls/alg-aus-win", viewport: { width: 390, height: 844 } },
    { name: "admin_login_desktop", url: "http://localhost:3000/admin-login", viewport: { width: 1440, height: 900 } },
    { name: "admin_terminal_desktop", url: "http://localhost:3000/admin", viewport: { width: 1440, height: 900 } },
  ];

  for (const item of pagesToCapture) {
    try {
      const page = await browser.newPage({ viewport: item.viewport });
      console.log(`📸 Capturing ${item.name} from ${item.url}...`);
      await page.goto(item.url, { waitUntil: "networkidle", timeout: 15000 });
      // Small pause for animation frames
      await page.waitForTimeout(1000);
      const filePath = path.join(SCREENSHOT_DIR, `${item.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`✅ Saved: ${filePath}`);
      await page.close();
    } catch (err: any) {
      console.error(`❌ Failed capturing ${item.name}:`, err.message);
    }
  }

  await browser.close();
  console.log("🎉 All screenshots successfully captured!");
}

capture().catch(err => {
  console.error("Fatal capture error:", err);
  process.exit(1);
});
