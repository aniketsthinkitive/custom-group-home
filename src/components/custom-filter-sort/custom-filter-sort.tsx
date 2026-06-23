import React, { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import {
  getFilterSortStyles,
  customFilterSortStyles,
  type FilterSortType,
  type FilterSortSize
} from './custom-filter-sort-styles';
import DatePickerField from '../date-picker-field/date-picker-field';
import dayjs, { type Dayjs } from 'dayjs';

export interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'archive';
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string;
}

export interface SortOption {
  id: string;
  label: string;
  value: string;
}

export interface SortGroup {
  id: string;
  title: string;
  options: SortOption[];
}

export interface CustomFilterSortProps {
  type?: FilterSortType;
  size?: FilterSortSize;
  title?: string;
  filterFields?: FilterField[];
  sortGroups?: SortGroup[];
  activeFilterField?: string;
  activeSortGroup?: string;
  selectedSortOptions?: Record<string, string>;
  onFilterFieldChange?: (fieldId: string) => void;
  onSortGroupChange?: (groupId: string) => void;
  onSortOptionChange?: (groupId: string, optionId: string) => void;
  onFilterValueChange?: (fieldId: string, value: string) => void;
  onClearAll?: () => void;
  onApply?: (filters: Record<string, string>, sortOptions: Record<string, string>) => void;
  onCancel?: () => void;
  className?: string;
  sx?: React.CSSProperties;
}

export default function CustomFilterSort({
  type = 'filter',
  size = 'md',
  title,
  filterFields = [],
  sortGroups = [],
  activeFilterField,
  activeSortGroup,
  selectedSortOptions = {},
  onFilterFieldChange,
  onSortGroupChange,
  onSortOptionChange,
  onFilterValueChange,
  onClearAll,
  onApply,
  onCancel,
  className,
  sx
}: CustomFilterSortProps) {
  const [localFilterValues, setLocalFilterValues] = useState<Record<string, string>>({});
  const [localSortOptions, setLocalSortOptions] = useState<Record<string, string>>(selectedSortOptions);

  const styles = getFilterSortStyles(type, size);

  const handleFilterFieldClick = useCallback((fieldId: string) => {
    onFilterFieldChange?.(fieldId);
  }, [onFilterFieldChange]);

  const handleSortGroupClick = useCallback((groupId: string) => {
    onSortGroupChange?.(groupId);
  }, [onSortGroupChange]);

  const handleSortOptionChange = useCallback((groupId: string, optionId: string) => {
    const newSortOptions = { ...localSortOptions, [groupId]: optionId };
    setLocalSortOptions(newSortOptions);
    onSortOptionChange?.(groupId, optionId);
  }, [localSortOptions, onSortOptionChange]);

  const handleFilterValueChange = useCallback((fieldId: string, value: string) => {
    const newFilterValues = { ...localFilterValues, [fieldId]: value };
    setLocalFilterValues(newFilterValues);
    onFilterValueChange?.(fieldId, value);
  }, [localFilterValues, onFilterValueChange]);

  const handleClearAll = useCallback(() => {
    setLocalFilterValues({});
    setLocalSortOptions({});
    onClearAll?.();
  }, [onClearAll]);

  const handleApply = useCallback(() => {
    onApply?.(localFilterValues, localSortOptions);
  }, [localFilterValues, localSortOptions, onApply]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const renderFilterSidebar = () => {
    if (type !== 'filter' || filterFields.length === 0) return null;

    return (
      <Box 
        sx={{
          ...styles.sidebar,
          // Responsive sidebar styles
          '@media (max-width: 600px)': {
            width: '100%',
            borderRight: 'none',
            borderBottom: '1px solid #DDE0DD',
            maxHeight: '200px',
            overflowY: 'auto',
          },
          '@media (min-width: 600px) and (max-width: 900px)': {
            width: '100%',
            borderRight: 'none',
            borderBottom: '1px solid #DDE0DD',
            maxHeight: '200px',
            overflowY: 'auto',
          },
        }}
      >
        {filterFields.map((field) => (
          <Box
            key={field.id}
            sx={{
              ...(activeFilterField === field.id ? styles.sidebarItemActive : styles.sidebarItem),
              // Responsive sidebar item styles
              '@media (max-width: 600px)': {
                padding: '12px 16px',
              },
              '@media (min-width: 600px) and (max-width: 900px)': {
                padding: '14px 16px',
              },
            }}
            onClick={() => handleFilterFieldClick(field.id)}
          >
            <Typography sx={activeFilterField === field.id ? styles.sidebarItemTextActive : styles.sidebarItemText}>
              {field.label}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const renderSortSidebar = () => {
    if (type !== 'sort' || sortGroups.length === 0) return null;

    return (
      <Box 
        sx={{
          ...styles.sidebar,
          // Responsive sidebar styles
          '@media (max-width: 600px)': {
            width: '100%',
            borderRight: 'none',
            borderBottom: '1px solid #DDE0DD',
            maxHeight: '200px',
            overflowY: 'auto',
          },
          '@media (min-width: 600px) and (max-width: 900px)': {
            width: '100%',
            borderRight: 'none',
            borderBottom: '1px solid #DDE0DD',
            maxHeight: '200px',
            overflowY: 'auto',
          },
        }}
      >
        {sortGroups.map((group) => (
          <Box
            key={group.id}
            sx={{
              ...(activeSortGroup === group.id ? styles.sidebarItemActive : styles.sidebarItem),
              // Responsive sidebar item styles
              '@media (max-width: 600px)': {
                padding: '12px 16px',
              },
              '@media (min-width: 600px) and (max-width: 900px)': {
                padding: '14px 16px',
              },
            }}
            onClick={() => handleSortGroupClick(group.id)}
          >
            <Typography sx={activeSortGroup === group.id ? styles.sidebarItemTextActive : styles.sidebarItemText}>
              {group.title}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const renderFilterContent = () => {
    if (type !== 'filter') return null;

    const activeField = filterFields.find(field => field.id === activeFilterField);
    if (!activeField) return null;

    // Handle archive filter type
    if (activeField.type === 'archive') {
      return (
        <Box sx={styles.filterSection}>
          <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#424342' }}>
              {activeField.label}
            </Typography>
            <Box
              component="select"
              value={localFilterValues[activeField.id] || 'all'}
              onChange={(e) => handleFilterValueChange(activeField.id, (e.target as HTMLSelectElement).value)}
              sx={{
                ...styles.filterInput,
                // Responsive select styles
                '@media (max-width: 600px)': {
                  width: '100%',
                  maxWidth: '100%',
                  fontSize: '16px', // Prevents zoom on iOS
                  padding: '12px 10px',
                },
                '@media (min-width: 600px) and (max-width: 900px)': {
                  width: '100%',
                  maxWidth: '400px',
                  fontSize: '15px',
                  padding: '10px 10px',
                },
              }}
            >
              <option value="all">All</option>
              <option value="unarchived">Unarchived</option>
              <option value="archived">Archived</option>
            </Box>
            <button
              onClick={() => handleFilterValueChange(activeField.id, 'all')}
              style={styles.filterResetButton}
            >
              Reset
            </button>
          </Box>
        </Box>
      );
    }

    // Handle select filter type
    if (activeField.type === 'select') {
      return (
        <Box sx={styles.filterSection}>
          <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#424342' }}>
              {activeField.label}
            </Typography>
            <Box
              component="select"
              value={localFilterValues[activeField.id] || ''}
              onChange={(e) => handleFilterValueChange(activeField.id, (e.target as HTMLSelectElement).value)}
              sx={{
                ...styles.filterInput,
                // Responsive select styles
                '@media (max-width: 600px)': {
                  width: '100%',
                  maxWidth: '100%',
                  fontSize: '16px', // Prevents zoom on iOS
                  padding: '12px 10px',
                },
                '@media (min-width: 600px) and (max-width: 900px)': {
                  width: '100%',
                  maxWidth: '400px',
                  fontSize: '15px',
                  padding: '10px 10px',
                },
              }}
            >
              <option value="">{activeField.placeholder || 'Select an option'}</option>
              {activeField.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Box>
            <button
              onClick={() => handleFilterValueChange(activeField.id, '')}
              style={styles.filterResetButton}
            >
              Reset
            </button>
          </Box>
        </Box>
      );
    }

    // Handle date filter type
    if (activeField.type === 'date') {
      return (
        <Box sx={styles.filterSection}>
          <Box
            sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <Typography
              sx={{ fontSize: "12px", fontWeight: 500, color: "#424342" }}
            >
              {activeField.label}
            </Typography>
            <DatePickerField
              value={localFilterValues[activeField.id] ? dayjs(localFilterValues[activeField.id]) : null}
              onChange={(date: Dayjs | null) =>
                handleFilterValueChange(activeField.id, date ? date.format('MM/DD/YYYY') : '')
              }
              label="MM/DD/YYYY"
              format="MM/DD/YYYY"
            />
            <button
              onClick={() => handleFilterValueChange(activeField.id, "")}
              style={styles.filterResetButton}
            >
              Reset
            </button>
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={styles.filterSection}>
        <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#424342' }}>
            {activeField.label}
          </Typography>
            <Box
              component="input"
              type={activeField.type === 'number' ? 'number' : 'text'}
              placeholder={activeField.placeholder || `Enter ${activeField.label.toLowerCase()}`}
              value={localFilterValues[activeField.id] || ''}
              onChange={(e) => handleFilterValueChange(activeField.id, (e.target as HTMLInputElement).value)}
              sx={{
                ...styles.filterInput,
                // Responsive input styles
                '@media (max-width: 600px)': {
                  width: '100%',
                  maxWidth: '100%',
                  fontSize: '16px', // Prevents zoom on iOS
                  padding: '12px 10px',
                },
                '@media (min-width: 600px) and (max-width: 900px)': {
                  width: '100%',
                  maxWidth: '400px',
                  fontSize: '15px',
                  padding: '10px 10px',
                },
              }}
            />
          <button
            onClick={() => handleFilterValueChange(activeField.id, '')}
            style={styles.filterResetButton}
          >
            Reset
          </button>
        </Box>
      </Box>
    );
  };

  const renderSortContent = () => {
    if (type !== 'sort') return null;

    const activeGroup = sortGroups.find(group => group.id === activeSortGroup);
    if (!activeGroup) return null;

    return (
      <Box sx={styles.sortSection}>
        {sortGroups.map((group, index) => (
          <React.Fragment key={group.id}>
            <Box sx={styles.sortGroup}>
              <Typography sx={styles.sortGroupTitle}>
                {group.title}
              </Typography>
              <Box sx={styles.sortOptions}>
                {group.options.map((option) => (
                  <Box
                    key={option.id}
                    sx={styles.sortOption}
                    onClick={() => handleSortOptionChange(group.id, option.id)}
                  >
                    <input
                      type="radio"
                      name={group.id}
                      value={option.id}
                      checked={localSortOptions[group.id] === option.id}
                      onChange={() => handleSortOptionChange(group.id, option.id)}
                      style={localSortOptions[group.id] === option.id ? styles.radioButtonChecked : styles.radioButton}
                    />
                    <Typography sx={styles.radioButtonLabel}>
                      {option.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            {index < sortGroups.length - 1 && <hr style={styles.divider} />}
          </React.Fragment>
        ))}
      </Box>
    );
  };

  const getDefaultTitle = () => {
    return type === 'filter' ? 'Filters' : 'Sort';
  };

  const hasChanges = () => {
    if (type === 'filter') {
      return Object.values(localFilterValues).some(value => value.trim() !== '');
    } else {
      return Object.keys(localSortOptions).length > 0;
    }
  };

  return (
    <Box sx={customFilterSortStyles}>
      <Box 
        sx={{ 
          ...styles.container, 
          ...sx,
          // Responsive container styles
          '@media (max-width: 600px)': {
            width: '100%',
            margin: '0 8px',
            borderRadius: '6px',
          },
          '@media (min-width: 600px) and (max-width: 900px)': {
            width: '100%',
            maxWidth: '90vw',
            margin: '0 auto',
          },
        }} 
        className={className}
      >
        {/* Header */}
        <Box 
          sx={{
            ...styles.header,
            // Responsive header styles
            '@media (max-width: 600px)': {
              padding: '12px 16px',
            },
            '@media (min-width: 600px) and (max-width: 900px)': {
              padding: '14px 20px',
            },
          }}
        >
          <Typography 
            sx={{
              ...styles.title,
              // Responsive title styles
              '@media (max-width: 600px)': {
                fontSize: '14px',
              },
              '@media (min-width: 600px) and (max-width: 900px)': {
                fontSize: '16px',
              },
            }}
          >
            {title || getDefaultTitle()}
          </Typography>
          <button
            onClick={handleClearAll}
            style={styles.clearButton}
          >
            Clear All
          </button>
        </Box>

        {/* Content */}
        <Box 
          sx={{
            ...styles.content,
            // Responsive content styles
            '@media (max-width: 600px)': {
              flexDirection: 'column',
              minHeight: 'auto',
            },
            '@media (min-width: 600px) and (max-width: 900px)': {
              flexDirection: 'column',
              minHeight: 'auto',
            },
          }}
        >
          {/* Sidebar */}
          {type === 'filter' ? renderFilterSidebar() : renderSortSidebar()}
          
          {/* Main Content */}
          <Box 
            sx={{
              ...styles.mainContent,
              // Responsive main content styles
              '@media (max-width: 600px)': {
                minHeight: '200px',
              },
              '@media (min-width: 600px) and (max-width: 900px)': {
                minHeight: '250px',
              },
            }}
          >
            {type === 'filter' ? renderFilterContent() : renderSortContent()}
          </Box>
        </Box>

        {/* Footer */}
        <Box 
          sx={{
            ...styles.footer,
            // Responsive footer styles
            '@media (max-width: 600px)': {
              padding: '12px 16px',
            },
            '@media (min-width: 600px) and (max-width: 900px)': {
              padding: '14px 20px',
            },
          }}
        >
          <Box 
            sx={{
              ...styles.footerButtons,
              // Responsive footer buttons styles
              '@media (max-width: 600px)': {
                gap: '12px',
              },
              '@media (min-width: 600px) and (max-width: 900px)': {
                gap: '14px',
              },
            }}
          >
            <Box
              component="button"
              onClick={handleCancel}
              sx={{
                ...styles.cancelButton,
                // Responsive button styles
                '@media (max-width: 600px)': {
                  fontSize: '16px',
                  padding: '12px 20px',
                  minWidth: '100px',
                },
                '@media (min-width: 600px) and (max-width: 900px)': {
                  fontSize: '15px',
                  padding: '10px 18px',
                  minWidth: '90px',
                },
              }}
            >
              Cancel
            </Box>
            <Box
              component="button"
              onClick={handleApply}
              sx={{
                ...(hasChanges() ? styles.applyButton : styles.applyButtonDisabled),
                // Responsive button styles
                '@media (max-width: 600px)': {
                  fontSize: '16px',
                  padding: '12px 20px',
                  minWidth: '100px',
                },
                '@media (min-width: 600px) and (max-width: 900px)': {
                  fontSize: '15px',
                  padding: '10px 18px',
                  minWidth: '90px',
                },
              }}
              disabled={!hasChanges()}
            >
              Apply
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
