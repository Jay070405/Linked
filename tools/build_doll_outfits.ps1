param([string]$Blender = 'E:/SteamLibrary/steamapps/common/Blender/blender.exe')
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
Push-Location $project
try {
    & $Blender --background --python tools/build_doll_outfits.py
    if ($LASTEXITCODE -ne 0) { throw 'Doll outfit export failed' }
    Push-Location app
    try {
        foreach ($outfit in @('cat-ear','beret','bunny')) {
            & npx --no-install gltf-transform optimize "../design/office3d/companions/$outfit-doll-raw.glb" "public/assets/office3d/plush-doll-$outfit.glb" --compress meshopt --texture-compress webp --texture-size 2048 --simplify false --join false --flatten false --instance false --prune false --palette false
            if ($LASTEXITCODE -ne 0) { throw 'Doll outfit web optimization failed' }
        }
    } finally { Pop-Location }
} finally { Pop-Location }
