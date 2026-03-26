import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WEATHER_CODES = {
  0:  { emoji: '☀️',  label: 'Clear sky' },
  1:  { emoji: '🌤',  label: 'Mainly clear' },
  2:  { emoji: '⛅️', label: 'Partly cloudy' },
  3:  { emoji: '☁️',  label: 'Overcast' },
  45: { emoji: '🌫',  label: 'Foggy' },
  48: { emoji: '🌫',  label: 'Icy fog' },
  51: { emoji: '🌦',  label: 'Light drizzle' },
  53: { emoji: '🌦',  label: 'Drizzle' },
  55: { emoji: '🌧',  label: 'Heavy drizzle' },
  61: { emoji: '🌧',  label: 'Light rain' },
  63: { emoji: '🌧',  label: 'Rain' },
  65: { emoji: '🌧',  label: 'Heavy rain' },
  71: { emoji: '🌨',  label: 'Light snow' },
  73: { emoji: '❄️',  label: 'Snow' },
  75: { emoji: '❄️',  label: 'Heavy snow' },
  80: { emoji: '🌦',  label: 'Rain showers' },
  85: { emoji: '🌨',  label: 'Snow showers' },
  95: { emoji: '⛈',  label: 'Thunderstorm' },
  99: { emoji: '⛈',  label: 'Thunderstorm + hail' },
};

const getWeather = (code) =>
  WEATHER_CODES[code] ?? { emoji: '🌡', label: `Code ${code}` };

const tempColor = (temp) => {
  if (temp === null || temp === undefined) return '#E3F2FD';
  if (temp <= -10) return '#BBDEFB'; 
  if (temp <= 0)   return '#C8E6C9'; 
  if (temp <= 15)  return '#E8F5E9'; 
  if (temp <= 25)  return '#FFF9C4'; 
  return '#FFE0B2';                  
};

export default function InfoScreen() {
  const [weather, setWeather]       = useState(null);
  const [forecast, setForecast]     = useState([]);
  const [cityName, setCityName]     = useState('');
  const [rate, setRate]             = useState(null);
  const [rateTime, setRateTime]     = useState('');
  const [image, setImage]           = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingRate, setLoadingRate]       = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [locationError, setLocationError]   = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoadingWeather(true);
    setLoadingRate(true);
    await Promise.all([fetchWeather(), fetchRate()]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWeather(), fetchRate()]);
    setRefreshing(false);
  }, []);

  const fetchWeather = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Using Pavlodar as default.');
        await fetchWeatherByCoords(52.2873, 76.9674, 'Pavlodar');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const { latitude, longitude } = loc.coords;

      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const city = geo?.city || geo?.subregion || geo?.region || 'Your city';
      setCityName(city);

      await fetchWeatherByCoords(latitude, longitude, city);
    } catch (e) {
      console.log('Location error:', e);
      setLocationError('Could not get location.');
      await fetchWeatherByCoords(52.2873, 76.9674, 'Pavlodar');
    } finally {
      setLoadingWeather(false);
    }
  };

  const fetchWeatherByCoords = async (lat, lon, city) => {
    setCityName(city);
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
        `&timezone=auto`;

      const res  = await fetch(url);
      const data = await res.json();

      setWeather(data.current_weather);

      const days = data.daily.time.map((date, i) => ({
        date,
        code:    data.daily.weathercode[i],
        maxTemp: Math.round(data.daily.temperature_2m_max[i]),
        minTemp: Math.round(data.daily.temperature_2m_min[i]),
      }));
      setForecast(days);
    } catch (e) {
      console.log('Weather fetch error:', e);
    }
  };

  const fetchRate = async () => {
    try {
      const res  = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();

      if (data.result === 'success') {
        setRate(Math.round(data.rates.KZT));
        const d = new Date(data.time_last_update_utc);
        setRateTime(
          d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) +
          ' ' +
          d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        );
      }
    } catch (e) {
      console.log('Rate fetch error:', e);
    } finally {
      setLoadingRate(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow access to your photo library in Settings to pick an image.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const shortDay = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const bgColor = tempColor(weather?.temperature);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90D9" />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Info Dashboard</Text>
        <Text style={styles.pageSubtitle}>Pull down to refresh</Text>

        <View style={[styles.card, { backgroundColor: bgColor }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionLabel}>🌍 Weather</Text>
            {locationError ? (
              <Text style={styles.errorNote}>{locationError}</Text>
            ) : null}
          </View>

          {loadingWeather ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#4A90D9" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : weather ? (
            <>
              <Text style={styles.cityName}>📍 {cityName}</Text>

              <View style={styles.weatherMain}>
                <Text style={styles.weatherEmoji}>
                  {getWeather(weather.weathercode).emoji}
                </Text>
                <Text style={styles.temperature}>
                  {Math.round(weather.temperature)}°C
                </Text>
              </View>

              <Text style={styles.weatherLabel}>
                {getWeather(weather.weathercode).label}
              </Text>

              <View style={styles.weatherMeta}>
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>
                    💨 {Math.round(weather.windspeed)} km/h wind
                  </Text>
                </View>
              </View>

              <Text style={styles.forecastTitle}>7-Day Forecast</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.forecastRow}
              >
                {forecast.map((day, i) => (
                  <View
                    key={day.date}
                    style={[
                      styles.forecastDay,
                      i === 0 && styles.forecastDayToday,
                    ]}
                  >
                    <Text style={styles.forecastDayName}>{shortDay(day.date)}</Text>
                    <Text style={styles.forecastEmoji}>
                      {getWeather(day.code).emoji}
                    </Text>
                    <Text style={styles.forecastMax}>{day.maxTemp}°</Text>
                    <Text style={styles.forecastMin}>{day.minTemp}°</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : (
            <Text style={styles.errorNote}>Could not load weather.</Text>
          )}
        </View>

        <View style={[styles.card, styles.rateCard]}>
          <Text style={styles.sectionLabel}>💵 Exchange Rate</Text>

          {loadingRate ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#4A90D9" />
              <Text style={styles.loadingText}>Fetching rate...</Text>
            </View>
          ) : rate ? (
            <>
              <View style={styles.rateRow}>
                <View style={styles.currencyBox}>
                  <Text style={styles.currencyFlag}>🇺🇸</Text>
                  <Text style={styles.currencyCode}>USD</Text>
                  <Text style={styles.currencyAmount}>1</Text>
                </View>

                <Text style={styles.rateArrow}>→</Text>

                <View style={styles.currencyBox}>
                  <Text style={styles.currencyFlag}>🇰🇿</Text>
                  <Text style={styles.currencyCode}>KZT</Text>
                  <Text style={styles.currencyAmount}>{rate.toLocaleString()}</Text>
                </View>
              </View>

              <Text style={styles.rateUpdated}>Updated: {rateTime}</Text>

              <Text style={styles.converterTitle}>Quick reference</Text>
              <View style={styles.converterGrid}>
                {[10, 50, 100, 500].map((usd) => (
                  <View key={usd} style={styles.converterChip}>
                    <Text style={styles.converterUsd}>${usd}</Text>
                    <Text style={styles.converterKzt}>
                      {(usd * rate).toLocaleString()} ₸
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.errorNote}>Could not load rate.</Text>
          )}
        </View>

        <View style={[styles.card, styles.imageCard]}>
          <Text style={styles.sectionLabel}>🖼 My Photo</Text>
          <Text style={styles.imageHint}>
            Pick any image from your camera roll to display it here.
          </Text>

          <TouchableOpacity style={styles.pickBtn} onPress={pickImage} activeOpacity={0.8}>
            <Text style={styles.pickBtnText}>
              {image ? '🔄  Change Photo' : '📷  Choose Photo'}
            </Text>
          </TouchableOpacity>

          {image ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: image }}
                style={styles.pickedImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => setImage(null)}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>🖼</Text>
              <Text style={styles.placeholderText}>No image selected yet</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scroll: {
    padding: 16,
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 18,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  loadingBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#888',
  },
  errorNote: {
    fontSize: 12,
    color: '#E53935',
    marginBottom: 4,
  },

  cityName: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
    fontWeight: '500',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  weatherEmoji: {
    fontSize: 56,
  },
  temperature: {
    fontSize: 64,
    fontWeight: '200',
    color: '#111',
    letterSpacing: -2,
  },
  weatherLabel: {
    fontSize: 18,
    color: '#444',
    marginBottom: 12,
    fontWeight: '400',
  },
  weatherMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  metaChip: {
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metaChipText: {
    fontSize: 13,
    color: '#444',
  },
  forecastTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forecastRow: {
    gap: 8,
    paddingRight: 4,
  },
  forecastDay: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    minWidth: 62,
    gap: 3,
  },
  forecastDayToday: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(74,144,217,0.4)',
  },
  forecastDayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  forecastEmoji: {
    fontSize: 22,
    marginVertical: 2,
  },
  forecastMax: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  forecastMin: {
    fontSize: 12,
    color: '#888',
  },

  rateCard: {
    backgroundColor: '#fff',
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingVertical: 10,
    backgroundColor: '#F7F7FA',
    borderRadius: 14,
  },
  currencyBox: {
    alignItems: 'center',
    gap: 2,
  },
  currencyFlag: {
    fontSize: 30,
  },
  currencyCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  currencyAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
  },
  rateArrow: {
    fontSize: 22,
    color: '#4A90D9',
    fontWeight: '300',
  },
  rateUpdated: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 14,
  },
  converterTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  converterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  converterChip: {
    backgroundColor: '#EEF5FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: (SCREEN_WIDTH - 80) / 2,
    flex: 1,
  },
  converterUsd: {
    fontSize: 13,
    color: '#4A90D9',
    fontWeight: '600',
  },
  converterKzt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginTop: 2,
  },

  imageCard: {
    backgroundColor: '#fff',
  },
  imageHint: {
    fontSize: 13,
    color: '#888',
    marginBottom: 14,
    lineHeight: 18,
  },
  pickBtn: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 16,
  },
  pickBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  pickedImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePlaceholder: {
    height: 160,
    backgroundColor: '#F7F7FA',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    gap: 8,
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  placeholderText: {
    fontSize: 13,
    color: '#bbb',
  },
});
