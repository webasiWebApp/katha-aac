import { useFonts } from 'expo-font';

export function useAppFonts() {
  return useFonts({
    NotoSans_400Regular: require('../../../assets/fonts/NotoSans_400Regular.ttf'),
    NotoSans_600SemiBold: require('../../../assets/fonts/NotoSans_600SemiBold.ttf'),
    NotoSans_700Bold: require('../../../assets/fonts/NotoSans_700Bold.ttf'),
    NotoSansSinhala_400Regular: require('../../../assets/fonts/NotoSansSinhala_400Regular.ttf'),
    NotoSansSinhala_500Medium: require('../../../assets/fonts/NotoSansSinhala_500Medium.ttf'),
    NotoSansSinhala_600SemiBold: require('../../../assets/fonts/NotoSansSinhala_600SemiBold.ttf'),
  });
}
