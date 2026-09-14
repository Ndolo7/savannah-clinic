const isGithubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: isGithubPages ? '/savannah-clinic' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
