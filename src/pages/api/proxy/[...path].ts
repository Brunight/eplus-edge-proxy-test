import type { NextApiRequest, NextApiResponse } from 'next';
import { proxyMiddleware, config } from '@/lib/proxy-middleware';
import { Octokit } from "octokit";
import { GetResponseDataTypeFromEndpointMethod } from "@octokit/types";



const cache = new Map<string, Record<string, string>>();


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let storeCookie: string | undefined = req.query.store as string;
  storeCookie ??=  req.cookies['store'];

  console.log({storeCookie, cookie: req.cookies['store']});

  if (!storeCookie) {
    return res.status(401).json({ error: 'Missing store data' });
  }
  
  res.setHeader('Set-Cookie', `store=${storeCookie}; Path=/`);

  let content = cache.get(storeCookie);

  if (!content) {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    
    type GetRepoContent = GetResponseDataTypeFromEndpointMethod<
    typeof octokit.rest.repos.getContent
    >;
    type RepoContentFile = Extract<GetRepoContent, { type: "file" }>;
    

    const isFile = (
      data: GetRepoContent,
    ): data is RepoContentFile => !Array.isArray(data) && data.type === "file";

    const response = await octokit.rest.repos.getContent({
      owner: 'agencia-e-plus',
      repo: storeCookie,
      path: 'eplus-edge/eplus-edge.json',
    });
    
    if (!isFile(response.data)) {
      return res.status(404).json({ error: 'File not found' });
    }

    content = JSON.parse(atob(response.data.content)) as Record<string, string>;
    cache.set(storeCookie, content);
  }

  console.log({content});

  const url = content.publicURL.startsWith('http') ? content.publicURL : `https://${content.publicURL}`;
  return proxyMiddleware(req, res, { target: url });
}

export { config }; 