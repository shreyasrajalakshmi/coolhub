/** Friendly device + browser label from the user agent, e.g. "Android Mobile · Chrome". */
export function describeDevice(ua = typeof navigator === "undefined" ? "" : navigator.userAgent, touchPoints = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints): string {
  let device = "Unknown device";
  if (/iPhone|iPod/i.test(ua)) device = "iPhone";
  else if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && touchPoints > 1)) device = "iPad"; // iPadOS pretends to be a Mac
  else if (/Android/i.test(ua)) device = /Mobile/i.test(ua) ? "Android Mobile" : "Android Tablet";
  else if (/Windows/i.test(ua)) device = "Windows PC";
  else if (/Macintosh|Mac OS X/i.test(ua)) device = "Mac"; // the user agent can't tell a MacBook from an iMac
  else if (/CrOS/i.test(ua)) device = "Chromebook";
  else if (/Linux|X11/i.test(ua)) device = "Linux PC";

  let browser = "";
  if (/EdgA?\/|Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/FxiOS|Firefox/i.test(ua)) browser = "Firefox";
  else if (/CriOS|Chrome/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua)) browser = "Safari";
  return browser ? `${device} · ${browser}` : device;
}
