param([string]$Blender = 'E:/SteamLibrary/steamapps/common/Blender/blender.exe')
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
Push-Location $project
try {
    & $Blender --background --python tools/build_office.py
    if ($LASTEXITCODE -ne 0) { throw 'Blender export failed' }
    Push-Location app
    try {
        & npx gltf-transform optimize ../design/office3d/studio-raw.glb public/assets/office3d/studio.glb --compress meshopt --texture-compress webp --texture-size 2048 --simplify false --join false --flatten false --instance false --prune false --palette false
        if ($LASTEXITCODE -ne 0) { throw 'Web model optimization failed' }
    } finally { Pop-Location }
} finally { Pop-Location }
