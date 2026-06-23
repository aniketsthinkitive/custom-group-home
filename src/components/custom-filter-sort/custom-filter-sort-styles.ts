export type FilterSortType = 'filter' | 'sort';

export type FilterSortSize = 'sm' | 'md' | 'lg';

export type FilterSortState = 'default' | 'open' | 'closed';

export interface FilterSortStyles {
  container: React.CSSProperties;
  header: React.CSSProperties;
  title: React.CSSProperties;
  clearButton: React.CSSProperties;
  content: React.CSSProperties;
  sidebar: React.CSSProperties;
  sidebarItem: React.CSSProperties;
  sidebarItemActive: React.CSSProperties;
  sidebarItemText: React.CSSProperties;
  sidebarItemTextActive: React.CSSProperties;
  mainContent: React.CSSProperties;
  filterSection: React.CSSProperties;
  filterInput: React.CSSProperties;
  filterResetButton: React.CSSProperties;
  sortSection: React.CSSProperties;
  sortGroup: React.CSSProperties;
  sortGroupTitle: React.CSSProperties;
  sortOptions: React.CSSProperties;
  sortOption: React.CSSProperties;
  radioButton: React.CSSProperties;
  radioButtonChecked: React.CSSProperties;
  radioButtonLabel: React.CSSProperties;
  divider: React.CSSProperties;
  footer: React.CSSProperties;
  footerButtons: React.CSSProperties;
  cancelButton: React.CSSProperties;
  applyButton: React.CSSProperties;
  applyButtonDisabled: React.CSSProperties;
}

export const getFilterSortStyles = (
  _type: FilterSortType,
  size: FilterSortSize
): FilterSortStyles => {
  const baseFontFamily = '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif';
  
  // Size configurations
  const sizeConfig = {
    sm: {
      width: '320px',
      headerPadding: '12px 16px',
      contentPadding: '16px',
      fontSize: '14px',
      titleFontSize: '16px',
      borderRadius: '6px',
    },
    md: {
      width: '584px',
      headerPadding: '16px 24px',
      contentPadding: '24px',
      fontSize: '16px',
      titleFontSize: '18px',
      borderRadius: '8px',
    },
    lg: {
      width: '800px',
      headerPadding: '20px 32px',
      contentPadding: '32px',
      fontSize: '18px',
      titleFontSize: '20px',
      borderRadius: '10px',
    },
  };

  const config = sizeConfig[size];

  return {
    container: {
      width: config.width,
      maxWidth: '100vw',
      backgroundColor: '#FFFFFF',
      borderRadius: config.borderRadius,
      boxShadow: '0px 2px 4px -2px rgba(16, 24, 40, 0.06), 0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px 0px rgba(0, 0, 0, 0.06), 0px 4px 8px 0px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #DDE0DD',
      borderRadius: `${config.borderRadius} ${config.borderRadius} 0px 0px`,
      padding: config.headerPadding,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontFamily: baseFontFamily,
      fontSize: config.titleFontSize,
      fontWeight: 600,
      lineHeight: '1.2',
      color: '#2C2D2C',
      margin: 0,
    },
    clearButton: {
      fontFamily: baseFontFamily,
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '1.15',
      color: '#439322',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '4px 0px',
    },
    content: {
      display: 'flex',
      flex: 1,
      minHeight: '376px',
    },
    sidebar: {
      width: '208px',
      backgroundColor: '#FAFAFA',
      borderRight: '1px solid #DDE0DD',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    },
    sidebarItem: {
      padding: '16px',
      cursor: 'pointer',
      borderBottom: '1px solid transparent',
      transition: 'all 0.2s ease',
    },
    sidebarItemActive: {
      padding: '16px',
      cursor: 'pointer',
      // borderBottom: '1px solid #439322',
      backgroundColor: '#FBFFF7',
    },
    sidebarItemText: {
      fontFamily: baseFontFamily,
      fontSize: config.fontSize,
      fontWeight: 400,
      lineHeight: '1.2',
      color: '#424342',
      margin: 0,
    },
    sidebarItemTextActive: {
      fontFamily: baseFontFamily,
      fontSize: config.fontSize,
      fontWeight: 500,
      lineHeight: '1.2',
      color: '#439322',
      margin: 0,
    },
    mainContent: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
    },
    filterSection: {
      padding: config.contentPadding,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    filterInput: {
      width: '320px',
      padding: '8px 10px',
      border: '1px solid #CDD0CD',
      borderRadius: '6px',
      fontSize: '14px',
      fontFamily: baseFontFamily,
      backgroundColor: '#FFFFFF',
      boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
    },
    filterResetButton: {
      position: 'absolute',
      right: '16px',
      top: '1px',
      fontFamily: baseFontFamily,
      fontSize: '12px',
      fontWeight: 500,
      lineHeight: '1.2',
      color: '#439322',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '4px 0px',
    },
    sortSection: {
      padding: config.contentPadding,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      overflowY: 'auto',
    },
    sortGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    sortGroupTitle: {
      fontFamily: baseFontFamily,
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '1.2',
      color: '#424342',
      margin: 0,
    },
    sortOptions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    sortOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      cursor: 'pointer',
    },
    radioButton: {
      width: '16px',
      height: '16px',
      border: '1px solid #A9ACA9',
      borderRadius: '8px',
      backgroundColor: '#FFFFFF',
      cursor: 'pointer',
      position: 'relative',
    },
    radioButtonChecked: {
      width: '16px',
      height: '16px',
      border: '1px solid #439322',
      borderRadius: '8px',
      backgroundColor: '#439322',
      cursor: 'pointer',
      position: 'relative',
    },
    radioButtonLabel: {
      fontFamily: baseFontFamily,
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '1.2',
      color: '#4D4F4D',
      cursor: 'pointer',
      margin: 0,
    },
    divider: {
      height: '1px',
      backgroundColor: '#DDE0DD',
      border: 'none',
      margin: 0,
    },
    footer: {
      borderTop: '1px solid #DDE0DD',
      borderRadius: `0px 0px ${config.borderRadius} ${config.borderRadius}`,
      padding: config.headerPadding,
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    footerButtons: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    cancelButton: {
      fontFamily: baseFontFamily,
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '1.15',
      color: '#439322',
      backgroundColor: '#FBFFF7',
      border: '1px solid #439322',
      borderRadius: '6px',
      padding: '8px 16px',
      cursor: 'pointer',
    },
    applyButton: {
      fontFamily: baseFontFamily,
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '1.15',
      color: '#FFFFFF',
      backgroundColor: '#439322',
      border: '1px solid #439322',
      borderRadius: '6px',
      padding: '8px 16px',
      cursor: 'pointer',
      boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
    },
    applyButtonDisabled: {
      fontFamily: baseFontFamily,
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '1.15',
      color: '#A9ACA9',
      backgroundColor: '#F2F2F2',
      border: '1px solid #F2F2F2',
      borderRadius: '6px',
      padding: '8px 16px',
      cursor: 'not-allowed',
      boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
    },
  };
};

export const customFilterSortStyles = {
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'translateY(-10px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
};

