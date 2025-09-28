# PowerShell script to fix authOptions imports across all files

$files = @(
    "app/api/allergy-cards/route.ts",
    "app/api/allergy-cards/[id]/route.ts", 
    "app/api/allergy-cards/[id]/export-pdf/route.ts",
    "app/api/dashboard/charts/route.ts",
    "app/api/dashboard/stats/route.ts",
    "app/api/quiz/analytics/route.ts",
    "app/api/quiz/daily-challenge/route.ts",
    "app/api/quiz/daily-challenge/start/route.ts",
    "app/api/quiz/leaderboard/route.ts", 
    "app/api/quiz/sessions/route.ts",
    "app/api/quiz/stats/route.ts",
    "app/api/reports/route.ts",
    "app/api/reports/[id]/export-pdf/route.ts",
    "app/api/reports/[id]/send-email/route.ts",
    "app/dashboard/page.tsx",
    "app/reports/[id]/page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $newContent = $content -replace "import { authOptions } from '@/app/api/auth/\[\.\.\.nextauth\]/route'", "import { authOptions } from '@/lib/auth-config'"
        Set-Content $file -Value $newContent -NoNewline
        Write-Host "Updated: $file"
    } else {
        Write-Host "File not found: $file"
    }
}
















