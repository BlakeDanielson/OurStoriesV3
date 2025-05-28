/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'utfs.io', // UploadThing
      'replicate.delivery', // Replicate
      'oaidalleapiprodscus.blob.core.windows.net', // DALL-E
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig 