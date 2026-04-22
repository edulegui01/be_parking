param(
    [string]$FilePath,
    [string]$PrinterName
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class RawPrinter {
    [DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi)]
    public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint="ClosePrinter")]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="StartDocPrinterA", SetLastError=true)]
    public static extern int StartDocPrinter(IntPtr hPrinter, int level, ref DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint="EndDocPrinter")]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="StartPagePrinter")]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="EndPagePrinter")]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="WritePrinter", SetLastError=true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
}

[StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
public struct DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
}
"@

$bytes = [System.IO.File]::ReadAllBytes($FilePath)
$hPrinter = [IntPtr]::Zero

if (-not [RawPrinter]::OpenPrinter($PrinterName, [ref]$hPrinter, [IntPtr]::Zero)) {
    throw "No se pudo abrir la impresora: $PrinterName"
}

$docInfo = New-Object DOCINFOA
$docInfo.pDocName = "ESC/POS"
$docInfo.pOutputFile = $null
$docInfo.pDataType = "RAW"

[RawPrinter]::StartDocPrinter($hPrinter, 1, [ref]$docInfo) | Out-Null
[RawPrinter]::StartPagePrinter($hPrinter) | Out-Null

$ptr = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
[System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)

$written = 0
[RawPrinter]::WritePrinter($hPrinter, $ptr, $bytes.Length, [ref]$written) | Out-Null
[System.Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)

[RawPrinter]::EndPagePrinter($hPrinter) | Out-Null
[RawPrinter]::EndDocPrinter($hPrinter) | Out-Null
[RawPrinter]::ClosePrinter($hPrinter) | Out-Null

Write-Output "Impreso: $written bytes en $PrinterName"
