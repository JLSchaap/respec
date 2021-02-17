// @ts-check
/**
 * This module adds a `respec` object to the `document` with the following
 * readonly properties:
 *  - version: returns version of ReSpec Script.
 *  - ready: returns a promise that settles when ReSpec finishes processing.
 *
 * This module also adds the legacy `document.respecIsReady` property for
 * backward compatibility. It is now an alias to `document.respec.ready`.
 */
import { showWarning } from "../core/utils.js";
import { sub } from "./pubsubhub.js";

export const name = "core/respec-global";

class ReSpec extends EventTarget {
  constructor() {
    super();
    /** @type {Promise<void>} */
    this._respecDonePromise = new Promise(resolve => {
      sub("end-all", resolve, { once: true });
    });
    sub("error", rsError => {
      console.error(rsError, Object.fromEntries(Object.entries(rsError)));
      this.dispatchEvent(new CustomEvent("error", { detail: rsError }));
    });
    sub("warn", rsError => {
      console.warn(rsError, Object.fromEntries(Object.entries(rsError)));
      this.dispatchEvent(new CustomEvent("warning", { detail: rsError }));
    });
  }

  get version() {
    return window.respecVersion;
  }

  get ready() {
    return this._respecDonePromise;
  }
}

export function init() {
  const respec = new ReSpec();
  Object.defineProperty(document, "respec", { value: respec });
  document.dispatchEvent(new CustomEvent("respec-start"));

  let respecIsReadyWarningShown = false;
  Object.defineProperty(document, "respecIsReady", {
    get() {
      if (!respecIsReadyWarningShown) {
        const msg =
          "`document.respecIsReady` is deprecated and will be removed in a future release.";
        const hint = "Use `document.respec.ready` instead.";
        showWarning(msg, name, { hint });
        respecIsReadyWarningShown = true;
      }
      return document.respec.ready;
    },
  });
}
