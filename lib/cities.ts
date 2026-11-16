import type { City } from "@/lib/types"

export const CITIES: City[] = [
  { id: "karnal", name: "Karnal", state: "Haryana", latitude: 29.6857, longitude: 76.9905 },
  { id: "delhi", name: "Delhi", state: "Delhi", latitude: 28.6139, longitude: 77.209 },
  { id: "gurugram", name: "Gurugram", state: "Haryana", latitude: 28.4595, longitude: 77.0266 },
  { id: "noida", name: "Noida", state: "Uttar Pradesh", latitude: 28.5355, longitude: 77.391 },
  { id: "chandigarh", name: "Chandigarh", state: "Chandigarh", latitude: 30.7333, longitude: 76.7794 },
  { id: "lucknow", name: "Lucknow", state: "Uttar Pradesh", latitude: 26.8467, longitude: 80.9462 },
  { id: "kanpur", name: "Kanpur", state: "Uttar Pradesh", latitude: 26.4499, longitude: 80.3319 },
  { id: "patna", name: "Patna", state: "Bihar", latitude: 25.5941, longitude: 85.1376 },
  { id: "jaipur", name: "Jaipur", state: "Rajasthan", latitude: 26.9124, longitude: 75.7873 },
  { id: "ahmedabad", name: "Ahmedabad", state: "Gujarat", latitude: 23.0225, longitude: 72.5714 },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", latitude: 19.076, longitude: 72.8777 },
  { id: "pune", name: "Pune", state: "Maharashtra", latitude: 18.5204, longitude: 73.8567 },
  { id: "kolkata", name: "Kolkata", state: "West Bengal", latitude: 22.5726, longitude: 88.3639 },
  { id: "chennai", name: "Chennai", state: "Tamil Nadu", latitude: 13.0827, longitude: 80.2707 },
  { id: "bengaluru", name: "Bengaluru", state: "Karnataka", latitude: 12.9716, longitude: 77.5946 },
  { id: "hyderabad", name: "Hyderabad", state: "Telangana", latitude: 17.385, longitude: 78.4867 },
]

export const CITY_ITEMS = Object.fromEntries(
  CITIES.map((city) => [city.id, `${city.name}, ${city.state}`]),
) as Record<string, string>

export function findCity(id: string): City | undefined {
  return CITIES.find((city) => city.id === id)
}

export function nearestCity(latitude: number, longitude: number): City {
  return CITIES.reduce((best, city) => {
    const dBest = distance(latitude, longitude, best.latitude, best.longitude)
    const dCity = distance(latitude, longitude, city.latitude, city.longitude)
    return dCity < dBest ? city : best
  })
}

function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  return (lat1 - lat2) ** 2 + (lon1 - lon2) ** 2
}
