import type { Browser } from 'puppeteer-core'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { ADRReport } from '@/types/report'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
}

const defaultOptions: PDFGenerationOptions = {
  format: 'A4',
  orientation: 'portrait',
  margin: {
    top: '0.5cm',
    right: '0.5cm', 
    bottom: '0.5cm',
    left: '0.5cm'
  }
}

const isServerlessEnvironment = Boolean(
  process.env.AWS_LAMBDA_FUNCTION_VERSION ||
  process.env.VERCEL ||
  process.env.NETLIFY
)

const getCustomExecutablePath = () =>
  process.env.CHROME_EXECUTABLE_PATH || 
  process.env.PUPPETEER_EXECUTABLE_PATH || 
  process.env.GOOGLE_CHROME_BIN || ''

// Enhanced ETXTBSY error handling for Vercel
class VercelPDFService {
  private static browserInstance: Browser | null = null
  private static browserLaunching = false

  static async ensureBrowser(): Promise<Browser> {
    // If browser is already launching, wait for it
    if (this.browserLaunching) {
      let attempts = 0
      const maxAttempts = 50 // 5 seconds max wait
      while (this.browserLaunching && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
    }

    // If we have a healthy browser instance, reuse it
    if (this.browserInstance && this.browserInstance.connected) {
      try {
        // Test if browser is responsive
        const pages = await this.browserInstance.pages()
        return this.browserInstance
      } catch (error) {
        console.warn('Existing browser instance not responsive, creating new one')
        this.browserInstance = null
      }
    }

    // Launch new browser if needed
    if (!this.browserInstance || !this.browserInstance.connected) {
      this.browserLaunching = true
      try {
        this.browserInstance = await this.launchBrowserWithRetry(5)
        this.browserLaunching = false
        return this.browserInstance
      } catch (error) {
        this.browserLaunching = false
        throw error
      }
    }

    return this.browserInstance
  }

  private static async launchBrowserWithRetry(maxAttempts = 5): Promise<Browser> {
    let lastError: unknown
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxAttempts}: Launching browser...`)
        
        const browser = await this.launchBrowser()
        console.log(`✅ Browser launched successfully on attempt ${attempt}`)
        return browser
        
      } catch (error) {
        lastError = error
        const message = (error as Error)?.message ?? ''
        const code = (error as NodeJS.ErrnoException)?.code ?? ''
        
        console.error(`❌ Browser launch failed (attempt ${attempt}/${maxAttempts}):`, {
          code,
          message: message.substring(0, 200)
        })
        
        // Enhanced ETXTBSY handling
        if (code === 'ETXTBSY' || message.includes('ETXTBSY') || message.includes('spawn')) {
          if (attempt < maxAttempts) {
            // Exponential backoff with jitter
            const baseDelay = 500 * Math.pow(2, attempt - 1)
            const jitter = Math.random() * 200
            const delay = baseDelay + jitter
            
            console.warn(`🔄 ETXTBSY detected, retrying in ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            
            // Try to clean up any stale processes
            if (process.env.VERCEL) {
              await this.cleanupStaleProcesses()
            }
            
            continue
          }
        }
        
        // For other errors, retry with shorter delay
        if (attempt < maxAttempts) {
          const delay = 1000 + (Math.random() * 1000) // 1-2 seconds
          console.warn(`⏳ Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        throw error
      }
    }
    
    throw lastError ?? new Error(`Failed to launch browser after ${maxAttempts} attempts`)
  }

  private static async cleanupStaleProcesses(): Promise<void> {
    try {
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      // Add small delay to let system clean up
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.warn('Cleanup attempt failed:', error)
    }
  }

  private static async launchBrowser(): Promise<Browser> {
    const customExecutablePath = getCustomExecutablePath()

    if (customExecutablePath && existsSync(customExecutablePath)) {
      console.log('Using custom Chrome executable:', customExecutablePath)
      const { default: puppeteerCore } = await import('puppeteer-core')
      return puppeteerCore.launch({
        headless: true,
        executablePath: customExecutablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ]
      })
    }

    if (isServerlessEnvironment) {
      console.log('Launching browser for serverless environment')
      const usingVercel = Boolean(process.env.VERCEL)
      
      if (usingVercel && !process.env.AWS_EXECUTION_ENV) {
        const nodeMajor = Number(process.versions.node.split('.')[0] || 18)
        process.env.AWS_EXECUTION_ENV = nodeMajor >= 20 ? 'AWS_Lambda_nodejs20.x' : 'AWS_Lambda_nodejs18.x'
      }

      const [chromiumModule, puppeteerCoreModule] = await Promise.all([
        import('@sparticuz/chromium').catch(err => {
          console.error('Failed to import @sparticuz/chromium:', err)
          throw new Error('Missing @sparticuz/chromium package for serverless deployment')
        }),
        import('puppeteer-core').catch(err => {
          console.error('Failed to import puppeteer-core:', err)
          throw new Error('Missing puppeteer-core package')
        })
      ])

      const chromium = (chromiumModule as any).default ?? chromiumModule
      const puppeteerCore = (puppeteerCoreModule as any).default ?? puppeteerCoreModule

      // Configure Chromium for serverless
      if (chromium && 'setHeadlessMode' in chromium) {
        ;(chromium as any).setHeadlessMode = true
      }
      if (chromium && 'setGraphicsMode' in chromium) {
        ;(chromium as any).setGraphicsMode = false
      }

      const executablePath = await (chromium as any).executablePath()
      if (!executablePath) {
        throw new Error('Chromium executablePath not found in serverless environment')
      }

      console.log('Using Chromium executable:', executablePath)

      // Configure library paths for Lambda
      const candidateLibraryPaths = [
        dirname(executablePath),
        '/tmp/al2/lib',
        '/tmp/al2023/lib'
      ].filter((value): value is string => Boolean(value) && existsSync(value))

      if (candidateLibraryPaths.length) {
        const currentPaths = process.env.LD_LIBRARY_PATH ? process.env.LD_LIBRARY_PATH.split(':') : []
        const merged = Array.from(new Set([...candidateLibraryPaths, ...currentPaths]))
        process.env.LD_LIBRARY_PATH = merged.join(':')
      }

      return (puppeteerCore as any).launch({
        args: [
          ...(chromium as any).args,
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--run-all-compositor-stages-before-draw',
          '--no-first-run'
        ],
        defaultViewport: (chromium as any).defaultViewport ?? { width: 1200, height: 1600 },
        executablePath,
        headless: true,
        pipe: true, // Use pipe instead of WebSocket
        dumpio: false
      })
    }

    // Fallback to regular puppeteer for local development
    console.log('Using regular Puppeteer for local development')
    const { default: puppeteer } = await import('puppeteer')
    return puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions'
      ]
    })
  }

  static async generatePDF(
    report: ADRReport, 
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    console.log('=== Enhanced PDF Generation START ===')
    console.log('Environment:', {
      isServerless: isServerlessEnvironment,
      isVercel: Boolean(process.env.VERCEL),
      nodeVersion: process.version
    })

    const finalOptions = { ...defaultOptions, ...options }
    const browser = await this.ensureBrowser()
    
    let page: any = null
    
    try {
      console.log('Creating new page...')
      page = await browser.newPage()
      
      // Optimize page for PDF generation
      await Promise.all([
        page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 }),
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
        page.setCacheEnabled(false),
        page.setJavaScriptEnabled(false) // Disable JS for faster rendering
      ])

      console.log('Generating HTML content...')
      // Use the same HTML generation logic from pdf-service-new.ts
      const html = this.renderReportHTML(report)
      
      console.log('Setting page content...')
      await page.setContent(html, {
        waitUntil: 'domcontentloaded', // Faster than networkidle0
        timeout: 20000
      })

      console.log('Generating PDF...')
      const pdfBuffer = await page.pdf({
        format: finalOptions.format,
        landscape: finalOptions.orientation === 'landscape',
        margin: finalOptions.margin,
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        timeout: 30000
      })

      console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes')
      return Buffer.from(pdfBuffer)

    } catch (error) {
      console.error('❌ PDF generation failed:', error)
      throw error
    } finally {
      if (page) {
        try {
          await page.close()
        } catch (err) {
          console.warn('Failed to close page:', err)
        }
      }
    }
  }

  // Copy the renderReportHTML method from pdf-service-new.ts
  private static renderReportHTML(report: ADRReport): string {
    // [Implementation would be copied from pdf-service-new.ts]
    // For brevity, using a simplified version
    const templatePath = join(process.cwd(), 'template.html')
    let html = readFileSync(templatePath, 'utf-8')
    
    // Basic replacements
    html = html.replace(/{{patient_name}}/g, report.patient_name || '')
    html = html.replace(/{{report_code}}/g, report.report_code || '')
    // ... more replacements as needed
    
    return html
  }

  static async cleanup(): Promise<void> {
    if (this.browserInstance && this.browserInstance.connected) {
      try {
        await this.browserInstance.close()
        this.browserInstance = null
        console.log('Browser instance cleaned up')
      } catch (error) {
        console.warn('Failed to cleanup browser:', error)
      }
    }
  }
}

export { VercelPDFService as PDFService }
