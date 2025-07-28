/**
 * Dashboard Types - TypeScript interfaces for dashboard functionality
 * Extends database types with dashboard-specific interfaces
 */

import type { Database } from './database.types'

// Base database type exports for dashboard
export type DashboardPreferences = Database['public']['Tables']['dashboard_preferences']['Row']
export type DashboardPreferencesInsert = Database['public']['Tables']['dashboard_preferences']['Insert']
export type DashboardPreferencesUpdate = Database['public']['Tables']['dashboard_preferences']['Update']

// Analytics view types
export type ContactAnalytics = Database['public']['Views']['dashboard_contact_analytics']['Row']
export type OrganizationAnalytics = Database['public']['Views']['dashboard_organization_analytics']['Row']
export type WeeklyInteractions = Database['public']['Views']['dashboard_weekly_interactions']['Row']

// Widget Configuration Types
export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  position: WidgetPosition
  size: WidgetSize
  visible: boolean
  settings: Record<string, any>
}

export interface WidgetPosition {
  x: number
  y: number
  row: number
  col: number
}

export interface WidgetSize {
  width: number
  height: number
  minWidth?: number
  minHeight?: number
}

export type WidgetType = 
  | 'contact-metrics'
  | 'organization-metrics' 
  | 'weekly-chart'
  | 'quick-actions'
  | 'recent-contacts'
  | 'opportunities'
  | 'task-summary'
  | 'interaction-chart'
  | 'kanban-board'

// Dashboard Layout Types
export interface DashboardLayout {
  widgets: WidgetConfig[]
  theme: DashboardTheme
  refreshInterval: number
  compactMode: boolean
}

export type DashboardTheme = 'default' | 'dark' | 'light' | 'blue' | 'green'

// Analytics Data Types
export interface ContactMetrics {
  totalContacts: number
  contactsThisWeek: number
  contactsThisMonth: number
  uniqueOrganizations: number
  growthRate: number
  weeklyGrowth: number[]
}

export interface OrganizationMetrics {
  topOrganizations: Array<{
    name: string
    contactCount: number
    firstContactDate: string
    latestContactDate: string
    avgDaysSinceContact: number
  }>
  organizationCount: number
  averageContactsPerOrg: number
}

export interface InteractionData {
  weekStart: string
  interactionCount: number
  organizationsContacted: number
  uniqueEmails: number
  organizationsList: string[]
}

// Chart Data Types
export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
}

// Quick Action Types
export interface QuickAction {
  id: string
  label: string
  icon: string
  action: string
  route?: string
  shortcut?: string
}

// Filter Types for Dashboard
export interface WeekFilter {
  weekStart: Date
  weekEnd: Date
  label: string
}

export interface DashboardFilters {
  selectedWeek: WeekFilter
  organizationFilter?: string
  contactFilter?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

// Widget Settings Types
export interface ContactMetricsSettings {
  showGrowthRate: boolean
  showWeeklyChart: boolean
  timeRange: 'week' | 'month' | 'quarter'
}

export interface ChartSettings {
  chartType: 'bar' | 'line' | 'doughnut'
  showLegend: boolean
  showTooltips: boolean
  animationEnabled: boolean
}

export interface KanbanSettings {
  columns: KanbanColumn[]
  cardFields: string[]
  sortBy: string
}

export interface KanbanColumn {
  id: string
  title: string
  status: string
  color: string
  limit?: number
}

// Dashboard State Types
export interface DashboardState {
  preferences: DashboardPreferences | null
  layout: DashboardLayout
  filters: DashboardFilters
  isLoading: boolean
  isRefreshing: boolean
  lastUpdated: Date | null
  error: string | null
}

// API Response Types
export interface DashboardApiResponse<T> {
  data: T
  success: boolean
  error?: string
  timestamp: string
}

// Form Types for Dashboard Settings
export interface DashboardSettingsForm {
  theme: DashboardTheme
  refreshInterval: number
  visibleWidgets: string[]
  compactMode: boolean
  autoRefresh: boolean
}

// Notification Types
export interface DashboardNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: string
  style: 'primary' | 'secondary' | 'danger'
}

// Responsive Design Types
export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export type ResponsiveLayout = {
  [K in BreakpointSize]?: WidgetConfig[]
}

// Week-based Calendar Types (Monday-based)
export interface WeekInfo {
  year: number
  weekNumber: number
  weekStart: Date  // Monday
  weekEnd: Date    // Sunday
  isCurrentWeek: boolean
  isPreviousWeek: boolean
  label: string    // "Week of Jan 15, 2024"
}

// Touch and Accessibility Types
export interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'pan'
  direction?: 'left' | 'right' | 'up' | 'down'
  element: HTMLElement
  preventDefault: () => void
}

export interface AccessibilityFeatures {
  highContrast: boolean
  reducedMotion: boolean
  screenReaderOptimized: boolean
  keyboardNavigation: boolean
  focusTrapping: boolean
}