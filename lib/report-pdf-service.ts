import fs from 'fs'
import path from 'path'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import { ADRReport } from '../types/report'
import { generateReportPrintHTML } from './report-print-template'

interface PdfRequestLike {
  url: () => string
  continue: () => void
  abort: () => void
}

export interface ReportPdfPage {
  setJavaScriptEnabled: (enabled: boolean) => Promise<void>
  setRequestInterception: (enabled: boolean) => Promise<void>
  on: (event: 'request', handler: (request: PdfRequestLike) => void) => unknown
  setContent: (html: string, options: { waitUntil: 'domcontentloaded' }) => Promise<void>
  emulateMediaType: (type: 'print') => Promise<void>
  pdf: (options: {
    format: 'A4'
    printBackground: boolean
    preferCSSPageSize: boolean
    tagged: boolean
  }) => Promise<Uint8Array>
}

export interface ReportPdfBrowser {
  newPage: () => Promise<ReportPdfPage>
  close: () => Promise<void>
}

export interface ReportPdfDependencies {
  launchBrowser?: () => Promise<ReportPdfBrowser>
}

function isServerlessRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
}

function getLocalChromeCandidates(): string[] {
  const candidates: string[] = []

  if (process.platform === 'win32') {
    const programFiles = process.env.ProgramFiles
    const programFilesX86 = process.env['ProgramFiles(x86)']
    const localAppData = process.env.LOCALAPPDATA

    if (programFiles) {
      candidates.push(
        path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
      )
    }
    if (programFilesX86) {
      candidates.push(
        path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
      )
    }
    if (localAppData) {
      candidates.push(path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'))
    }
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    )
  } else {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser'
    )
  }

  return candidates
}

export async function resolveChromeExecutablePath(): Promise<string> {
  const configuredPath = process.env.CHROME_EXECUTABLE_PATH?.trim()
  if (configuredPath) {
    if (!fs.existsSync(configuredPath)) {
      throw new Error('CHROME_EXECUTABLE_PATH does not point to an existing browser')
    }
    return configuredPath
  }

  if (isServerlessRuntime()) {
    return chromium.executablePath()
  }

  const localPath = getLocalChromeCandidates().find(candidate => fs.existsSync(candidate))
  if (!localPath) {
    throw new Error('Không tìm thấy Chrome/Edge để tạo PDF. Hãy cấu hình CHROME_EXECUTABLE_PATH.')
  }

  return localPath
}

async function launchReportBrowser(): Promise<ReportPdfBrowser> {
  const serverless = isServerlessRuntime()
  const executablePath = await resolveChromeExecutablePath()

  return puppeteer.launch({
    args: serverless ? chromium.args : [],
    defaultViewport: {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
    },
    executablePath,
    headless: 'shell',
  }) as unknown as Promise<ReportPdfBrowser>
}

export function buildReportPdfFilename(reportCode: string): string {
  const safeCode = reportCode.trim().replace(/[^A-Za-z0-9._-]+/g, '-') || 'report'
  return `Bao-cao-ADR-${safeCode}.pdf`
}

export async function generateReportPdf(
  report: ADRReport,
  dependencies: ReportPdfDependencies = {}
): Promise<Buffer> {
  const browser = await (dependencies.launchBrowser || launchReportBrowser)()

  try {
    const page = await browser.newPage()
    await page.setJavaScriptEnabled(false)
    await page.setRequestInterception(true)
    page.on('request', request => {
      const requestUrl = request.url()
      if (requestUrl === 'about:blank' || requestUrl.startsWith('data:')) {
        request.continue()
      } else {
        request.abort()
      }
    })

    const html = generateReportPrintHTML(report, { interactive: false })
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    await page.emulateMediaType('print')

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
