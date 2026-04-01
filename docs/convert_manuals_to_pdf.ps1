$ErrorActionPreference = "Stop"

$files = @(
    "C:\Users\USER\Desktop\EPSI HL\docs\manuales\Manual_Tecnico_Sistema_IRIS.docx",
    "C:\Users\USER\Desktop\EPSI HL\docs\manuales\Manual_de_Usuario_Sistema_IRIS.docx"
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
    foreach ($file in $files) {
        $pdf = [System.IO.Path]::ChangeExtension($file, ".pdf")
        $document = $word.Documents.Open($file)
        $document.SaveAs([ref] $pdf, [ref] 17)
        $document.Close()
        Write-Output $pdf
    }
}
finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
