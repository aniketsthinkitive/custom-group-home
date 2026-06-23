import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listProvidersOptions,
  listProvidersQueryKey,
  createProviderMutation as createProviderMutationOptions,
  updateProviderMutation as updateProviderMutationOptions,
  deleteProviderMutation as deleteProviderMutationOptions,
} from "../../../sdk/@tanstack/react-query.gen";

// ─────────────────────────────────────────────────────────────────────────────
// useProvidersQuery
// Fetches paginated provider list filtered by leadUuid.
// Query is only enabled when leadUuid is provided.
// ─────────────────────────────────────────────────────────────────────────────

export function useProvidersQuery(leadUuid?: string, page: number = 1, size: number = 10) {
  return useQuery({
    ...listProvidersOptions({
      query: {
        ...(leadUuid ? { lead_uuid: leadUuid as any } : {}),
        page,
        size,
      },
    }),
    enabled: !!leadUuid,
    select: (data: any) => ({
      providers: data?.data?.results ?? [],
      pagination: data?.data?.pagination ?? null,
    }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useCreateProvider
// Creates a new provider.
// Invalidates the full providers list on success.
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    ...createProviderMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listProvidersQueryKey(),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateProvider
// Updates an existing provider by UUID.
// Invalidates the full providers list on success.
// ─────────────────────────────────────────────────────────────────────────────

export function useUpdateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateProviderMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listProvidersQueryKey(),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useDeleteProvider
// Soft-deletes a provider by UUID.
// Invalidates the full providers list on success.
// ─────────────────────────────────────────────────────────────────────────────

export function useDeleteProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    ...deleteProviderMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listProvidersQueryKey(),
      });
    },
  });
}
