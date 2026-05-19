[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$logFile = Join-Path $PSScriptRoot "hook-debug.log"

try {
    $input_json = [Console]::In.ReadToEnd()

    if ([string]::IsNullOrWhiteSpace($input_json)) { exit 0 }

    $data = $input_json | ConvertFrom-Json
    $file = $data.tool_input.file_path

    if ([string]::IsNullOrWhiteSpace($file)) { exit 0 }

    $inSrc = ($file -match '\\src\\' -or $file -match '/src/')
    $isTsFile = ($file -match '\.(ts|tsx)$')
    $isTestFile = ($file -match '\.test\.(ts|tsx)$')

    if (-not $inSrc -or -not $isTsFile -or $isTestFile) { exit 0 }

    $base = $file -replace '\.(ts|tsx)$', ''
    $testTs  = "$base.test.ts"
    $testTsx = "$base.test.tsx"

    if (-not (Test-Path $testTs) -and -not (Test-Path $testTsx)) {
        $fileName = Split-Path $file -Leaf
        $msg = '{\"systemMessage\":\"[TDD WARNING] No test file found for: ' + $fileName + ' — Write tests first. See .claude/rules/tdd.md\"}'
        [Console]::WriteLine($msg)
    }
} catch {
    # silent on error
}

exit 0
