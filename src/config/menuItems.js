import moment from 'moment';
import React from 'react';
import {
  Dashboard,
  Storefront,
  PersonSearch,
  CreditScore,
  Build,
  Engineering,
  PriorityHigh,
  Inventory2,
  Handyman,
  BusinessCenter,
  Timeline,
  LocalShipping,
  AccountBalance,
  Assignment,
  Bolt,
  DirectionsCar,
  BuildCircle,
  Person,
  Logout,
  AttachMoney,
  CreditCard,
  Analytics,
  Store,
} from '@mui/icons-material';
import { ListItemIcon, ListItemText, Box, Typography, MenuItem, Divider } from '@mui/material';

const iconMap = {
  dashboard: Dashboard,
  storefront: Storefront,
  person_search: PersonSearch,
  credit_score: CreditScore,
  build: Build,
  engineering: Engineering,
  priority_high: PriorityHigh,
  inventory_2: Inventory2,
  handyman: Handyman,
  business_center: BusinessCenter,
  timeline: Timeline,
  local_shipping: LocalShipping,
  account_balance: AccountBalance,
  assignment: Assignment,
  bolt: Bolt,
  directions_car: DirectionsCar,
  build_circle: BuildCircle,
  person: Person,
  logout: Logout,
  attach_money: AttachMoney,
  credit_card: CreditCard,
  analytics: Analytics,
  store: Store,
};

// Menu sections with their respective items
export const menuSections = [
  {
    title: 'Sales',
    icon: 'storefront',
    items: [
      {
        label: 'Deal Dashboard',
        path: `/deal-dashboard/${moment().format("YYYY-MM")}`,
        permission: 'deal-dashboard',
        icon: 'attach_money',
      },
      {
        label: 'Process Pipeline',
        path: '/pipeline',
        permission: 'pipeline',
        icon: 'timeline',
      },
      {
        label: 'Leads',
        path: '/leads',
        permission: 'leads',
        icon: 'person_search',
      },
      {
        label: 'Credit Apps',
        path: '/credit-apps',
        permission: 'credit-apps',
        icon: 'credit_score',
      },
    ],
  },
  {
    title: 'Service',
    icon: 'build',
    items: [
      {
        label: 'Service Pipeline',
        path: '/service-pipeline',
        permission: 'service-pipeline',
        icon: 'engineering',
      },
      {
        label: 'Service Priorities',
        path: '/service-priorities',
        permission: 'service-pipeline',
        icon: 'priority_high',
      },
      {
        label: 'Parts Pipeline',
        path: '/parts-pipeline',
        permission: 'parts-pipeline',
        icon: 'inventory_2',
      },
      {
        label: 'Mechanic Summary',
        path: `/mechanic-summary/${moment().format("YYYY-MM-DD")}/${moment().subtract(2, "weeks").format("YYYY-MM-DD")}`,
        permission: 'mechanic-summary',
        icon: 'handyman',
      },
    ],
  },
  {
    title: 'Backoffice',
    icon: 'business_center',
    items: [
      {
        label: 'Performance Dashboard',
        path: `/performance-dashboard/${moment().startOf('month').format("YYYY-MM")}/${moment().endOf('month').format("YYYY-MM")}`,
        permission: 'deal-dashboard',
        icon: 'analytics',
      },
      {
        label: 'Shipping Dashboard',
        path: '/shipping-dashboard',
        permission: 'deal-dashboard',
        icon: 'local_shipping',
      },
      {
        label: 'Accounting Dashboard',
        path: '/accounting',
        permission: 'accounting',
        icon: 'account_balance',
      },
      {
        label: 'DMV Dashboard',
        path: '/dmv-dashboard',
        permission: 'dmv-dashboard',
        icon: 'assignment',
      },
      {
        label: 'Banking Management',
        path: '/banking',
        permission: 'accounting',
        icon: 'credit_card',
      },
      {
        label: 'Vendor Dashboard',
        path: '/vendor-dashboard',
        permission: 'accounting',
        icon: 'store',
      },
    ],
  },
  {
    title: 'Quick Actions',
    icon: 'bolt',
    items: [
      {
        label: 'Add Car',
        action: 'addCar',
        permission: 'add-car',
        icon: 'directions_car',
        color: 'primary',
      },
      {
        label: 'Add Service Order',
        action: 'addServiceOrder',
        permission: 'service-pipeline',
        icon: 'build_circle',
        color: 'secondary',
      },
    ],
  },
];

// User section (always at the bottom)
export const userSection = {
  title: 'User',
  icon: 'person',
  items: [
    {
      label: 'Sign Out',
      action: 'signOut',
      permission: null,
      icon: 'logout',
      color: 'error',
    },
  ],
};

export function renderMenuSections(StateManager, navigate, handleAction, classes) {
  return <>
    {menuSections.map((section) => (
      <Box key={section.title} className={classes.menuSection}>
        <Typography className={classes.menuSectionTitle}>
          {iconMap[section.icon] && React.createElement(iconMap[section.icon], { fontSize: 'small' })}
          {section.title}
        </Typography>
        {section.items.map((item) => {
          if (item.permission && !StateManager.isUserAllowed(item.permission)) {
            return null;
          }
          const IconComponent = iconMap[item.icon];
          return (
            <MenuItem
              key={item.label}
              className={classes.menuItem}
              onClick={() => item.path ? navigate(item.path) : handleAction(item.action)}
              sx={[
                item.color ? { color: `${item.color}.main` } : {},
                { pl: 4 }
              ]}
            >
              {IconComponent && (
                <ListItemIcon className={classes.menuItemIcon}>
                  {React.createElement(IconComponent)}
                </ListItemIcon>
              )}
              <ListItemText 
                primary={item.label}
                className={classes.menuItemText}
              />
            </MenuItem>
          );
        })}
      </Box>
    ))}
    <Divider className={classes.divider} />
    <Box className={classes.menuSection}>
      <Typography className={classes.menuSectionTitle}>
        {iconMap[userSection.icon] && React.createElement(iconMap[userSection.icon], { fontSize: 'small' })}
        {userSection.title}
      </Typography>
      {userSection.items.map((item) => {
        if (item.permission && !StateManager.isUserAllowed(item.permission)) {
          return null;
        }
        const IconComponent = iconMap[item.icon];
        return (
          <MenuItem
            key={item.label}
            className={classes.menuItem}
            onClick={() => item.path ? navigate(item.path) : handleAction(item.action)}
            sx={[
              item.color ? { color: `${item.color}.main` } : {},
              { pl: 4 }
            ]}
          >
            {IconComponent && (
              <ListItemIcon className={classes.menuItemIcon}>
                {React.createElement(IconComponent)}
              </ListItemIcon>
            )}
            <ListItemText 
              primary={item.label}
              className={classes.menuItemText}
            />
          </MenuItem>
        );
      })}
    </Box>
  </>;
} 