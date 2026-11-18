import { AppState, Platform, Vibration } from 'react-native';
import type { AudioPlayer } from 'expo-audio';

let versao = 0;
let player: AudioPlayer | undefined;
let preparada = false;
export const telaAlarmeDisponivel = () => preparada;
export function prepararTelaAlarme(valor: boolean) { preparada = valor; }

export function pararAlerta() {
  versao++;
  Vibration.cancel();
  if (player) {
    const anterior = player; player = undefined;
    try { anterior.pause(); } catch { /* Already released by the native session. */ }
    try { anterior.remove(); } catch { /* Cleanup must not prevent confirming a dose. */ }
  }
}

// This audio accompanies a visible alarm only; scheduling remains with the OS.
export async function iniciarAlerta() {
  pararAlerta();
  const atual = versao;
  if (AppState.currentState !== 'active') return;
  // Dynamic import lets an older development build retain the visual alarm on failure.
  const audio = await import('expo-audio');
  if (atual !== versao || AppState.currentState !== 'active') return;
  await audio.setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false,
    allowsRecording: false, interruptionMode: 'mixWithOthers' });
  if (atual !== versao || AppState.currentState !== 'active') return;
  player = audio.createAudioPlayer(require('../../assets/sounds/syncmed-alarme.wav'));
  player.loop = true;
  player.play();
  if (Platform.OS !== 'web') Vibration.vibrate([0, 400, 200, 400]);
}
