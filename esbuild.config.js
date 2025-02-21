import { commonjs } from "@hyrious/esbuild-plugin-commonjs";
export default (serverless) => {
  return {
    base,
    bundle: true,
    minify: false,
    external: ['@aws-sdk/*', '!@aws-sdk/client-bedrock-runtime'],
    buildConcurrency: 3,
    sourcemap: true,
    plugins: [],
  }
}