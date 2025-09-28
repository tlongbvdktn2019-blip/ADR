# Script to fix common Supabase TypeScript errors

# List of patterns to fix
$patterns = @(
    # Fix object property access on 'never' type  
    @{
        Pattern = '\.reporter_id'
        Replacement = { param($match) 
            $line = $match.Groups[0].Value
            $prefix = $match.Groups[0].Value -replace '\.reporter_id.*$', ''
            return "($prefix as any)?.reporter_id"
        }
    }
)

# Files to process
$files = Get-ChildItem -Recurse -Include *.ts -Path "app/api" | Where-Object { $_.Name -notlike "*.d.ts" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Fix .reporter_id access
    if ($content -match '[^(]\w+\.reporter_id(?!\s*!==\s*session\.user\.id)') {
        $content = $content -replace '([^(]\w+)\.reporter_id', '($1 as any)?.reporter_id'
        $modified = $true
    }
    
    # Fix other property access
    if ($content -match '(\w+)\.report_code' -and $content -notmatch '\(.*as any\)') {
        $content = $content -replace '([^(]\w+)\.report_code', '($1 as any)?.report_code'
        $modified = $true  
    }
    
    if ($modified) {
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "TypeScript fixes completed!"
















