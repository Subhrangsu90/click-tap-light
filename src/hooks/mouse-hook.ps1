Add-Type -TypeDefinition @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class InputHook {
  private const int WH_MOUSE_LL = 14;
  private const int WH_KEYBOARD_LL = 13;
  private const int WM_LBUTTONDOWN = 0x0201;
  private const int WM_RBUTTONDOWN = 0x0204;
  private const int WM_MBUTTONDOWN = 0x0207;
  private const int WM_KEYDOWN = 0x0100;
  private const int WM_SYSKEYDOWN = 0x0104;

  private static LowLevelMouseProc _mouseProc = MouseCallback;
  private static LowLevelKeyboardProc _keyboardProc = KeyboardCallback;
  private static IntPtr _mouseHookID = IntPtr.Zero;
  private static IntPtr _keyboardHookID = IntPtr.Zero;

  public static void Main() {
    _mouseHookID = SetMouseHook(_mouseProc);
    _keyboardHookID = SetKeyboardHook(_keyboardProc);
    Application.Run();
    UnhookWindowsHookEx(_mouseHookID);
    UnhookWindowsHookEx(_keyboardHookID);
  }

  private static IntPtr SetMouseHook(LowLevelMouseProc proc) {
    using (Process curProcess = Process.GetCurrentProcess())
    using (ProcessModule curModule = curProcess.MainModule) {
      return SetWindowsHookEx(WH_MOUSE_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
    }
  }

  private static IntPtr SetKeyboardHook(LowLevelKeyboardProc proc) {
    using (Process curProcess = Process.GetCurrentProcess())
    using (ProcessModule curModule = curProcess.MainModule) {
      return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
    }
  }

  private delegate IntPtr LowLevelMouseProc(int nCode, IntPtr wParam, IntPtr lParam);
  private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

  private static IntPtr MouseCallback(int nCode, IntPtr wParam, IntPtr lParam) {
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

    return CallNextHookEx(_mouseHookID, nCode, wParam, lParam);
  }

  private static IntPtr KeyboardCallback(int nCode, IntPtr wParam, IntPtr lParam) {
    if (nCode >= 0) {
      int message = wParam.ToInt32();
      if (message == WM_KEYDOWN || message == WM_SYSKEYDOWN) {
        KBDLLHOOKSTRUCT hookStruct = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));
        Keys key = (Keys)hookStruct.vkCode;
        string displayKey = FormatKey(key);

        if (!IsModifier(key) && displayKey.Length > 0) {
          string combo = BuildCombo(displayKey);
          Console.WriteLine("{\"type\":\"shortcut\",\"keys\":\"" + JsonEscape(combo) + "\"}");
          Console.Out.Flush();
        }
      }
    }

    return CallNextHookEx(_keyboardHookID, nCode, wParam, lParam);
  }

  private static string BuildCombo(string key) {
    string combo = "";
    if (IsDown(Keys.ControlKey)) combo += "Ctrl + ";
    if (IsDown(Keys.Menu)) combo += "Alt + ";
    if (IsDown(Keys.ShiftKey)) combo += "Shift + ";
    if (IsDown(Keys.LWin) || IsDown(Keys.RWin)) combo += "Win + ";
    return combo + key;
  }

  private static bool IsModifier(Keys key) {
    return key == Keys.ControlKey || key == Keys.LControlKey || key == Keys.RControlKey ||
      key == Keys.Menu || key == Keys.LMenu || key == Keys.RMenu ||
      key == Keys.ShiftKey || key == Keys.LShiftKey || key == Keys.RShiftKey ||
      key == Keys.LWin || key == Keys.RWin;
  }

  private static bool IsDown(Keys key) {
    return (GetKeyState((int)key) & 0x8000) != 0;
  }

  private static string FormatKey(Keys key) {
    if (key >= Keys.A && key <= Keys.Z) return key.ToString();
    if (key >= Keys.D0 && key <= Keys.D9) return key.ToString().Substring(1);
    if (key >= Keys.NumPad0 && key <= Keys.NumPad9) return "Num " + key.ToString().Substring(6);
    if (key >= Keys.F1 && key <= Keys.F24) return key.ToString();
    if (key == Keys.Space) return "Space";
    if (key == Keys.Return) return "Enter";
    if (key == Keys.Escape) return "Esc";
    if (key == Keys.Back) return "Backspace";
    if (key == Keys.Delete) return "Delete";
    if (key == Keys.Insert) return "Insert";
    if (key == Keys.Tab) return "Tab";
    if (key == Keys.Home) return "Home";
    if (key == Keys.End) return "End";
    if (key == Keys.PageUp) return "Page Up";
    if (key == Keys.PageDown) return "Page Down";
    if (key == Keys.Left) return "Left";
    if (key == Keys.Right) return "Right";
    if (key == Keys.Up) return "Up";
    if (key == Keys.Down) return "Down";
    if (key == Keys.Oemcomma) return ",";
    if (key == Keys.OemPeriod) return ".";
    if (key == Keys.OemQuestion) return "/";
    if (key == Keys.OemSemicolon) return ";";
    if (key == Keys.OemQuotes) return "'";
    if (key == Keys.OemOpenBrackets) return "[";
    if (key == Keys.OemCloseBrackets) return "]";
    if (key == Keys.OemPipe) return "\\";
    if (key == Keys.OemMinus) return "-";
    if (key == Keys.Oemplus) return "=";
    return key.ToString();
  }

  private static string JsonEscape(string value) {
    return value.Replace("\\", "\\\\").Replace("\"", "\\\"");
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

  [StructLayout(LayoutKind.Sequential)]
  private struct KBDLLHOOKSTRUCT {
    public uint vkCode;
    public uint scanCode;
    public uint flags;
    public uint time;
    public IntPtr dwExtraInfo;
  }

  [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelMouseProc lpfn, IntPtr hMod, uint dwThreadId);

  [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

  [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  [return: MarshalAs(UnmanagedType.Bool)]
  private static extern bool UnhookWindowsHookEx(IntPtr hhk);

  [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

  [DllImport("user32.dll")]
  private static extern short GetKeyState(int nVirtKey);

  [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  private static extern IntPtr GetModuleHandle(string lpModuleName);
}
"@ -ReferencedAssemblies System.Windows.Forms

[InputHook]::Main()
