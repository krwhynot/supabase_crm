import { computed, watch, ref } from 'vue';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  isDark: boolean;
  icon: 'sun' | 'moon' | 'system';
}

// Simple localStorage implementation without @vueuse/core
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('theme');
  return (stored as Theme) || 'system';
};

const setStoredTheme = (newTheme: Theme) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', newTheme);
  }
};

const getSystemPreference = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const theme = ref<Theme>(getStoredTheme());
const systemPreference = ref<'light' | 'dark'>(getSystemPreference());

// Listen for system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const updateSystemPreference = () => {
    systemPreference.value = mediaQuery.matches ? 'dark' : 'light';
  };
  mediaQuery.addEventListener('change', updateSystemPreference);
}

export function useTheme() {
  const isDark = computed(() => {
    if (theme.value === 'system') {
      return systemPreference.value === 'dark';
    }
    return theme.value === 'dark';
  });

  const themeConfig = computed<ThemeConfig>(() => ({
    theme: theme.value,
    isDark: isDark.value,
    icon: theme.value === 'system' ? 'system' : isDark.value ? 'moon' : 'sun',
  }));

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;
    setStoredTheme(newTheme);
  };

  const toggleTheme = () => {
    if (theme.value === 'light') {
      setTheme('dark');
    } else if (theme.value === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const applyTheme = () => {
    const root = document.documentElement;
    
    if (isDark.value) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark');
    }
  };

  watch(
    [theme, systemPreference],
    () => {
      applyTheme();
    },
    { immediate: true }
  );

  return {
    theme: readonly(theme),
    isDark: readonly(isDark),
    themeConfig: readonly(themeConfig),
    setTheme,
    toggleTheme,
    applyTheme,
  };
}

function readonly<T>(value: any) {
  return computed(() => value.value);
}