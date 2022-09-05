import Bowser from "bowser"; // ES6 (and TypeScript with --esModuleInterop enabled)

class BowserSetUp {
  constructor() {
    const browser = Bowser.getParser(window.navigator.userAgent);
    document.documentElement.setAttribute(
      "data-browser",
      browser.getBrowserName()
    );
    document.documentElement.setAttribute("data-os", browser.getOSName());
    document.documentElement.setAttribute(
      "data-device",
      browser.getPlatformType()
    );

  }
}
export default BowserSetUp;
