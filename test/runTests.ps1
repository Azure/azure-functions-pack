function runTests {
    param( [string] $testName )
    #kill host
    killHost;

    #start host
    func run .\simple

    testOk $testName 'simple'
    testOk $testName 'entryPoint'
    testOk $testName 'externalScriptFile'
    testOk $testName 'fs-ignoremeScriptFile'
    testOk $testName 'cs-ignoreme'
    testOk $testName 'simpleimport'
    testOk $testName 'largeimport'
    testOk $testName 'libimport'
    testOk $testName 'scriptFile'

    killHost;
}

function testOk {
    param( [string] $testName, [string] $name, [bool] $shouldBe = $true )
    try{
    $startMS = Get-Date
    $content = Invoke-WebRequest -Uri ('http://localhost:7071/api/' + $name)
    $endMS = Get-Date
    $duration = (New-TimeSpan -Start $startMS -End $endMS).TotalMilliseconds
    Add-Content 'testTimes.csv' "$((Get-Date).ToShortDateString()), $testName, $name, $duration"
    if ($content.StatusCode -ne 200) {
        Write-Host -ForegroundColor Red " => $name failed"
        Write-Host -ForegroundColor DarkRed $content
        exit
    }
    Write-Host -ForegroundColor Green " => $name succeeded +$($duration)ms"
    #return $true
    } catch {
        Write-Host -ForegroundColor Red "Test went wrong...."
    }
}

function killHost {
    try{
        Get-Process -Name 'func' -ErrorAction SilentlyContinue | %{ Stop-Process -Id $_.Id }
    } catch {
        # no op
    }
}
# Run Tests initially
Write-Host -ForegroundColor Yellow "============ Initial tests ============"
runTests "initial"

Write-Host -ForegroundColor Yellow "============ Running pack  ============"
$startMS = (Get-Date)
node ..\lib\main.js pack ./ 
$endMS = (Get-Date)
Write-Host -ForegroundColor DarkYellow "=======> operation took +$((New-TimeSpan -Start $startMS -End $endMS).TotalMilliseconds)ms to run"
runTests "pack"

Write-Host -ForegroundColor Yellow "============ Running unpack ============"
$startMS = (Get-Date)
node ..\lib\main.js unpack ./
$endMS = (Get-Date)
Write-Host -ForegroundColor DarkYellow "=======> operation took +$((New-TimeSpan -Start $startMS -End $endMS).TotalMilliseconds)ms to run"
runTests "unpack"

Write-Host -ForegroundColor Yellow "============ Running pack with uglify (long running) ============"
$startMS = (Get-Date)
node ..\lib\main.js pack ./ -u
$endMS = (Get-Date)
Write-Host -ForegroundColor DarkYellow "=======> operation took +$((New-TimeSpan -Start $startMS -End $endMS).TotalMilliseconds)ms to run"
runTests "pack uglify"

Write-Host -ForegroundColor Yellow "============ Running unpack ============"
$startMS = (Get-Date)
node ..\lib\main.js unpack ./
$endMS = (Get-Date)
Write-Host -ForegroundColor DarkYellow "=======> operation took +$((New-TimeSpan -Start $startMS -End $endMS).TotalMilliseconds)ms to run"
runTests "unpack"

Write-Host -ForegroundColor Yellow "============ Complete ============"