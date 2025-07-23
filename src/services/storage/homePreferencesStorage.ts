import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeScreenPreferences, defaultHomePreferences } from '../../types/homeCustomization';

class HomePreferencesStorage {
  private readonly STORAGE_KEY = '@home_preferences';

  async getPreferences(): Promise<HomeScreenPreferences> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const preferences = JSON.parse(stored);
        // Ensure all default components exist (for app updates)
        const mergedComponents = defaultHomePreferences.components.map(defaultComp => {
          const existingComp = preferences.components?.find((c: any) => c.id === defaultComp.id);
          return existingComp || defaultComp;
        });
        
        return {
          ...defaultHomePreferences,
          ...preferences,
          components: mergedComponents,
        };
      }
      return defaultHomePreferences;
    } catch (error) {
      console.error('Failed to load home preferences:', error);
      return defaultHomePreferences;
    }
  }

  async savePreferences(preferences: HomeScreenPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save home preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  async resetToDefaults(): Promise<HomeScreenPreferences> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      return defaultHomePreferences;
    } catch (error) {
      console.error('Failed to reset home preferences:', error);
      throw new Error('Failed to reset preferences');
    }
  }

  async toggleComponentVisibility(componentId: string): Promise<HomeScreenPreferences> {
    const preferences = await this.getPreferences();
    const updatedComponents = preferences.components.map(component => 
      component.id === componentId 
        ? { ...component, visible: !component.visible }
        : component
    );
    
    const updatedPreferences = {
      ...preferences,
      components: updatedComponents,
    };
    
    await this.savePreferences(updatedPreferences);
    return updatedPreferences;
  }

  async reorderComponents(componentIds: string[]): Promise<HomeScreenPreferences> {
    const preferences = await this.getPreferences();
    const reorderedComponents = componentIds.map((id, index) => {
      const component = preferences.components.find(c => c.id === id);
      return component ? { ...component, order: index + 1 } : null;
    }).filter(Boolean) as any[];
    
    const updatedPreferences = {
      ...preferences,
      components: reorderedComponents,
    };
    
    await this.savePreferences(updatedPreferences);
    return updatedPreferences;
  }

  async updateQuickActionsPreferences(quickActions: HomeScreenPreferences['quickActions']): Promise<HomeScreenPreferences> {
    const preferences = await this.getPreferences();
    const updatedPreferences = {
      ...preferences,
      quickActions,
    };
    
    await this.savePreferences(updatedPreferences);
    return updatedPreferences;
  }

  async updateThemePreferences(theme: HomeScreenPreferences['theme']): Promise<HomeScreenPreferences> {
    const preferences = await this.getPreferences();
    const updatedPreferences = {
      ...preferences,
      theme,
    };
    
    await this.savePreferences(updatedPreferences);
    return updatedPreferences;
  }
}

export const homePreferencesStorage = new HomePreferencesStorage();