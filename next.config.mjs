/** @type {import('next').NextConfig} */
export default {
  serverExternalPackages: ['mysql2', 'bcryptjs'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
