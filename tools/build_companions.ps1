param([string]$Blender = 'E:/SteamLibrary/steamapps/common/Blender/blender.exe')
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
Push-Location $project
try {
    & $Blender --background --python tools/build_companions.py
    if ($LASTEXITCODE -ne 0) { throw 'Companion rig export failed' }
    Push-Location app
    try {
        foreach ($asset in @(@('kitten','kitten'), @('doll','plush-doll'))) {
            & npx --no-install gltf-transform optimize "../design/office3d/companions/$($asset[0])-raw.glb" "public/assets/office3d/$($asset[1]).glb" --compress meshopt --texture-compress webp --texture-size 2048 --simplify false --join false --flatten false --instance false --prune false --palette false
            if ($LASTEXITCODE -ne 0) { throw 'Companion web optimization failed' }
        }
    } finally { Pop-Location }
} finally { Pop-Location }
