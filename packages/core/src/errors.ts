/**
 * Error Taxonomy for Computer Use operations.
 * Avoids opaque "operation_failed" errors by classifying precise failure causes.
 */

export class ComputerUseError extends Error {
  readonly code: string;
  readonly recoverable: boolean;
  readonly actionSent: boolean;

  constructor(message: string, code = "operation_failed", recoverable = false, actionSent = false) {
    super(message);
    this.name = "ComputerUseError";
    this.code = code;
    this.recoverable = recoverable;
    this.actionSent = actionSent;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      recoverable: this.recoverable,
      action_sent: this.actionSent,
    };
  }
}

export class PermissionDeniedError extends ComputerUseError {
  constructor(message: string, permissionName?: string) {
    super(
      `Permission denied: ${message}${permissionName ? ` (required: ${permissionName})` : ""}`,
      "permission_denied",
      false,
      false
    );
    this.name = "PermissionDeniedError";
  }
}

export class ElementNotFoundError extends ComputerUseError {
  constructor(identifier: string) {
    super(`Element not found: ${identifier}. Please re-observe the app state.`, "element_not_found", true, false);
    this.name = "ElementNotFoundError";
  }
}

export class StaleHandleError extends ComputerUseError {
  constructor(handleOrIndex: string | number, stateId?: string) {
    super(
      `Stale element handle: "${handleOrIndex}" is no longer valid${stateId ? ` for state ${stateId}` : ""}. The UI has changed.`,
      "stale_handle",
      true,
      false
    );
    this.name = "StaleHandleError";
  }
}

export class WindowNotFoundError extends ComputerUseError {
  constructor(windowIdentifier: string | number) {
    super(`Window not found: ${windowIdentifier}`, "window_not_found", true, false);
    this.name = "WindowNotFoundError";
  }
}

export class AppNotFoundError extends ComputerUseError {
  constructor(appName: string) {
    super(`Application not found or not running: ${appName}`, "app_not_found", true, false);
    this.name = "AppNotFoundError";
  }
}

export class TimeoutError extends ComputerUseError {
  constructor(action: string, timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms: ${action}`, "timeout", true, false);
    this.name = "TimeoutError";
  }
}

export class UnsupportedPlatformError extends ComputerUseError {
  constructor(feature: string, platform: string) {
    super(`Feature "${feature}" is not supported on platform "${platform}".`, "unsupported_platform", false, false);
    this.name = "UnsupportedPlatformError";
  }
}

export class InvalidArgumentError extends ComputerUseError {
  constructor(message: string) {
    super(`Invalid argument: ${message}`, "invalid_argument", false, false);
    this.name = "InvalidArgumentError";
  }
}

export class HelperUnavailableError extends ComputerUseError {
  constructor(message: string) {
    super(`Desktop helper unavailable: ${message}`, "helper_unavailable", true, false);
    this.name = "HelperUnavailableError";
  }
}

export class AmbiguousElementError extends ComputerUseError {
  constructor(message: string, readonly candidates?: any[]) {
    super(`Ambiguous element: ${message}`, "ambiguous_element", true, false);
    this.name = "AmbiguousElementError";
  }
}
