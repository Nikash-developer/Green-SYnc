// Wrap the entire import in a try-catch to prevent FUNCTION_INVOCATION_FAILED
let app: any;

try {
    const serverModule = await import('../app_server');
    app = serverModule.default;
} catch (err) {
    console.error("FATAL: Failed to import server module:", err);
    const express = (await import('express')).default;
    app = express();
}

// Add a super-simple diagnostic route that bypasses the main app
app.get('/api/debug-status', (req: any, res: any) => {
    res.json({ status: 'API Entry point reached', time: new Date().toISOString() });
});

export default app;
