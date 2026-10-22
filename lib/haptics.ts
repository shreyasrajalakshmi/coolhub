import { isNative } from "./native";

type Kind = "light" | "medium" | "error";

let plugin: Promise<typeof import("@capacitor/haptics")> | null = null;

/** Tiny tactile response for key presses: native haptics in the Android app, a short vibration on the web. */
export function haptic(kind: Kind = "light"): void {
  try {
    if (isNative()) {
      plugin ??= import("@capacitor/haptics");
      void plugin.then(({ Haptics, ImpactStyle, NotificationType }) => {
        if (kind === "error") return Haptics.notification({ type: NotificationType.Error });
        return Haptics.impact({ style: kind === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
      });
    } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(kind === "error" ? [30, 40, 30] : kind === "medium" ? 16 : 9);
    }
  } catch {
    /* haptics are a nicety, never an error */
  }
}
