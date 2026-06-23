import React, { useState, useEffect } from 'react';
import { Grid, IconButton, Typography, Box } from '@mui/material';
import { Close } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import dayjs, { type Dayjs } from 'dayjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import CustomDrawer from '../../../components/custom-drawer/custom-drawer';
import CustomInput from '../../../components/custom-input/custom-input';
import CustomButton from '../../../components/custom-buttons/custom-buttons';
import CustomLabel from '../../../components/custom-label/custom-label';
import DatePickerField from '../../../components/date-picker-field/date-picker-field';
import CommonSnackbar from '../../../components/common-snackbar/common-snackbar';
import {
  createConsentFormMutation,
  getConsentFormDetailOptions,
  listConsentFormsQueryKey,
  updateConsentFormMutation,
} from '../../../sdk/@tanstack/react-query.gen';

const FORM_CODE = 'RESIDENT_INVENTORY_LIST';

/* ─── types ─── */

interface InventoryItem {
  id: string;
  movedInWith: string;
  movedInDate: Dayjs | null;
  purchased: string;
  purchasedDate: Dayjs | null;
  brokenLostDamaged: string;
  brokenLostDate: Dayjs | null;
}

const createEmptyItem = (): InventoryItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  movedInWith: '',
  movedInDate: null,
  purchased: '',
  purchasedDate: null,
  brokenLostDamaged: '',
  brokenLostDate: null,
});

export interface ResidentInventoryListDrawerProps {
  open: boolean;
  onClose: () => void;
  formName: string;
  individualName?: string;
  residentData?: any;
  consentUuid?: string | null;
  mode?: 'new' | 'draft' | 'view';
  onAfterSave?: () => void;
  onAfterSubmit?: () => void;
}

/* ─── helpers ─── */

const getBackendMessage = (data: unknown): string | undefined => {
  const d = data as any;
  return d?.message ?? d?.data?.message ?? d?.detail ?? undefined;
};

const getErrorMessage = (error: unknown): string | undefined => {
  const err = error as AxiosError<any> | any;
  return (
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.response?.data?.detail ??
    err?.data?.message ??
    err?.data?.error ??
    err?.data?.detail ??
    undefined
  );
};

/* ─── component ─── */

const ResidentInventoryListDrawer: React.FC<ResidentInventoryListDrawerProps> = ({
  open,
  onClose,
  formName,
  individualName,
  residentData,
  consentUuid,
  mode = 'new',
  onAfterSave,
  onAfterSubmit,
}) => {
  const queryClient = useQueryClient();
  const residentUuid = residentData?.uuid || residentData?.resident_uuid;
  const isViewMode = mode === 'view';

  const [items, setItems] = useState<InventoryItem[]>([createEmptyItem()]);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: 'success' | 'error';
  }>({ isOpen: false, message: '', status: 'success' });

  /* ─── fetch existing data (draft / view) ─── */

  const { data: formDetailData } = useQuery({
    ...getConsentFormDetailOptions({
      path: { uuid: consentUuid! },
      query: { history: false },
    }),
    enabled: open && (mode === 'draft' || mode === 'view') && !!consentUuid,
    staleTime: 0,
    refetchOnWindowFocus: false,
    select: (data: any) => {
      const responseData = data?.data ?? data;
      const entries: any[] = responseData?.entries ?? [];
      const latestEntry = entries[0] ?? null;
      return (latestEntry?.form_json ?? responseData?.form_json ?? {}) as Record<string, any>;
    },
  });

  /* populate form when data arrives */
  useEffect(() => {
    if (!formDetailData) return;
    if (Array.isArray(formDetailData.items) && formDetailData.items.length > 0) {
      setItems(
        formDetailData.items.map((item: any) => ({
          id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          movedInWith: item.movedInWith ?? '',
          movedInDate: item.movedInDate ? dayjs(item.movedInDate) : null,
          purchased: item.purchased ?? '',
          purchasedDate: item.purchasedDate ? dayjs(item.purchasedDate) : null,
          brokenLostDamaged: item.brokenLostDamaged ?? '',
          brokenLostDate: item.brokenLostDate ? dayjs(item.brokenLostDate) : null,
        })),
      );
    }
  }, [formDetailData]);

  /* reset to empty when drawer opens as "new" */
  useEffect(() => {
    if (open && mode === 'new') {
      setItems([createEmptyItem()]);
    }
  }, [open, mode]);

  /* ─── mutations ─── */

  const createConsentFormMutationHook = useMutation({
    ...(createConsentFormMutation() as any),
    onSuccess: (data: unknown) => {
      const msg = getBackendMessage(data);
      setSnackbar({ isOpen: true, message: msg || 'Form saved successfully', status: 'success' });
      createConsentFormMutationHook.reset();
      onAfterSave?.();
      onClose();
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error);
      setSnackbar({
        isOpen: true,
        message: msg || 'Failed to save form. Please try again.',
        status: 'error',
      });
    },
  });

  const updateConsentFormMutationHook = useMutation({
    ...(updateConsentFormMutation() as any),
    onSuccess: (data: unknown) => {
      const msg = getBackendMessage(data);
      setSnackbar({ isOpen: true, message: msg || 'Form saved successfully', status: 'success' });
      updateConsentFormMutationHook.reset();
      onAfterSave?.();
      onClose();
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error);
      setSnackbar({
        isOpen: true,
        message: msg || 'Failed to save form. Please try again.',
        status: 'error',
      });
    },
  });

  /* ─── submit ─── */

  const onSubmit = (status: 'COMPLETED' | 'DRAFT') => {
    if (isViewMode) return;

    if (!residentUuid) {
      setSnackbar({ isOpen: true, message: 'Resident UUID is required', status: 'error' });
      return;
    }

    const filledAt = new Date().toISOString();
    // Quarterly re-open: 90 days after submission (like Health History uses 365 days for annual)
    const nextDueAt =
      status === 'COMPLETED' ? dayjs(filledAt).add(90, 'day').toISOString() : null;

    const form_json = {
      items: items.map((item) => ({
        id: item.id,
        movedInWith: item.movedInWith,
        movedInDate: item.movedInDate?.format('YYYY-MM-DD') ?? null,
        purchased: item.purchased,
        purchasedDate: item.purchasedDate?.format('YYYY-MM-DD') ?? null,
        brokenLostDamaged: item.brokenLostDamaged,
        brokenLostDate: item.brokenLostDate?.format('YYYY-MM-DD') ?? null,
      })),
    };

    if (mode === 'draft' && consentUuid) {
      updateConsentFormMutationHook.mutate({
        path: { uuid: consentUuid },
        body: {
          status,
          form_json,
          ...(status === 'COMPLETED'
            ? { filled_at: filledAt, next_due_at: nextDueAt }
            : {}),
        },
      } as any);
    } else {
      createConsentFormMutationHook.mutate({
        body: {
          resident_uuid: residentUuid,
          form_name: formName,
          form_code: FORM_CODE,
          frequency_type: 'ONCE',
          status,
          filled_at: filledAt,
          next_due_at: nextDueAt,
          form_json,
        },
      } as any);
    }

    if (status === 'COMPLETED') {
      onAfterSubmit?.();
    }
  };

  const handleSaveDraft = () => onSubmit('DRAFT');
  const handleSave = () => onSubmit('COMPLETED');
  const handleCancel = () => onClose();

  /* ─── item helpers ─── */

  const addItem = () => setItems((prev) => [...prev, createEmptyItem()]);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const updateItem = (
    id: string,
    field: keyof Omit<InventoryItem, 'id'>,
    value: string | Dayjs | null,
  ) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );

  const isSaving =
    createConsentFormMutationHook.isPending ||
    updateConsentFormMutationHook.isPending ||
    createConsentFormMutationHook.isSuccess ||
    updateConsentFormMutationHook.isSuccess;

  /* ─── render ─── */

  return (
    <>
      <CustomDrawer
        anchor="right"
        open={open}
        onClose={onClose}
        drawerWidth="840px"
        drawerPadding="0"
      >
        <Grid
          container
          direction="column"
          sx={{ height: '100%', overflow: 'hidden', backgroundColor: '#FFFFFF' }}
        >
          {/* ── Header ── */}
          <Grid
            size={{ xs: 12 }}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              padding: { xs: '12px 16px', sm: '16px 24px' },
              borderBottom: '1px solid #E3ECEF',
              flexShrink: 0,
              gap: { xs: 1, sm: 0 },
            }}
          >
            <Typography
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#424342',
                fontFamily: 'Geist',
                lineHeight: '24px',
                m: 0,
              }}
            >
              {formName}
            </Typography>
            <IconButton
              onClick={onClose}
              sx={{
                padding: '4px',
                color: '#757775',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
              }}
            >
              <Close />
            </IconButton>
          </Grid>

          {/* ── Individual Info Bar ── */}
          <Grid
            sx={{
              px: 3,
              py: 1.5,
              backgroundColor: '#F5F7FA',
              borderBottom: '1px solid #E3ECEF',
              flexShrink: 0,
            }}
          >
            <CustomLabel
              label={`Individual's Name : ${individualName || ''}`}
              style={{ fontSize: '14px', color: '#424342', marginBottom: '4px' }}
            />
            <CustomLabel
              label="To be completed once a quarter and updated as needed."
              style={{ fontSize: '12px', color: '#6B7280', fontWeight: 400, margin: 0 }}
            />
          </Grid>

          {/* ── Scrollable Content ── */}
          <Grid
            sx={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              p: 3,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Inventory item cards */}
            {items.map((item, index) => (
              <Box
                key={item.id}
                sx={{
                  border: '1px solid #E3ECEF',
                  borderRadius: '8px',
                  p: 2,
                  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
                  position: 'relative',
                }}
              >
                {/* Delete button */}
                {items.length > 1 && !isViewMode && (
                  <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => removeItem(item.id)}
                      sx={{
                        color: '#DC2626',
                        '&:hover': { backgroundColor: '#FEF2F2' },
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: '20px' }} />
                    </IconButton>
                  </Box>
                )}

                {/* Item number header */}
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1F2A37',
                    mb: 2,
                    pr: items.length > 1 && !isViewMode ? 4 : 0,
                  }}
                >
                  Item {index + 1}
                </Typography>

                <Grid container spacing={2}>
                  {/* MOVED IN WITH */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Moved In With" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name={`movedInWith-${item.id}`}
                          value={item.movedInWith}
                          onChange={(e) => updateItem(item.id, 'movedInWith', e.target.value)}
                          bgWhite
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* DATE (moved in) */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Date" />
                      </Grid>
                      <Grid>
                        <DatePickerField
                          value={item.movedInDate}
                          onChange={(date) => updateItem(item.id, 'movedInDate', date)}
                          disabled={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* PURCHASED */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Purchased" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name={`purchased-${item.id}`}
                          value={item.purchased}
                          onChange={(e) => updateItem(item.id, 'purchased', e.target.value)}
                          bgWhite
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* DATE (purchased) */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Date" />
                      </Grid>
                      <Grid>
                        <DatePickerField
                          value={item.purchasedDate}
                          onChange={(date) => updateItem(item.id, 'purchasedDate', date)}
                          disabled={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* BROKEN / LOST / DAMAGED */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Broken / Lost / Damaged" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name={`brokenLostDamaged-${item.id}`}
                          value={item.brokenLostDamaged}
                          onChange={(e) =>
                            updateItem(item.id, 'brokenLostDamaged', e.target.value)
                          }
                          bgWhite
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* DATE (broken/lost/damaged) */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Date" />
                      </Grid>
                      <Grid>
                        <DatePickerField
                          value={item.brokenLostDate}
                          onChange={(date) => updateItem(item.id, 'brokenLostDate', date)}
                          disabled={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            ))}

            {/* Add More */}
            {!isViewMode && (
              <Box
                onClick={addItem}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  userSelect: 'none',
                  width: 'fit-content',
                  '&:hover .add-label': { textDecoration: 'underline' },
                }}
              >
                <IconButton
                  size="small"
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    bgcolor: '#fff',
                    border: '1px solid #E3ECEF',
                    pointerEvents: 'none',
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <Typography
                  className="add-label"
                  sx={{ fontSize: '14px', color: '#1976D2', fontWeight: 500 }}
                >
                  Add More
                </Typography>
              </Box>
            )}
          </Grid>

          {/* ── Sticky Footer ── */}
          <Grid
            container
            justifyContent={{ xs: 'center', sm: 'flex-end' }}
            alignItems="center"
            spacing={{ xs: 1.5, sm: 2 }}
            sx={{
              padding: { xs: '12px 16px', sm: '16px 24px' },
              borderTop: '1px solid #E3ECEF',
              flexShrink: 0,
            }}
          >
            <Grid>
              <CustomButton
                variant="secondary"
                size="md"
                onClick={handleCancel}
                disabled={isViewMode || isSaving}
              >
                Cancel
              </CustomButton>
            </Grid>
            <Grid>
              <CustomButton
                variant="secondary"
                size="md"
                onClick={handleSaveDraft}
                disabled={isViewMode || isSaving}
              >
                Save as Draft
              </CustomButton>
            </Grid>
            <Grid>
              <CustomButton
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={isViewMode || isSaving}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </CustomButton>
            </Grid>
          </Grid>
        </Grid>
      </CustomDrawer>

      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};

export default ResidentInventoryListDrawer;
