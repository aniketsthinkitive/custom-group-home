import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateIncidentStatusMutation } from "../../../../sdk/@tanstack/react-query.gen";

export const useAcknowledgeIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateIncidentStatusMutation(),

    onSuccess: async (_data, _variables) => {
      // Only invalidate the list incidents query to refetch all incidents
      // This avoids calling multiple single incident APIs
      await queryClient.invalidateQueries({
        queryKey: [{ _id: "listIncidents" }],
      });
    },
  });
};
