/* eslint-disable @typescript-eslint/no-unused-vars */
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { NextApiResponse } from 'next';
import { NextApiRequest } from 'next';
import { parseHTML } from 'linkedom';

export const config = {
  api: {
    // Disable body parsing (required for proxy)
    bodyParser: false,
  },
};

export interface Options {
  target: string;
}

export const proxyMiddleware = (req: NextApiRequest, res: NextApiResponse, options: Options) => createProxyMiddleware({
  target: options.target,
  changeOrigin: true,
  pathRewrite: {
    '^/api/proxy': '', // Remove /api/proxy prefix
  },
  secure: false,
  selfHandleResponse: true,

  on: {
    proxyRes: responseInterceptor(async (responseBuffer, proxyRes, _req, _res) => {
      const response = responseBuffer.toString('utf8'); // convert buffer to string

      if (proxyRes.headers['content-type']?.includes('text/html')) {
        const { document } = parseHTML(response);
        const body = document.body;
        const script = document.createElement('script');
        script.textContent = `
          console.log('Hello, World!');
        `;
        body.appendChild(script);
        return document.toString();
      }

      return response;
    }),
  }
})(req, res);