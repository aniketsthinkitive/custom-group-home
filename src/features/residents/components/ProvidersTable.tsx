import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CustomDialog from "../../../components/custom-dialog/custom-dialog";
import CustomInput from "../../../components/custom-input/custom-input";

import Paginator from "../../../components/pagination/pagination";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import OverflowTooltip from "../../../components/overflow-tooltip/OverflowTooltip";
import { primaryTextCss } from "../../../components/common-table/widgets/common-table-widgets";
import TableSkeleton from "../../../components/common-table/TableSkeleton";
import { formatPhone } from "../../../utils";
import {
  useProvidersQuery,
  useCreateProvider,
  useUpdateProvider,
  useDeleteProvider,
} from "../../providers/hooks/useProviders";
import { usePermission } from "../../../hooks/usePermission";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProviderFormData = {
  name: string;
  specialty: string;
  email: string;
  address: string;
  phone: string;
  fax: string;
};


const tableHeaders = [
  { id: "srNo",      label: "Sr. no",       width: { xs: "70px",  lg: "90px"  }, minWidth: { xs: "60px",  lg: "90px"  }, align: "center" as const },
  { id: "name",      label: "Provider Name", width: { xs: "180px", lg: "220px" }, minWidth: { xs: "160px", lg: "220px" }, align: "left"   as const },
  { id: "specialty", label: "Specialty",     width: { xs: "150px", lg: "190px" }, minWidth: { xs: "130px", lg: "190px" }, align: "left"   as const },
  { id: "email",     label: "Email",         width: { xs: "200px", lg: "240px" }, minWidth: { xs: "180px", lg: "240px" }, align: "left"   as const },
  { id: "address",   label: "Address",       width: { xs: "180px", lg: "220px" }, minWidth: { xs: "160px", lg: "220px" }, align: "left"   as const },
  { id: "phone",     label: "Phone Number",  width: { xs: "140px", lg: "170px" }, minWidth: { xs: "120px", lg: "170px" }, align: "left"   as const },
  { id: "fax",       label: "Fax Number",    width: { xs: "140px", lg: "170px" }, minWidth: { xs: "120px", lg: "170px" }, align: "left"   as const },
  { id: "action",    label: "Action",        width: { xs: "70px",  lg: "80px"  }, minWidth: { xs: "60px",  lg: "80px"  }, align: "center" as const },
];

const emptyForm: ProviderFormData = { name: "", specialty: "", email: "", address: "", phone: "", fax: "" };

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  leadUuid?: string;
  disabledReason?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

const ProvidersTable: React.FC<Props> = ({ leadUuid, disabledReason }) => {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission("providers.create");
  const canEdit   = hasPermission("providers.edit");
  const canDelete = hasPermission("providers.delete");
  const isReadOnly = !!disabledReason;

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage]                         = useState(0);
  const [recordsPerPage, setRecordsPerPage]     = useState(5);

  // ── Dialog / Menu state ─────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen]             = useState(false);
  const [editingUuid, setEditingUuid]            = useState<string | null>(null);
  const [form, setForm]                         = useState<ProviderFormData>(emptyForm);
  const [errors, setErrors]                     = useState<Partial<Record<keyof ProviderFormData, string>>>({});
  const [menuAnchor, setMenuAnchor]             = useState<null | HTMLElement>(null);
  const [menuRowUuid, setMenuRowUuid]            = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetUuid, setDeleteTargetUuid]   = useState<string | null>(null);
  const [snackbar, setSnackbar]                   = useState({ isOpen: false, message: "", status: "success" as "success" | "error" });


  // ── API hooks ───────────────────────────────────────────────────────────────
  const { data, isLoading }   = useProvidersQuery(leadUuid, page + 1, recordsPerPage);
  const createMutation        = useCreateProvider();
  const updateMutation        = useUpdateProvider();
  const deleteMutation        = useDeleteProvider();

  const providers             = data?.providers ?? [];
  const pagedProviders        = providers; // Data is already paginated by backend (mostly)

  // Pagination info from backend response (fallback to local calculation)
  const paginationInfo = useMemo(() => {
    const rawPagination = data?.pagination as any;
    if (rawPagination) {
      return {
        totalElements: rawPagination.total_records || rawPagination.totalElements || rawPagination.totalRecords || 0,
        totalPages: rawPagination.total_pages || rawPagination.totalPages || 0,
        currentPage: page,
        pageSize: rawPagination.size || recordsPerPage,
      };
    }
    // Fallback if pagination is missing from API for some reason
    const totalElements = providers.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / recordsPerPage));
    return {
      totalElements,
      totalPages,
      currentPage: Math.min(page, Math.max(0, totalPages - 1)),
      pageSize: recordsPerPage,
    };
  }, [data, page, recordsPerPage, providers.length]);

  const safePage = paginationInfo.currentPage;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ── Yup-style validation schema ───────────────────────────────────────────
  const providerSchema = {
    name: (v: string) => (!v.trim() ? "Provider name is required" : ""),
    email: (v: string) => {
      const t = v.trim();
      if (!t) return "";
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(t))
        return "Please enter a valid email address";
      const dup = providers.some(
        (p: any) => p.email && p.email.toLowerCase() === t.toLowerCase() && p.uuid !== editingUuid
      );
      return dup ? "Email already exists" : "";
    },
    phone: (v: string) => {
      const d = v.replace(/\D/g, "");
      return d && d.length !== 10 ? "Enter a valid 10-digit phone number" : "";
    },
    fax: (v: string) => {
      const d = v.replace(/\D/g, "");
      return d && d.length !== 10 ? "Enter a valid 10-digit fax number" : "";
    },
  };

  const validate = () => {
    const next: Partial<Record<keyof ProviderFormData, string>> = {};
    (Object.keys(providerSchema) as Array<keyof typeof providerSchema>).forEach((key) => {
      const err = providerSchema[key]((form as any)[key] ?? "");
      if (err) next[key as keyof ProviderFormData] = err;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateField = (field: keyof ProviderFormData, value: string) => {
    const fn = (providerSchema as any)[field];
    if (!fn) return;
    const err = fn(value);
    setErrors((prev) => ({ ...prev, [field]: err || undefined }));
  };

  // ── Dialog handlers ─────────────────────────────────────────────────────────
  const openAddDialog = () => {
    setEditingUuid(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  // Listens for the "+ Add Provider" header button.
  // ResidentProfileSectionHeader fires: document.dispatchEvent(new CustomEvent("resident:new-provider"))
  // Note: permission guard is already on the header button itself — only block if read-only here.
  useEffect(() => {
    const handler = () => {
      if (isReadOnly) return;
      setEditingUuid(null);
      setForm(emptyForm);
      setErrors({});
      setDialogOpen(true);
    };
    document.addEventListener("resident:new-provider", handler);
    return () => document.removeEventListener("resident:new-provider", handler);
  }, [isReadOnly]);

  const openEditDialog = (row: any) => {
    setEditingUuid(row.uuid);
    setForm({
      name:      row.name ?? "",
      specialty: row.specialty ?? "",
      email:     row.email ?? "",
      address:   row.address ?? "",
      phone:     row.phone_number ?? "",
      fax:       row.fax_number ?? "",
    });
    setErrors({});
    setDialogOpen(true);
    closeMenu();
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUuid(null);
    setForm(emptyForm);
    setErrors({});
    createMutation.reset();
    updateMutation.reset();
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!validate() || isSaving) return;

    const body = {
      name:         form.name.trim(),
      specialty:    form.specialty.trim() || null,
      email:        form.email.trim() || null,
      address:      form.address.trim() || null,
      phone_number: form.phone.replace(/\D/g, "") || null,
      fax_number:   form.fax.replace(/\D/g, "") || null,
      ...(leadUuid ? { lead_uuid: leadUuid } : {}),
    };

    const handleError = (err: any, defaultMsg: string) => {
      const respData = err?.response?.data;
      if (respData) {
        if (respData.email || respData.name || respData.specialty || respData.phone_number || respData.fax_number || respData.address) {
          setErrors(prev => ({
            ...prev,
            ...(respData.email && { email: Array.isArray(respData.email) ? respData.email[0] : respData.email }),
            ...(respData.name && { name: Array.isArray(respData.name) ? respData.name[0] : respData.name }),
            ...(respData.specialty && { specialty: Array.isArray(respData.specialty) ? respData.specialty[0] : respData.specialty }),
            ...(respData.phone_number && { phone: Array.isArray(respData.phone_number) ? respData.phone_number[0] : respData.phone_number }),
            ...(respData.fax_number && { fax: Array.isArray(respData.fax_number) ? respData.fax_number[0] : respData.fax_number }),
            ...(respData.address && { address: Array.isArray(respData.address) ? respData.address[0] : respData.address }),
          }));
          return;
        }
      }
      setSnackbar({ isOpen: true, message: respData?.message || respData?.detail || defaultMsg, status: "error" });
    };

    if (editingUuid) {
      updateMutation.mutate(
        { path: { uuid: editingUuid }, body } as any,
        {
          onSuccess: () => { closeDialog(); setSnackbar({ isOpen: true, message: "Provider updated successfully", status: "success" }); },
          onError:   (err: any) => handleError(err, "Failed to update provider"),
        }
      );
    } else {
      createMutation.mutate(
        { body } as any,
        {
          onSuccess: () => { closeDialog(); setSnackbar({ isOpen: true, message: "Provider added successfully", status: "success" }); },
          onError:   (err: any) => handleError(err, "Failed to add provider"),
        }
      );
    }
  };

  // ── Menu helpers ──────────────────────────────────────────────────────────────
  const openMenu  = (e: React.MouseEvent<HTMLElement>, uuid: string) => { setMenuAnchor(e.currentTarget); setMenuRowUuid(uuid); };
  const closeMenu = () => { setMenuAnchor(null); setMenuRowUuid(null); };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDeleteClick = (uuid: string) => {
    setDeleteTargetUuid(uuid);
    setDeleteConfirmOpen(true);
    closeMenu();
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetUuid) return;
    deleteMutation.mutate(
      { path: { uuid: deleteTargetUuid } } as any,
      {
        onSuccess: () => { setSnackbar({ isOpen: true, message: "Provider deleted successfully", status: "success" }); setDeleteConfirmOpen(false); setDeleteTargetUuid(null); },
        onError:   (err: any) => { setSnackbar({ isOpen: true, message: err?.response?.data?.message ?? "Failed to delete provider", status: "error" }); setDeleteConfirmOpen(false); },
      }
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  // While the providers API is loading, show the shared table skeleton
  // instead of a spinner so the layout matches the populated table.
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          width: "100%",
          border: "1px solid #E3ECEF",
          borderRadius: "8px",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        <TableSkeleton
          headers={tableHeaders.map((h) => ({
            id: h.id,
            label: h.label,
            width: h.width.lg,
          }))}
          rowCount={6}
          hasCheckbox={false}
          hasAvatar={false}
          hasActions={false}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        width: "100%",
        border: "1px solid #E3ECEF",
        borderRadius: "8px",
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      {/* ── Table ── */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "visible", display: "flex", flexDirection: "column", width: "100%", maxWidth: "100%" }}>
        <TableContainer
          sx={{
            flex: 1, minHeight: 0, overflowY: "auto", overflowX: "auto",
            width: "100%", maxWidth: "100%", border: "none", borderRadius: 0,
            backgroundColor: "#FFFFFF", position: "relative",
            WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y",
            scrollbarWidth: "thin", scrollbarColor: "#D1D5DB #F3F4F6", scrollBehavior: "smooth",
            "&::-webkit-scrollbar": { width: "6px", height: "6px", display: "block" },
            "&::-webkit-scrollbar-track": { backgroundColor: "#F3F4F6" },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "#D1D5DB", borderRadius: "3px", "&:hover": { backgroundColor: "#9CA3AF" } },
            "& .MuiTable-root": { borderCollapse: "separate", borderSpacing: 0, width: "100%", display: "table", tableLayout: "auto" },
            "& .MuiTableHead-root .MuiTableCell-root": {
              height: { xs: "40px", sm: "42px", md: "44px" },
              padding: { xs: "8px 8px", sm: "8px 12px", md: "8px 14px", lg: "8px 16px" },
              backgroundColor: "#F2F7FA !important", borderBottom: "1px solid #E3ECEF",
              color: "#30353A", position: "sticky", top: 0, zIndex: 10,
              whiteSpace: "nowrap", boxSizing: "border-box", flexShrink: 0,
            },
            "& .MuiTableBody-root": {
              "& .MuiTableRow-root": { "&:hover": { backgroundColor: "rgba(0,0,0,0.01)" } },
              "& .MuiTableCell-root": {
                borderBottom: "1px solid #ECEFF4", verticalAlign: "middle",
                padding: { xs: "8px 8px", sm: "8px 12px", md: "8px 14px", lg: "8px 16px" },
                whiteSpace: "nowrap", boxSizing: "border-box", minWidth: "fit-content",
              },
            },
          }}
        >
          <Table stickyHeader aria-label="providers table" sx={{ tableLayout: "auto", backgroundColor: "#FFFFFF" }}>
            <TableHead>
              <TableRow>
                {tableHeaders.map((h) => (
                  <TableCell key={h.id} align={h.align} sx={{ width: h.width, minWidth: h.minWidth, textAlign: h.align }}>
                    <Typography sx={{ fontSize: { xs: "12px", lg: "13.5px" }, fontWeight: 600, lineHeight: "1.2", color: "#30353A", fontFamily: '"Helvetica Neue", Arial, sans-serif', whiteSpace: "nowrap", textAlign: h.align }}>
                      {h.label}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {pagedProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableHeaders.length} sx={{ p: 0 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 220, gap: 2 }}>
                      <Typography sx={{ fontSize: 14, color: "#757775" }}>No providers added yet.</Typography>
                      {!isReadOnly && canCreate && (
                        <Button variant="outlined" size="small" onClick={openAddDialog} sx={{ textTransform: "none", borderRadius: "8px" }}>
                          + Add Provider
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                pagedProviders.map((row: any, idx: number) => (
                  <TableRow key={row.uuid} hover sx={{ backgroundColor: "#FFFFFF" }}>
                    {/* Sr. No */}
                    <TableCell sx={{ width: tableHeaders[0].width, minWidth: tableHeaders[0].minWidth, textAlign: "center", fontSize: { xs: "12px", lg: "14px" }, fontWeight: 600, color: "#474748" }}>
                      {safePage * recordsPerPage + idx + 1}
                    </TableCell>

                    {/* Name */}
                    <TableCell sx={{ width: tableHeaders[1].width, minWidth: tableHeaders[1].minWidth, maxWidth: tableHeaders[1].width, textAlign: "left" }}>
                      <OverflowTooltip text={row.name} sx={{ margin: 0, padding: 0 }} />
                    </TableCell>

                    {/* Specialty */}
                    <TableCell sx={{ width: tableHeaders[2].width, minWidth: tableHeaders[2].minWidth, maxWidth: tableHeaders[2].width, textAlign: "left", fontSize: { xs: "12px", lg: "14px" }, color: "#25272c" }}>
                      <OverflowTooltip text={row.specialty || "—"} sx={{ margin: 0, padding: 0, fontWeight: 400 }} />
                    </TableCell>

                    {/* Address / Email */}
                    <TableCell sx={{ width: tableHeaders[3].width, minWidth: tableHeaders[3].minWidth, maxWidth: tableHeaders[3].width, textAlign: "left", fontSize: { xs: "12px", lg: "14px" }, color: "#25272c" }}>
                      <OverflowTooltip text={row.email || "—"} sx={{ margin: 0, padding: 0, fontWeight: 400 }} />
                    </TableCell>

                    {/* Address */}
                    <TableCell sx={{ width: tableHeaders[4].width, minWidth: tableHeaders[4].minWidth, maxWidth: tableHeaders[4].width, textAlign: "left", fontSize: { xs: "12px", lg: "14px" }, color: "#25272c" }}>
                      <OverflowTooltip text={row.address || "—"} sx={{ margin: 0, padding: 0, fontWeight: 400 }} />
                    </TableCell>

                    {/* Phone */}
                    <TableCell sx={{ width: tableHeaders[5].width, minWidth: tableHeaders[5].minWidth, textAlign: "left", fontSize: { xs: "12px", lg: "14px" }, color: "#25272c" }}>
                      {row.phone_number ? formatPhone(row.phone_number) : "—"}
                    </TableCell>

                    {/* Fax */}
                    <TableCell sx={{ width: tableHeaders[6].width, minWidth: tableHeaders[6].minWidth, textAlign: "left", fontSize: { xs: "12px", lg: "14px" }, color: "#25272c" }}>
                      {row.fax_number ? formatPhone(row.fax_number) : "—"}
                    </TableCell>

                    {/* Action */}
                    <TableCell sx={{ width: tableHeaders[7].width, minWidth: tableHeaders[7].minWidth, textAlign: "center" }}>
                      <Tooltip title={disabledReason || ""} disableHoverListener={!disabledReason}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={(e) => openMenu(e, row.uuid)}
                            disabled={isReadOnly}
                          >
                            <MoreVertIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ── Pagination ── */}
      {!isLoading && providers.length > 0 && (
        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
          sx={{
            mt: "auto",
            flexShrink: 0,
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid #E7E9EB",
            borderRadius: "0px 0px 10px 10px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            px: 2,
            py: 1.5,
          }}
        >
          <Paginator
            page={paginationInfo.currentPage}
            totalPages={paginationInfo.totalPages}
            totalRecord={paginationInfo.totalElements}
            onPageChange={(_e, newPage) => setPage(newPage)}
            onRecordsPerPageChange={(size) => { setRecordsPerPage(size); setPage(0); }}
            defaultSize={paginationInfo.pageSize}
          />
        </Grid>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            const row = providers.find((p: any) => p.uuid === menuRowUuid);
            if (row) openEditDialog(row);
          }}
        >
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => menuRowUuid && handleDeleteClick(menuRowUuid)} sx={{ color: "error.main" }}>
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* ── Add / Edit Dialog ── */}
      <CustomDialog
        open={dialogOpen}
        onClose={closeDialog}
        title={editingUuid ? "Edit Provider" : "Add New Provider"}
        buttonName={[]}
        width="600px"
      >
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 0.5 }}>
              Provider Name <span style={{ color: "red" }}>*</span>
            </Typography>
            <CustomInput
              name="name"
              placeholder="Enter provider name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              hasError={!!errors.name}
              errorMessage={errors.name}
              bgWhite
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 0.5 }}>
              Specialty
            </Typography>
            <CustomInput
              name="specialty"
              placeholder="Enter specialty"
              value={form.specialty}
              onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
              bgWhite
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 0.5 }}>
              Email
            </Typography>
            <CustomInput
              name="email"
              placeholder="Enter email"
              value={form.email}
              onChange={(e) => {
                const val = e.target.value;
                setForm((f) => ({ ...f, email: val }));
                validateField("email", val);
              }}
              hasError={!!errors.email}
              errorMessage={errors.email}
              bgWhite
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 0.5 }}>
              Address
            </Typography>
            <CustomInput
              name="address"
              placeholder="Enter address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              bgWhite
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 0.5 }}>
              Phone Number
            </Typography>
            <CustomInput
              name="phone"
              placeholder="(xxx) xxx-xxxx"
              value={form.phone}
              onChange={(e) => {
                const val = e.target.value;
                setForm((f) => ({ ...f, phone: val }));
                validateField("phone", val);
              }}
              hasError={!!errors.phone}
              errorMessage={errors.phone}
              phone
              bgWhite
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 0.5 }}>Fax Number</Typography>
            <CustomInput
              name="fax"
              placeholder="(xxx) xxx-xxxx"
              value={form.fax}
              onChange={(e) => {
                const val = e.target.value;
                setForm((f) => ({ ...f, fax: val }));
                validateField("fax", val);
              }}
              hasError={!!errors.fax}
              errorMessage={errors.fax}
              phone
              bgWhite
            />
          </Grid>

          {/* Error from API */}
          {(createMutation.isError || updateMutation.isError) && (
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ fontSize: 12, color: "error.main" }}>
                {(createMutation.error as any)?.response?.data?.message ?? (updateMutation.error as any)?.response?.data?.message ?? "Something went wrong."}
              </Typography>
            </Grid>
          )}

          <Grid size={{ xs: 12 }} sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
            <Button variant="outlined" onClick={closeDialog} disabled={isSaving} sx={{ textTransform: "none", borderRadius: "8px" }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ textTransform: "none", borderRadius: "8px", boxShadow: "none" }}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </Grid>
        </Grid>
      </CustomDialog>

      {/* ── Delete Confirm Dialog ── */}
      <CustomDialog
        open={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteTargetUuid(null); }}
        title="Delete Provider"
        buttonName={[]}
        width="420px"
      >
        <Typography sx={{ fontSize: 14, color: "#374151", mb: 3 }}>
          Are you sure you want to delete this provider? This action cannot be undone.
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button variant="outlined" onClick={() => { setDeleteConfirmOpen(false); setDeleteTargetUuid(null); }} sx={{ textTransform: "none", borderRadius: "8px" }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending} sx={{ textTransform: "none", borderRadius: "8px", boxShadow: "none" }}>
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </Box>
      </CustomDialog>

      {/* ── Snackbar ── */}
      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar((prev) => ({ ...prev, isOpen: false }))}
      />
    </Box>
  );
};

export default ProvidersTable;
