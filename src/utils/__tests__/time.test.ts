import { toStorage, fromStorage } from '../time';

describe('Time utilities', () => {
  test('toStorage and fromStorage are symmetrical', () => {
    // Create a date object
    const originalDate = new Date();
    
    // Convert to storage format
    const storageFormat = toStorage(originalDate);
    
    // Convert back to Date
    const restoredDate = fromStorage(storageFormat);
    
    // Ensure the timestamps match (within 1ms to account for any tiny precision loss)
    expect(Math.abs(originalDate.getTime() - restoredDate.getTime())).toBeLessThanOrEqual(1);
    
    // Also test with a specific date string
    const specificDateStr = '2023-05-15T14:30:00.000Z';
    const specificDate = new Date(specificDateStr);
    
    // Through our storage functions
    const storedSpecific = toStorage(specificDate);
    const restoredSpecific = fromStorage(storedSpecific);
    
    // Timestamps should match
    expect(Math.abs(specificDate.getTime() - restoredSpecific.getTime())).toBeLessThanOrEqual(1);
  });
}); 