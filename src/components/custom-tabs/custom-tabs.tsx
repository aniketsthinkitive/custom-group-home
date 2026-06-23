import React, { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { 
  getTabStyles, 
  customTabsStyles, 
  type TabType, 
  type TabSize, 
  type TabState 
} from './custom-tabs-styles';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface CustomTabsProps {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  type?: TabType;
  size?: TabSize;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  sx?: React.CSSProperties;
  orientation?: 'horizontal' | 'vertical';
  showContent?: boolean;
  contentSx?: React.CSSProperties;
}

export default function CustomTabs({
  tabs,
  activeTab,
  onTabChange,
  type = 'button-primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className,
  sx,
  orientation = 'horizontal',
  showContent = false,
  contentSx
}: CustomTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<string>(
    activeTab || tabs[0]?.id || ''
  );
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [focusedTab, setFocusedTab] = useState<string | null>(null);

  const currentActiveTab = activeTab !== undefined ? activeTab : internalActiveTab;
  const styles = getTabStyles(type, size, fullWidth);

  const handleTabClick = useCallback((tabId: string) => {
    if (disabled) return;
    
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.disabled) return;

    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  }, [disabled, tabs, onTabChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, tabId: string) => {
    if (disabled) return;
    
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabClick(tabId);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const currentIndex = tabs.findIndex(t => t.id === currentActiveTab);
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      let nextIndex = currentIndex + direction;
      
      // Wrap around
      if (nextIndex >= tabs.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = tabs.length - 1;
      
      const nextTab = tabs[nextIndex];
      if (nextTab && !nextTab.disabled) {
        handleTabClick(nextTab.id);
      }
    }
  }, [disabled, tabs, currentActiveTab, handleTabClick]);

  const getTabState = (tabId: string): TabState => {
    if (disabled || tabs.find(t => t.id === tabId)?.disabled) {
      return 'default';
    }
    if (focusedTab === tabId) {
      return 'focus';
    }
    if (hoveredTab === tabId) {
      return 'hover';
    }
    if (currentActiveTab === tabId) {
      return 'active';
    }
    return 'default';
  };

  const getTabStyle = (tabId: string): React.CSSProperties => {
    const state = getTabState(tabId);
    const tab = tabs.find(t => t.id === tabId);
    
    if (disabled || tab?.disabled) {
      return { ...styles.tab, ...styles.tabDisabled };
    }

    switch (state) {
      case 'active':
        return { ...styles.tab, ...styles.tabActive };
      case 'hover':
        return { ...styles.tab, ...styles.tabHover };
      case 'focus':
        return { ...styles.tab, ...styles.tabFocus };
      default:
        return styles.tab;
    }
  };

  const getTextStyle = (tabId: string): React.CSSProperties => {
    const state = getTabState(tabId);
    const tab = tabs.find(t => t.id === tabId);
    
    if (disabled || tab?.disabled) {
      return { ...styles.tabText, ...styles.tabTextDisabled };
    }
    
    if (state === 'active') {
      return { ...styles.tabText, ...styles.tabTextActive };
    }
    
    return styles.tabText;
  };

  const getBadgeStyle = (tabId: string): React.CSSProperties => {
    const state = getTabState(tabId);
    return state === 'active' ? styles.badgeActive : styles.badge;
  };

  const renderTabContent = () => {
    if (!showContent) return null;
    
    const activeTabData = tabs.find(t => t.id === currentActiveTab);
    if (!activeTabData?.content) return null;

    return (
      <Box
        sx={{
          padding: '16px',
          borderTop: type.includes('underline') ? 'none' : '1px solid #DDE0DD',
          ...contentSx
        }}
      >
        {activeTabData.content}
      </Box>
    );
  };

  const containerStyle: React.CSSProperties = {
    ...customTabsStyles.tabsContainer,
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    ...sx
  };

  return (
    <Box className={className}>
      <Box sx={containerStyle}>
        {tabs.map((tab) => (
          <Box
            key={tab.id}
            sx={customTabsStyles.tabWrapper}
          >
            <Box
              component="button"
              role="tab"
              aria-selected={currentActiveTab === tab.id}
              aria-disabled={disabled || tab.disabled}
              tabIndex={disabled || tab.disabled ? -1 : 0}
              sx={getTabStyle(tab.id)}
              onClick={() => handleTabClick(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              onFocus={() => setFocusedTab(tab.id)}
              onBlur={() => setFocusedTab(null)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
            >
              {/* Icon */}
              {tab.icon && (
                <Box sx={customTabsStyles.tabIcon}>
                  {tab.icon}
                </Box>
              )}
              
              {/* Label */}
              {tab.label && (
                <Typography sx={getTextStyle(tab.id)}>
                  {tab.label}
                </Typography>
              )}
              
              {/* Badge */}
              {tab.badge && (
                <Box sx={getBadgeStyle(tab.id)}>
                  {tab.badge}
                </Box>
              )}
            </Box>
            
            {/* Underline for underline types */}
            {(type === 'underline' || type === 'underline-filled') && (
              <Box
                sx={
                  currentActiveTab === tab.id
                    ? styles.underlineActive
                    : styles.underline
                }
              />
            )}
          </Box>
        ))}
      </Box>
      
      {/* Tab Content */}
      {renderTabContent()}
    </Box>
  );
}

// Export types for external use
export type { TabType, TabSize, TabState };
