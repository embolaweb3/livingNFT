export async function getUserCity(): Promise<string | null> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return null;
    }
  
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
  
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await res.json();
            console.log('Location data:', data);
            const city = data.address.city || data.address.town || data.address.village || null;
            resolve(city);
          } catch (error) {
            console.error('Failed to fetch city:', error);
            resolve(null);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        }
      );
    });
  }
  