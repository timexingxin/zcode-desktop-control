import type { ActionResult, PlatformAdapter, Target } from "./types.js";
import { ComputerUseError } from "./errors.js";

export interface BatchActionStep {
  name: string;
  action: "click" | "setValue" | "typeText" | "pressKey" | "wait";
  target?: Target;
  value?: string;
  key?: string;
  modifiers?: string[];
  delayMs?: number;
}

export interface BatchExecutionReport {
  overall_success: boolean;
  total_steps: number;
  completed_steps: number;
  failed_step_index?: number;
  failed_action?: string;
  error?: string;
  step_results: ActionResult[];
}

/**
 * Executes a sequential batch of actions with fail-fast guarantee and exact step tracking.
 */
export async function executeSequentialBatch(
  adapter: PlatformAdapter,
  steps: BatchActionStep[]
): Promise<BatchExecutionReport> {
  const stepResults: ActionResult[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    try {
      let result: ActionResult;

      switch (step.action) {
        case "click":
          if (!step.target) throw new ComputerUseError("Target required for click step", "invalid_argument");
          result = await adapter.click(step.target);
          break;

        case "setValue":
          if (!step.target) throw new ComputerUseError("Target required for setValue step", "invalid_argument");
          result = await adapter.setValue(step.target, step.value ?? "");
          break;

        case "typeText":
          result = await adapter.typeText(step.value ?? "", undefined, step.target);
          break;

        case "pressKey":
          if (!step.key) throw new ComputerUseError("Key required for pressKey step", "invalid_argument");
          result = await adapter.pressKey(step.key, step.modifiers);
          break;

        case "wait":
          await new Promise((r) => setTimeout(r, step.delayMs ?? 500));
          result = {
            ok: true,
            action: "wait",
            action_sent: true,
            receipt: `Waited ${step.delayMs ?? 500}ms`,
          };
          break;

        default:
          throw new ComputerUseError(`Unknown batch action type: ${(step as any).action}`, "invalid_argument");
      }

      stepResults.push(result);

      if (!result.ok) {
        return {
          overall_success: false,
          total_steps: steps.length,
          completed_steps: i,
          failed_step_index: i,
          failed_action: step.name || step.action,
          error: result.error || "Step returned failed status",
          step_results: stepResults,
        };
      }
    } catch (err: any) {
      return {
        overall_success: false,
        total_steps: steps.length,
        completed_steps: i,
        failed_step_index: i,
        failed_action: step.name || step.action,
        error: err?.message || String(err),
        step_results: stepResults,
      };
    }
  }

  return {
    overall_success: true,
    total_steps: steps.length,
    completed_steps: steps.length,
    step_results: stepResults,
  };
}
