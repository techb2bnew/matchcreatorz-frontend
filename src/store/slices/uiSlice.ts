import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  notificationCount: number;
}

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: 'light',
  notificationCount: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleSidebarCollapse(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setNotificationCount(state, action: PayloadAction<number>) {
      state.notificationCount = action.payload;
    },
  },
});

export const { toggleSidebar, toggleSidebarCollapse, setSidebarOpen, setNotificationCount } = uiSlice.actions;
export default uiSlice.reducer;
