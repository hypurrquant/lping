import { useState, useEffect, useMemo } from "react";
import type { Theme } from "../types";

export function useTheme() {
  // Default to dark mode for MiniApp consistency
  const [darkMode, setDarkMode] = useState(true);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(saved === 'true');
    } else {
      // Default to dark mode if no preference saved
      setDarkMode(true);
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const theme: Theme = useMemo(() => ({
    // Dark mode colors matched with Explore/Analyze pages
    bg: darkMode ? '#000000' : '#ffffff',
    bgSecondary: darkMode ? '#0a0a0a' : '#fafafa',
    bgCard: darkMode ? '#111111' : '#ffffff',
    border: darkMode ? '#1f2937' : '#eee',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#666',
    success: darkMode ? '#10b981' : '#2e7d32',
    successBg: darkMode ? 'rgba(16, 185, 129, 0.1)' : '#e8f5e9',
    successBorder: darkMode ? 'rgba(16, 185, 129, 0.3)' : '#c8e6c9',
    warning: darkMode ? '#f59e0b' : '#c62828',
    warningBg: darkMode ? 'rgba(245, 158, 11, 0.1)' : '#ffebee',
    primary: darkMode ? '#10b981' : '#1976d2',
    skeleton: darkMode ? '#1f2937' : '#f3f3f3',
    infoBg: darkMode ? '#1f2937' : '#fff8e1',
    infoBorder: darkMode ? '#374151' : '#ffecb5',
  }), [darkMode]);

  return { darkMode, setDarkMode, theme };
}

