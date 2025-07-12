import type { 
  Category, 
  PrayerCard, 
  PrayerRequest, 
  PrayerCardWithDetails,
  UserReminderSettings 
} from "@shared/schema";

// Local storage keys
const GUEST_CATEGORIES_KEY = 'prayer-cards-guest-categories';
const GUEST_PRAYER_CARDS_KEY = 'prayer-cards-guest-prayer-cards';
const GUEST_PRAYER_REQUESTS_KEY = 'prayer-cards-guest-prayer-requests';
const GUEST_REMINDER_SETTINGS_KEY = 'prayer-cards-guest-reminder-settings';

// Generate local IDs for guest data - using timestamp to ensure uniqueness
let categoryId = Date.now() + 1000;
let prayerCardId = Date.now() + 2000;
let requestId = Date.now() + 3000;

export class LocalStorageService {
  // Categories
  getCategories(): Category[] {
    // Clear all data once to fix any existing duplicate ID issues
    if (!localStorage.getItem('prayer-cards-cleaned')) {
      this.clearAllData();
      localStorage.setItem('prayer-cards-cleaned', 'true');
    }
    
    // One-time cleanup completed - categories now stable
    
    // Check if categories already exist in storage
    const existingCategories = localStorage.getItem(GUEST_CATEGORIES_KEY);
    if (existingCategories) {
      try {
        return JSON.parse(existingCategories);
      } catch (error) {
        console.error('Error parsing existing categories:', error);
      }
    }
    
    // Only create new categories if none exist
    const defaultCategories = this.getDefaultCategories();
    this.saveCategories(defaultCategories);
    return defaultCategories;
  }

  saveCategories(categories: Category[]): void {
    localStorage.setItem(GUEST_CATEGORIES_KEY, JSON.stringify(categories));
  }

  createCategory(name: string, color: string, icon: string): Category {
    const categories = this.getCategories();
    const newCategory: Category = {
      id: categoryId++,
      name,
      color,
      icon,
      isDefault: false,
      userId: null,
      createdAt: new Date()
    };
    categories.push(newCategory);
    this.saveCategories(categories);
    return newCategory;
  }

  // Prayer Cards
  getPrayerCards(): PrayerCardWithDetails[] {
    const cardsData = localStorage.getItem(GUEST_PRAYER_CARDS_KEY);
    const cards: PrayerCard[] = cardsData ? JSON.parse(cardsData) : [];
    const categories = this.getCategories();
    const requests = this.getPrayerRequests();

    return cards.map(card => {
      const category = categories.find(c => c.id === card.categoryId) || null;
      const cardRequests = requests.filter(r => r.prayerCardId === card.id);
      const activeRequestsCount = cardRequests.filter(r => !r.isArchived).length;

      return {
        ...card,
        category,
        prayerRequests: cardRequests,
        activeRequestsCount
      };
    });
  }

  getPrayerCardsByFrequency(frequency: string): PrayerCardWithDetails[] {
    if (frequency === "daily") {
      // Match server logic: combine daily, weekly (for today), and monthly (for today's date)
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayDate = new Date().getDate();
      
      const allCards = this.getPrayerCards();
      const dailyCards = allCards.filter(card => card.frequency === "daily");
      const weeklyCards = allCards.filter(card => 
        card.frequency === "weekly" && card.dayOfWeek === today
      );
      const monthlyCards = allCards.filter(card => 
        card.frequency === "monthly" && card.dayOfMonth === todayDate
      );
      
      // Combine and randomize if needed (matching server logic)
      if (dailyCards.length <= 3) {
        return [...dailyCards, ...weeklyCards, ...monthlyCards];
      } else {
        // Simple shuffle using date as seed
        const dateString = new Date().toISOString().split('T')[0];
        const dateSeed = dateString.split('-').join('');
        const shuffled = [...dailyCards];
        
        // Fisher-Yates shuffle with seeded random
        let seed = parseInt(dateSeed);
        for (let i = shuffled.length - 1; i > 0; i--) {
          seed = (seed * 9301 + 49297) % 233280;
          const j = Math.floor((seed / 233280) * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return [...shuffled.slice(0, 3), ...weeklyCards, ...monthlyCards];
      }
    }
    
    // For other frequencies, just filter by exact match
    return this.getPrayerCards().filter(card => card.frequency === frequency);
  }

  getPrayerCardsByFrequencyAndDay(frequency: string, dayOfWeek: string): PrayerCardWithDetails[] {
    return this.getPrayerCards().filter(card => 
      card.frequency === frequency && card.dayOfWeek === dayOfWeek
    );
  }

  getPrayerCardsByFrequencyAndMonth(frequency: string, dayOfMonth: number): PrayerCardWithDetails[] {
    return this.getPrayerCards().filter(card => 
      card.frequency === frequency && (
        card.dayOfMonth === dayOfMonth || 
        (card.daysOfMonth && card.daysOfMonth.includes(dayOfMonth))
      )
    );
  }

  createPrayerCard(data: {
    name: string;
    frequency: string;
    categoryId: number;
    scriptures?: string[];
    scriptureReferences?: string[];
    dayOfWeek?: string;
    dayOfMonth?: number;
    daysOfMonth?: number[];
  }): PrayerCard {
    const cards = this.getPrayerCardsRaw();
    const newCard: PrayerCard = {
      id: prayerCardId++,
      name: data.name,
      frequency: data.frequency,
      categoryId: data.categoryId,
      scriptures: data.scriptures || [],
      scriptureReferences: data.scriptureReferences || [],
      dayOfWeek: data.dayOfWeek || null,
      dayOfMonth: data.dayOfMonth || null,
      daysOfMonth: data.daysOfMonth || null,
      userId: "guest",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    cards.push(newCard);
    this.savePrayerCards(cards);
    return newCard;
  }

  updatePrayerCard(id: number, updates: Partial<PrayerCard>): PrayerCard | null {
    const cards = this.getPrayerCardsRaw();
    const index = cards.findIndex(c => c.id === id);
    if (index === -1) return null;

    cards[index] = { ...cards[index], ...updates, updatedAt: new Date() };
    this.savePrayerCards(cards);
    return cards[index];
  }

  deletePrayerCard(id: number): boolean {
    const cards = this.getPrayerCardsRaw();
    const filtered = cards.filter(c => c.id !== id);
    if (filtered.length === cards.length) return false;
    
    this.savePrayerCards(filtered);
    // Also delete related requests
    const requests = this.getPrayerRequests().filter(r => r.prayerCardId !== id);
    this.savePrayerRequests(requests);
    return true;
  }

  // Prayer Requests
  getPrayerRequests(): PrayerRequest[] {
    const data = localStorage.getItem(GUEST_PRAYER_REQUESTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getPrayerRequestsByCard(prayerCardId: number): PrayerRequest[] {
    return this.getPrayerRequests().filter(r => r.prayerCardId === prayerCardId);
  }

  createPrayerRequest(data: {
    text: string;
    prayerCardId: number;
  }): PrayerRequest {
    const requests = this.getPrayerRequests();
    const newRequest: PrayerRequest = {
      id: requestId++,
      text: data.text,
      prayerCardId: data.prayerCardId,
      isArchived: false,
      archivedAt: null,
      createdAt: new Date()
    };
    requests.push(newRequest);
    this.savePrayerRequests(requests);
    return newRequest;
  }

  updatePrayerRequest(id: number, updates: Partial<PrayerRequest>): PrayerRequest | null {
    const requests = this.getPrayerRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) return null;

    requests[index] = { ...requests[index], ...updates };
    this.savePrayerRequests(requests);
    return requests[index];
  }

  archivePrayerRequest(id: number): boolean {
    const requests = this.getPrayerRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) return false;

    requests[index] = { ...requests[index], isArchived: true, archivedAt: new Date() };
    this.savePrayerRequests(requests);
    return true;
  }

  deletePrayerRequest(id: number): boolean {
    const requests = this.getPrayerRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index === -1) return false;

    requests.splice(index, 1);
    this.savePrayerRequests(requests);
    return true;
  }

  // Reminder Settings
  getReminderSettings(): UserReminderSettings | null {
    const data = localStorage.getItem(GUEST_REMINDER_SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  }

  saveReminderSettings(settings: {
    enableReminders: boolean;
    reminderTimes: string[];
    enableBrowserNotifications: boolean;
    timezone?: string;
  }): UserReminderSettings {
    const reminderSettings: UserReminderSettings = {
      id: 1,
      userId: "guest",
      enableReminders: settings.enableReminders,
      reminderTimes: settings.reminderTimes,
      timezone: settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      enableBrowserNotifications: settings.enableBrowserNotifications || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    localStorage.setItem(GUEST_REMINDER_SETTINGS_KEY, JSON.stringify(reminderSettings));
    return reminderSettings;
  }

  // Utility methods
  private getPrayerCardsRaw(): PrayerCard[] {
    const data = localStorage.getItem(GUEST_PRAYER_CARDS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private savePrayerCards(cards: PrayerCard[]): void {
    localStorage.setItem(GUEST_PRAYER_CARDS_KEY, JSON.stringify(cards));
  }

  private savePrayerRequests(requests: PrayerRequest[]): void {
    localStorage.setItem(GUEST_PRAYER_REQUESTS_KEY, JSON.stringify(requests));
  }

  private getDefaultCategories(): Category[] {
    return [
      { id: categoryId++, name: "Family", color: "#10B981", icon: "fas fa-home", isDefault: true, userId: null, createdAt: new Date() },
      { id: categoryId++, name: "Friends", color: "#F59E0B", icon: "fas fa-users", isDefault: true, userId: null, createdAt: new Date() },
      { id: categoryId++, name: "Personal", color: "#EF4444", icon: "fas fa-heart", isDefault: true, userId: null, createdAt: new Date() },
      { id: categoryId++, name: "Work", color: "#8B5CF6", icon: "fas fa-briefcase", isDefault: true, userId: null, createdAt: new Date() },
      { id: categoryId++, name: "Non Believer", color: "#EC4899", icon: "fas fa-cross", isDefault: true, userId: null, createdAt: new Date() },
      { id: categoryId++, name: "Small Group", color: "#06B6D4", icon: "fas fa-church", isDefault: true, userId: null, createdAt: new Date() },
      { id: categoryId++, name: "World Issues", color: "#DC2626", icon: "fas fa-globe", isDefault: true, userId: null, createdAt: new Date() },
      { id: categoryId++, name: "Leadership", color: "#6B73FF", icon: "fas fa-crown", isDefault: true, userId: null, createdAt: new Date() }
    ];
  }

  // Clear all guest data
  clearAllData(): void {
    localStorage.removeItem(GUEST_CATEGORIES_KEY);
    localStorage.removeItem(GUEST_PRAYER_CARDS_KEY);
    localStorage.removeItem(GUEST_PRAYER_REQUESTS_KEY);
    localStorage.removeItem(GUEST_REMINDER_SETTINGS_KEY);
    // Reset ID counters
    categoryId = Date.now() + 1000;
    prayerCardId = Date.now() + 2000;
    requestId = Date.now() + 3000;
  }

  // Force refresh categories (useful when categories structure changes)
  refreshCategories(): void {
    localStorage.removeItem(GUEST_CATEGORIES_KEY);
    // Categories will be re-initialized on next access
  }

  // Get all guest data for migration to account
  exportGuestData() {
    return {
      categories: this.getCategories().filter(c => !c.isDefault),
      prayerCards: this.getPrayerCardsRaw(),
      prayerRequests: this.getPrayerRequests(),
      reminderSettings: this.getReminderSettings()
    };
  }

  // Check if user has any guest data
  hasGuestData(): boolean {
    const cards = this.getPrayerCardsRaw();
    const customCategories = this.getCategories().filter(c => !c.isDefault);
    const requests = this.getPrayerRequests();
    return cards.length > 0 || customCategories.length > 0 || requests.length > 0;
  }
}

export const localStorageService = new LocalStorageService();