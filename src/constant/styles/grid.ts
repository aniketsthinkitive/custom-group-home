// Grid system based on Figma design specifications
export const gridBreakpoints = {
  // Mobile breakpoints
  mobile: {
    xs: 360, // Android Small (Current Design)
    sm: 375, // iPhone 8
    md: 390, // iPhone 13 & 14
  },
  
  // Tablet breakpoints
  tablet: {
    xs: 744, // iPad mini 8.3 (Portrait)
    sm: 834, // iPad Pro 11" (Portrait)
    md: 1024, // iPad Pro 12.9" (Portrait) - Current Design
    lg: 1133, // iPad mini 8.3 (Landscape)
    xl: 1194, // iPad Pro 11" (Landscape)
    xxl: 1366, // iPad Pro 12.9" (Landscape) - Current Design
  },
  
  // Desktop breakpoints
  desktop: {
    xs: 1280, // Desktop 3
    sm: 1440, // Desktop 2 (Current Design)
    md: 1920, // Desktop 1
  }
};

// Grid configuration
export const gridConfig = {
  // Container max widths
  containerMaxWidths: {
    xs: 360, // Mobile
    sm: 768, // Tablet
    md: 1200, // Desktop
    lg: 1440, // Large Desktop (Current Design)
    xl: 1920, // Extra Large Desktop
  },
  
  // Grid columns
  columns: {
    mobile: 4,
    tablet: 8,
    desktop: 12,
  },
  
  // Gutters (spacing between columns)
  gutters: {
    xs: 16, // Mobile
    sm: 24, // Tablet
    md: 32, // Desktop
  },
  
  // Margins (spacing from screen edges)
  margins: {
    xs: 16, // Mobile
    sm: 24, // Tablet
    md: 40, // Desktop
  },
};

// Grid utility functions
export const gridUtils = {
  // Get container max width for breakpoint
  getContainerMaxWidth: (breakpoint: keyof typeof gridConfig.containerMaxWidths) => {
    return gridConfig.containerMaxWidths[breakpoint];
  },
  
  // Get number of columns for breakpoint
  getColumns: (breakpoint: 'mobile' | 'tablet' | 'desktop') => {
    return gridConfig.columns[breakpoint];
  },
  
  // Get gutter size for breakpoint
  getGutter: (breakpoint: keyof typeof gridConfig.gutters) => {
    return gridConfig.gutters[breakpoint];
  },
  
  // Get margin size for breakpoint
  getMargin: (breakpoint: keyof typeof gridConfig.margins) => {
    return gridConfig.margins[breakpoint];
  },
  
  // Calculate column width
  getColumnWidth: (breakpoint: 'mobile' | 'tablet' | 'desktop', containerWidth: number) => {
    const columns = gridConfig.columns[breakpoint];
    const gutter = breakpoint === 'mobile' ? gridConfig.gutters.xs : 
                   breakpoint === 'tablet' ? gridConfig.gutters.sm : 
                   gridConfig.gutters.md;
    const totalGutterWidth = gutter * (columns - 1);
    return (containerWidth - totalGutterWidth) / columns;
  },
};

// Grid component styles
export const gridStyles = {
  // Container styles
  container: {
    width: '100%',
    margin: '0 auto',
    paddingLeft: `${gridConfig.margins.xs}px`,
    paddingRight: `${gridConfig.margins.xs}px`,
    
    // Tablet breakpoints
    [`@media (min-width: ${gridBreakpoints.tablet.xs}px)`]: {
      paddingLeft: `${gridConfig.margins.sm}px`,
      paddingRight: `${gridConfig.margins.sm}px`,
    },
    
    // Desktop breakpoints
    [`@media (min-width: ${gridBreakpoints.desktop.xs}px)`]: {
      paddingLeft: `${gridConfig.margins.md}px`,
      paddingRight: `${gridConfig.margins.md}px`,
    },
    
    // Max widths
    [`@media (min-width: ${gridConfig.containerMaxWidths.sm}px)`]: {
      maxWidth: `${gridConfig.containerMaxWidths.sm}px`,
    },
    
    [`@media (min-width: ${gridConfig.containerMaxWidths.md}px)`]: {
      maxWidth: `${gridConfig.containerMaxWidths.md}px`,
    },
    
    [`@media (min-width: ${gridConfig.containerMaxWidths.lg}px)`]: {
      maxWidth: `${gridConfig.containerMaxWidths.lg}px`,
    },
    
    [`@media (min-width: ${gridConfig.containerMaxWidths.xl}px)`]: {
      maxWidth: `${gridConfig.containerMaxWidths.xl}px`,
    },
  },
  
  // Row styles
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    marginLeft: `-${gridConfig.gutters.xs / 2}px`,
    marginRight: `-${gridConfig.gutters.xs / 2}px`,
    
    [`@media (min-width: ${gridBreakpoints.tablet.xs}px)`]: {
      marginLeft: `-${gridConfig.gutters.sm / 2}px`,
      marginRight: `-${gridConfig.gutters.sm / 2}px`,
    },
    
    [`@media (min-width: ${gridBreakpoints.desktop.xs}px)`]: {
      marginLeft: `-${gridConfig.gutters.md / 2}px`,
      marginRight: `-${gridConfig.gutters.md / 2}px`,
    },
  },
  
  // Column base styles
  column: {
    position: 'relative',
    width: '100%',
    paddingLeft: `${gridConfig.gutters.xs / 2}px`,
    paddingRight: `${gridConfig.gutters.xs / 2}px`,
    
    [`@media (min-width: ${gridBreakpoints.tablet.xs}px)`]: {
      paddingLeft: `${gridConfig.gutters.sm / 2}px`,
      paddingRight: `${gridConfig.gutters.sm / 2}px`,
    },
    
    [`@media (min-width: ${gridBreakpoints.desktop.xs}px)`]: {
      paddingLeft: `${gridConfig.gutters.md / 2}px`,
      paddingRight: `${gridConfig.gutters.md / 2}px`,
    },
  },
  
  // Generate column width classes
  generateColumnClasses: () => {
    const classes: Record<string, any> = {};
    
    // Mobile columns (4 columns)
    for (let i = 1; i <= 4; i++) {
      classes[`col-mobile-${i}`] = {
        flex: `0 0 ${(i / 4) * 100}%`,
        maxWidth: `${(i / 4) * 100}%`,
      };
    }
    
    // Tablet columns (8 columns)
    for (let i = 1; i <= 8; i++) {
      classes[`col-tablet-${i}`] = {
        [`@media (min-width: ${gridBreakpoints.tablet.xs}px)`]: {
          flex: `0 0 ${(i / 8) * 100}%`,
          maxWidth: `${(i / 8) * 100}%`,
        },
      };
    }
    
    // Desktop columns (12 columns)
    for (let i = 1; i <= 12; i++) {
      classes[`col-desktop-${i}`] = {
        [`@media (min-width: ${gridBreakpoints.desktop.xs}px)`]: {
          flex: `0 0 ${(i / 12) * 100}%`,
          maxWidth: `${(i / 12) * 100}%`,
        },
      };
    }
    
    return classes;
  },
};

// Responsive breakpoint helpers
export const breakpoints = {
  // Mobile first approach
  up: (breakpoint: number) => `@media (min-width: ${breakpoint}px)`,
  down: (breakpoint: number) => `@media (max-width: ${breakpoint - 1}px)`,
  between: (start: number, end: number) => 
    `@media (min-width: ${start}px) and (max-width: ${end - 1}px)`,
  
  // Named breakpoints
  mobile: {
    up: (size: keyof typeof gridBreakpoints.mobile) => 
      `@media (min-width: ${gridBreakpoints.mobile[size]}px)`,
    down: (size: keyof typeof gridBreakpoints.mobile) => 
      `@media (max-width: ${gridBreakpoints.mobile[size] - 1}px)`,
  },
  
  tablet: {
    up: (size: keyof typeof gridBreakpoints.tablet) => 
      `@media (min-width: ${gridBreakpoints.tablet[size]}px)`,
    down: (size: keyof typeof gridBreakpoints.tablet) => 
      `@media (max-width: ${gridBreakpoints.tablet[size] - 1}px)`,
  },
  
  desktop: {
    up: (size: keyof typeof gridBreakpoints.desktop) => 
      `@media (min-width: ${gridBreakpoints.desktop[size]}px)`,
    down: (size: keyof typeof gridBreakpoints.desktop) => 
      `@media (max-width: ${gridBreakpoints.desktop[size] - 1}px)`,
  },
};

// Grid layout presets for common use cases
export const gridPresets = {
  // Dashboard layout
  dashboard: {
    container: {
      maxWidth: gridConfig.containerMaxWidths.lg,
      margin: '0 auto',
      padding: `${gridConfig.margins.md}px`,
    },
    sidebar: {
      width: '280px',
      flexShrink: 0,
    },
    main: {
      flex: 1,
      minWidth: 0,
    },
  },
  
  // Card grid layouts
  cardGrid: {
    container: {
      display: 'grid',
      gap: `${gridConfig.gutters.md}px`,
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    },
    card: {
      minHeight: '200px',
    },
  },
  
  // Form layouts
  form: {
    container: {
      maxWidth: '600px',
      margin: '0 auto',
    },
    twoColumn: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: `${gridConfig.gutters.md}px`,
      [`@media (max-width: ${gridBreakpoints.tablet.xs - 1}px)`]: {
        gridTemplateColumns: '1fr',
      },
    },
  },
  
  // Navigation layouts
  navigation: {
    container: {
      maxWidth: gridConfig.containerMaxWidths.lg,
      margin: '0 auto',
      padding: `0 ${gridConfig.margins.md}px`,
    },
  },
};

export default {
  gridBreakpoints,
  gridConfig,
  gridUtils,
  gridStyles,
  breakpoints,
  gridPresets,
};
