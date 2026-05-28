Add-Type -TypeDefinition @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class MouseHook {
  private const int WH_MOUSE_LL = 14;
  private const int WM_LBUTTONDOWN = 0x0201;
  private const int WM_RBUTTONDOWN = 0x0204;
  private const int WM_MBUTTONDOWN = 0x0207;
  private static LowLevelMouseProc _proc = HookCallback;
  private static IntPtr _hookID = IntPtr.Zero;

  public static void Main() {
    _hookID = SetHook(_proc);
    Application.Run();
    UnhookWindowsHookEx(_hookID);
  }

  private static IntPtr SetHook(LowLevelMouseProc proc) {
    using (Process curProcess = Process.GetCurrentProcess())
    using (ProcessModule curModule = curProcess.MainModule) {
      return SetWindowsHookEx(WH_MOUSE_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
    }
  }

  private delegate IntPtr LowLevelMouseProc(int nCode, IntPtr wParam, IntPtr lParam);

  private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
    if (nCode >= 0) {
      int message = wParam.ToInt32();
      string button = null;
      if (message == WM_LBUTTONDOWN) button = "left";
      if (message == WM_RBUTTONDOWN) button = "right";
      if (message == WM_MBUTTONDOWN) button = "middle";

      if (button != null) {
        MSLLHOOKSTRUCT hookStruct = (MSLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(MSLLHOOKSTRUCT));
        Console.WriteLine("{\"type\":\"click\",\"button\":\"" + button + "\",\"x\":" + hookStruct.pt.x + ",\"y\":" + hookStruct.pt.y + "}");
        Console.Out.Flush();
      }
    }

    return CallNextHookEx(_hookID, nCode, wParam, lParam);
  }

  [StructLayout(LayoutKind.Sequential)]
  private struct POINT {
    public int x;
    public int y;
  }

  [StructLayout(LayoutKind.Sequential)]
  private struct MSLLHOOKSTRUCT {
    public POINT pt;
    public uint mouseData;
    public uint flags;
    public uint time;
    public IntPtr dwExtraInfo;
  }

  [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelMouseProc lpfn, IntPtr hMod, uint dwThreadId);

  [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  [return: MarshalAs(UnmanagedType.Bool)]
  private static extern bool UnhookWindowsHookEx(IntPtr hhk);

  [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

  [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  private static extern IntPtr GetModuleHandle(string lpModuleName);
}
"@ -ReferencedAssemblies System.Windows.Forms

[MouseHook]::Main()
