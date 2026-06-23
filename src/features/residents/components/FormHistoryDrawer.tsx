import React, { useState } from 'react';
import {
  Box,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Close, Visibility, Print, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAppSelector } from '../../../store/hooks';
import CustomDrawer from '../../../components/custom-drawer/custom-drawer';
import { 
  getConsentFormDetailOptions,
  deleteConsentFormMutation,
  getConsentFormDetailQueryKey,
} from '../../../sdk/@tanstack/react-query.gen';
import type { AxiosError } from 'axios';
import CommonSnackbar from '../../../components/common-snackbar/common-snackbar';
import ConfirmationPopUp from '../../../components/confirmation-pop-up/confirmation-pop-up';

export interface FormHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  formName: string;
  consentUuid: string | null | undefined;
  onViewEntry?: (entry: any) => void;
  onPrintEntry?: (entry: any) => void;
  onDeleteEntry?: (entry: any) => void;
}

/**
 * Format date string to MM/DD/YYYY, h:mm AM/PM format
 */
const formatLastUpdated = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";

  try {
    const date = dayjs(dateString);
    if (!date.isValid()) return "—";

    return `${date.format("MM/DD/YYYY")}, ${date.format("h:mm A")}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "—";
  }
};

const FormHistoryDrawer: React.FC<FormHistoryDrawerProps> = ({
  open,
  onClose,
  formName,
  consentUuid,
  onViewEntry,
  onPrintEntry,
  onDeleteEntry,
}) => {
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const isBCBA = user?.role?.name === 'BCBA';
  const isNurse = user?.role?.name === 'Nurse';
  const isDSP = user?.role?.name === 'DSP';
  const cannotDelete = isBCBA || isNurse || isDSP;

  // Responsive drawer width
  const below480 = useMediaQuery('(max-width:480px)');
  const below768 = useMediaQuery('(max-width:768px)');
  const below1024 = useMediaQuery('(max-width:1024px)');
  const drawerWidth = below480
    ? '100vw'
    : below768
    ? '92vw'
    : below1024
    ? '520px'
    : '600px';

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<any>(null);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: 'success' | 'error';
  }>({
    isOpen: false,
    message: '',
    status: 'success',
  });

  // Fetch form history with history=true
  const { data: historyData, isLoading, refetch: refetchHistory } = useQuery({
    ...getConsentFormDetailOptions({
      path: {
        uuid: consentUuid!,
      },
      query: {
        history: true,
      },
    }),
    enabled: open && !!consentUuid,
    select: (data: any) => {
      // Backend response structure:
      // { status: "success", code: 200, message: "...", data: { form: {...}, entries: [...] } }
      const responseData = data?.data ?? data;
      if (responseData) {
        return {
          form: responseData.form || {},
          entries: responseData.entries || [],
        };
      }
      return { form: {}, entries: [] };
    },
  });

  const entries = historyData?.entries || [];

  // Helper function to extract backend message
  const getBackendMessage = (data: unknown): string | undefined => {
    const responseData = data as any;
    return (
      responseData?.message ??
      responseData?.data?.message ??
      responseData?.detail ??
      undefined
    );
  };

  // Helper function to extract error message
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

  // Delete consent form mutation
  const deleteConsentFormMutationHook = useMutation({
    ...(deleteConsentFormMutation() as any),
    onSuccess: (data: unknown) => {
      const backendMessage = getBackendMessage(data);
      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: 'success',
        });
      }

      // Invalidate consent form detail query to refresh history
      if (consentUuid) {
        queryClient.invalidateQueries({
          queryKey: getConsentFormDetailQueryKey({
            path: {
              uuid: consentUuid,
            },
            query: {
              history: true,
            },
          }),
        });
      }

      // Refetch the history
      refetchHistory();
      onDeleteEntry?.(entryToDelete);
    },
    onError: (error: AxiosError<any>) => {
      const errorMessage = getErrorMessage(error);
      if (errorMessage) {
        setSnackbar({
          isOpen: true,
          message: errorMessage,
          status: 'error',
        });
      }
    },
  });

  const handleView = (entry: any) => {
    onViewEntry?.(entry);
  };

  const handlePrint = (entry: any) => {
    onPrintEntry?.(entry);
  };

  const handleDelete = (entry: any) => {
    setEntryToDelete(entry);
    setOpenDeleteConfirm(true);
  };

  const isHrst = formName === "HRST monthly tracker";
  const currentYear = new Date().getFullYear();

  // ── HRST-specific: filter to completed years only (year < currentYear) ──
  const filteredEntries = isHrst
    ? entries.filter((e: any) => {
        const y = Number(e?.form_json?.year);
        return !isNaN(y) && y > 0 && y < currentYear;
      })
    : entries;

  // Group HRST entries by year, sorted newest-first
  const entriesByYear: Record<string, any[]> = {};
  if (isHrst) {
    filteredEntries.forEach((e: any) => {
      const yr = String(e?.form_json?.year ?? "Unknown");
      if (!entriesByYear[yr]) entriesByYear[yr] = [];
      entriesByYear[yr].push(e);
    });
  }
  const sortedYears = Object.keys(entriesByYear).sort(
    (a, b) => Number(b) - Number(a)
  );

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      anchor="right"
      drawerWidth={drawerWidth}
      drawerPadding="0"
    >
      <Grid
        container
        direction="column"
        wrap="nowrap"
        sx={{
          height: '100%',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          wrap="nowrap"
          sx={{
            padding: { xs: '12px 16px', sm: '16px 24px' },
            borderBottom: '1px solid #E3ECEF',
            flexShrink: 0,
          }}
        >
          <Grid sx={{ flex: 1, minWidth: 0, pr: 1 }}>
            <Typography
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#424342',
                fontFamily: 'Geist',
                lineHeight: '24px',
                m: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Log of {formName}
            </Typography>
          </Grid>
          <Grid sx={{ flexShrink: 0 }}>
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
        </Grid>

        {/* Scrollable Table Area */}
        <Grid
          sx={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {isLoading ? (
            <Grid container justifyContent="center" sx={{ py: 4 }}>
              <Typography sx={{ color: '#757775' }}>Loading history...</Typography>
            </Grid>
          ) : filteredEntries.length === 0 ? (
            <Grid container justifyContent="center" sx={{ py: 4 }}>
              <Typography sx={{ color: '#757775' }}>
                {isHrst
                  ? 'No history available for completed years'
                  : 'No history available'}
              </Typography>
            </Grid>
          ) : (
            <Table
              stickyHeader
              sx={{
                tableLayout: 'fixed',
                width: '100%',
                minWidth: 260,
              }}
            >
              {/* Fixed column widths */}
              <colgroup>
                <col />
                <col style={{ width: '112px' }} />
              </colgroup>

              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      backgroundColor: '#F2F7FA',
                      color: '#212121',
                      borderBottom: '1px solid #E3ECEF',
                      fontSize: '13px',
                      py: 1.2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Last Updated Date
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      backgroundColor: '#F2F7FA',
                      color: '#212121',
                      borderBottom: '1px solid #E3ECEF',
                      fontSize: '13px',
                      py: 1.2,
                      textAlign: 'left',
                    }}
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isHrst ? (
                  // ── HRST: year-grouped view ──────────────────────────────
                  sortedYears.map((year) => (
                    <React.Fragment key={year}>
                      {/* Year header row */}
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          sx={{
                            backgroundColor: '#EEF4F8',
                            borderTop: '2px solid #C8DFF0',
                            borderBottom: '1px solid #C8DFF0',
                            padding: '8px 16px',
                            fontWeight: 700,
                            fontSize: '13px',
                            color: '#0A2E45',
                          }}
                        >
                          📅 {year}
                        </TableCell>
                      </TableRow>

                      {/* Entries for this year */}
                      {entriesByYear[year].map((entry: any, idx: number) => {
                        const lastUpdated = entry.updated_at || entry.created_at;
                        const lastUpdatedFormatted = formatLastUpdated(lastUpdated);

                        return (
                          <TableRow key={entry.id || idx} hover>
                            <TableCell
                              sx={{
                                fontSize: '13px',
                                py: 1.5,
                                borderBottom: '1px solid #EEF1F4',
                                color: '#212121',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {lastUpdatedFormatted}
                            </TableCell>
                            <TableCell
                              sx={{
                                py: 1.5,
                                borderBottom: '1px solid #EEF1F4',
                              }}
                            >
                              <Grid container alignItems="center" justifyContent="center" wrap="nowrap">
                                <Tooltip title="View">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleView(entry)}
                                    sx={{ color: '#0A2E45', p: '4px' }}
                                  >
                                    <Visibility sx={{ fontSize: 17 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Print">
                                  <IconButton
                                    size="small"
                                    onClick={() => handlePrint(entry)}
                                    sx={{ color: '#0A2E45', p: '4px' }}
                                  >
                                    <Print sx={{ fontSize: 17 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={cannotDelete ? "You don't have permission" : 'Delete'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDelete(entry)}
                                      disabled={cannotDelete || deleteConsentFormMutationHook.isPending}
                                      sx={{ color: cannotDelete ? '#BDBDBD' : '#DC2626', p: '4px' }}
                                    >
                                      <Delete sx={{ fontSize: 17 }} />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Grid>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  ))
                ) : (
                  // ── Non-HRST: existing flat list (unchanged) ─────────────
                  entries.map((entry: any, index: number) => {
                    const lastUpdated = entry.updated_at || entry.created_at;
                    const lastUpdatedFormatted = formatLastUpdated(lastUpdated);

                    return (
                      <TableRow key={entry.id || index} hover>
                        <TableCell
                          sx={{
                            fontSize: '13px',
                            py: 1.5,
                            borderBottom: '1px solid #EEF1F4',
                            color: '#212121',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {lastUpdatedFormatted}
                        </TableCell>
                        <TableCell
                          sx={{
                            py: 1.5,
                            borderBottom: '1px solid #EEF1F4',
                          }}
                        >
                          <Grid container alignItems="center" justifyContent="center" wrap="nowrap">
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                onClick={() => handleView(entry)}
                                sx={{ color: '#0A2E45', p: '4px' }}
                              >
                                <Visibility sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print">
                              <IconButton
                                size="small"
                                onClick={() => handlePrint(entry)}
                                sx={{ color: '#0A2E45', p: '4px' }}
                              >
                                <Print sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={cannotDelete ? "You don't have permission" : 'Delete'}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(entry)}
                                  disabled={cannotDelete || deleteConsentFormMutationHook.isPending}
                                  sx={{ color: cannotDelete ? '#BDBDBD' : '#DC2626', p: '4px' }}
                                >
                                  <Delete sx={{ fontSize: 17 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Grid>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </Grid>
      </Grid>

      {/* Snackbar for success/error messages */}
      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />

      {/* Delete Confirmation Popup */}
      <ConfirmationPopUp
        open={openDeleteConfirm}
        onClose={() => {
          setOpenDeleteConfirm(false);
          setEntryToDelete(null);
        }}
        onConfirm={() => {
          if (consentUuid) {
            deleteConsentFormMutationHook.mutate({
              path: {
                uuid: consentUuid,
              },
            } as any);
            setOpenDeleteConfirm(false);
            setEntryToDelete(null);
          }
        }}
        message={`Are you sure you want to delete this history entry? This action cannot be undone.`}
        confirmDisabled={deleteConsentFormMutationHook.isPending}
      />
    </CustomDrawer>
  );
};

export default FormHistoryDrawer;

