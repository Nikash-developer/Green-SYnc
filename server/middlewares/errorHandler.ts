export const errorHandler = (err: any, req: any, res: any, next: any) => {
    console.error(`[Error] ${err.stack}`);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
