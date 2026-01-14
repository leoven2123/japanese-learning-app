// Test if imports work
export default async function handler(req: any, res: any) {
  try {
    // Step 1: Test basic imports
    const step1 = "Basic imports OK";

    // Step 2: Test express
    const express = await import("express");
    const step2 = "Express import OK";

    // Step 3: Test trpc
    const trpc = await import("@trpc/server/adapters/express");
    const step3 = "tRPC import OK";

    // Step 4: Test shared const
    const shared = await import("../shared/const");
    const step4 = `Shared import OK: COOKIE_NAME=${shared.COOKIE_NAME}`;

    // Step 5: Test server routers
    const routers = await import("../server/routers");
    const step5 = "Routers import OK";

    res.status(200).json({
      ok: true,
      steps: [step1, step2, step3, step4, step5]
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message,
      stack: error.stack
    });
  }
}
