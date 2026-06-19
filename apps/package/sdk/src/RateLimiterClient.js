import axios from 'axios';
import fs from 'fs';
import path from 'path';

let autoProjectName = 'Unknown Project';
try {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name) {
            autoProjectName = pkg.name;
        }
    }
} catch (e) {
}

export class RateLimiterClient {
    constructor({ serviceUrl, apiKey, timeout = 3000 }) {
        this.serviceUrl = serviceUrl;
        this.apiKey = apiKey;
        this.http = axios.create({
            baseURL: serviceUrl,
            timeout
        });
    }

    async check(request = {}) {
        try {
            const response = await this.http.post('/api/check', request, {
                headers: { 
                    'x-api-key': this.apiKey,
                    'x-client-name': autoProjectName
                },
            });
            return response.data;
        } catch (err) {
            if (err.response) {
                return err.response.data;
            }
            throw err;
        }
    }
}