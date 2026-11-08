param([string]$Destination = (Join-Path $PSScriptRoot 'build'))
$ErrorActionPreference = 'Stop'
$stageRoot = [IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $stageRoot) { throw "Destination already exists: $stageRoot. Choose a new build directory." }
$stageSource = Join-Path $stageRoot 'source'
git clone https://github.com/egoist/mygo-music.git $stageSource
if ($LASTEXITCODE -ne 0) { throw 'Clone failed' }
git -C $stageSource checkout 1af0d8efd77fdf630c27cfc635f12e9cb089ce10
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
git -C $stageSource apply --check (Join-Path $PSScriptRoot 'stage-api.patch')
if ($LASTEXITCODE -ne 0) { throw 'Patch check failed' }
git -C $stageSource apply (Join-Path $PSScriptRoot 'stage-api.patch')
if ($LASTEXITCODE -ne 0) { throw 'Patch failed' }
$env:CGO_ENABLED = '0'
$stageFlags = "-s -w -H=windowsgui -X 'github.com/egoist/mygo.packageName=MyGo Music' -X github.com/egoist/mygo.packageVersion=0.1.23 -X github.com/egoist/mygo.packageIdentifier=dev.egoist.music -X github.com/egoist/mygo.production=1"
go -C $stageSource build -trimpath -tags mygo_noinspector -ldflags $stageFlags -o (Join-Path $stageRoot 'MyGo Music Stage.exe') .
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
Write-Output "Built: $(Join-Path $stageRoot 'MyGo Music Stage.exe')"
