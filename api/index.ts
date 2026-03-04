import express from 'express';

const app = express();

app.get('/api/health', (req, res) => {
    res.json({ status: 'Minimal API is working', time: new Date().toISOString() });
});

// For testing if app_server can at least be parsed
app.get('/api/check-import', async (req, res) => {
    try {
        const serverApp = await import('../app_server');
        res.json({ status: 'app_server imported successfully', hasDefaultExport: !!serverApp.default });
    } catch (err) {
        res.status(500).json({ error: 'Failed to import app_server', details: (err as Error).message });
    }
});

export default app;
