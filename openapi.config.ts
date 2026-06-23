import { defineConfig } from '@hey-api/openapi-ts';
import { loadEnv } from 'vite'

const env = loadEnv('development', process.cwd(), '')

export default defineConfig({
  input: `${env.VITE_API_BASE_URL}/api/schema/`, // ./apiData.yaml
  output: "./src/sdk",
  plugins: [
    {
      name: "@hey-api/schemas",
      type: "json",
    },
    {
      name: "@tanstack/react-query",
      // Query options - generates functions like getPetByIdOptions()
      queryOptions: true,
      // Query keys - generates functions like getPetByIdQueryKey() for cache management
      queryKeys: true,
      // Mutation options - generates functions like addPetMutation() for POST/PUT/DELETE
      mutationOptions: true,
      // Infinite query options - for paginated endpoints
      infiniteQueryOptions: true,
      // Infinite query keys - for infinite query cache management
      infiniteQueryKeys: true,
    },
    "@hey-api/client-axios",
  ],
});

