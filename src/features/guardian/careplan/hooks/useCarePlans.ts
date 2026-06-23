import { useQuery } from "@tanstack/react-query";
import { listResidentsOptions } from "../../../../sdk/@tanstack/react-query.gen";
import type { CarePlan } from "../types/carePlan.types";

export type CarePlansQueryResult = {
    carePlans: CarePlan[];
    pagination: { total_records: number; total_pages: number; page: number; size: number } | null;
};

function mapResultsToCarePlans(results: any[]): CarePlan[] {
    if (!Array.isArray(results)) return [];
    return results.map((item: any) => ({
        uuid: item.assignment_uuid,
        referral_number: item.referral_number || '',
        leadUuid: item.lead_uuid,
        residentName: item.resident_name,
        avatarUrl: item.avatar_url,
        groupHome:
            item.group_home?.name ??
            (typeof item.group_home === "string" ? item.group_home : null) ??
            item.group_home_name ??
            "—",
        createdAt: item.created_at,
        date:
            item.check_in_date ||
            item.assigned_at ||
            item.created_at ||
            null,
        firstName: item.lead?.user?.first_name || item.first_name || item.resident_name?.split(" ")[0],
        lastName: item.lead?.user?.last_name || item.last_name || item.resident_name?.split(" ").slice(1).join(" "),
        dateOfBirth: item.lead?.date_of_birth || item.date_of_birth,
        gender: item.lead?.gender || item.gender,
        roomNumber: item.room_number || item.room?.number || item.lead?.room_number,
        status: item.status || item.assignment_status || item.lead?.status,
        guardian: item.lead?.guardian ? {
            firstName: item.lead.guardian.first_name,
            lastName: item.lead.guardian.last_name,
            phone: item.lead.guardian.phone,
            email: item.lead.guardian.email,
            relation: item.lead.guardian_relation
        } : undefined
    }));
}

export const useCarePlansQuery = (
    search?: string,
    groupHomeId?: string,
    page: number = 0,
    pageSize: number = 10,
    role?: string,
    userUuid?: string,
    status?: string,
) => {
    return useQuery({
        ...listResidentsOptions({
            query: {
                search: search || undefined,
                group_home: groupHomeId as any, // API accepts UUID string for group home filter
                page: page + 1, // API uses 1-based pagination
                size: pageSize,
                ...(role && { role }),
                ...(userUuid && { user_uuid: userUuid }),
                ...(status && { status }),
            },
        }),

        select: (response: any): CarePlansQueryResult => {
            const data = response?.data;
            const results = Array.isArray(data?.results) ? data.results : [];
            const pag = data?.pagination ?? null;
            return {
                carePlans: mapResultsToCarePlans(results),
                pagination: pag
                    ? {
                        total_records: (pag as any).total_records ?? 0,
                        total_pages: (pag as any).total_pages ?? 1,
                        page: (pag as any).page ?? 1,
                        size: (pag as any).size ?? pageSize,
                    }
                    : null,
            };
        },

        staleTime: 60_000,
    });
};
