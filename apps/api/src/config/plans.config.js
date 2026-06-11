import dotenv from 'dotenv'
dotenv.config()

export const PLANS = {
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise'
};

export const ALGORITHMS = {
    TOKEN_BUCKET: 'token_bucket',
    SLIDING_WINDOW:'sliding_window',
    FIXED_WINDOW: 'fixed_window'
};

export const planLimits = {
    [PLANS.FREE]:{
        maxRequests: parseInt(process.env.DEFAULT_FREE_LIMIT || '100'),
        windowMs: parseInt(process.env.DEFAULT_WINDOW_MS || '60000')
    },
    [PLANS.PRO]:{
        maxRequests:parseInt(process.env.DEFAULT_PRO_LIMIT || '1000'),
        windowMs:parseInt(process.env.DEFAULT_WINDOW_MS || '60000')
    },
    [PLANS.ENTERPRISE]:{
        maxRequests: parseInt(process.env.DEFAULT_ENTERPRISE_LIMIT || '10000'),
        windowMs: parseInt(process.env.DEFAULT_WINDOW_MS || '60000')
    }
};