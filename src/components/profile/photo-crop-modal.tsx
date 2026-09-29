import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { Palette } from '@/constants/theme';

const FRAME = 280;
const OUTPUT = 320;

async function cropImage(uri: string, originX: number, originY: number, size: number) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return cropOnCanvas(uri, originX, originY, size);
  }
  const result = await manipulateAsync(
    uri,
    [
      { crop: { originX, originY, width: size, height: size } },
      { resize: { width: OUTPUT, height: OUTPUT } },
    ],
    { compress: 0.7, format: SaveFormat.JPEG, base64: true },
  );
  return `data:image/jpeg;base64,${result.base64}`;
}

function cropOnCanvas(uri: string, originX: number, originY: number, size: number) {
  return new Promise<string>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas indisponible.'));
        return;
      }
      ctx.drawImage(img, originX, originY, size, size, 0, 0, OUTPUT, OUTPUT);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => reject(new Error('Impossible de lire l’image.'));
    img.src = uri;
  });
}

export function PhotoCropModal({
  uri,
  onCancel,
  onSave,
}: {
  uri: string;
  onCancel: () => void;
  onSave: (photo: string) => Promise<void> | void;
}) {
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  useEffect(() => {
    Image.getSize(
      uri,
      (w, h) => setNatural({ w, h }),
      () => setNatural({ w: FRAME, h: FRAME }),
    );
  }, [uri]);

  const display = useMemo(() => {
    if (!natural.w || !natural.h) return { w: FRAME, h: FRAME };
    const cover = Math.max(FRAME / natural.w, FRAME / natural.h);
    return { w: natural.w * cover, h: natural.h * cover };
  }, [natural]);

  useEffect(() => {
    setOffset({
      x: (FRAME - display.w) / 2,
      y: (FRAME - display.h) / 2,
    });
  }, [display.w, display.h]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start.current = offsetRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          const minX = FRAME - display.w;
          const minY = FRAME - display.h;
          setOffset({
            x: Math.min(0, Math.max(minX, start.current.x + gesture.dx)),
            y: Math.min(0, Math.max(minY, start.current.y + gesture.dy)),
          });
        },
      }),
    [display.w, display.h],
  );

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const scale = natural.w / display.w;
      const originX = Math.max(0, Math.round(-offset.x * scale));
      const originY = Math.max(0, Math.round(-offset.y * scale));
      const size = Math.min(natural.w - originX, natural.h - originY, Math.round(FRAME * scale));
      const photo = await cropImage(uri, originX, originY, size);
      if (photo.length > 700_000) {
        setError('Image trop lourde. Recadrez plus serré.');
        return;
      }
      await onSave(photo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recadrage impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Recadrer la photo</Text>
          <Text style={styles.hint}>Faites glisser pour cadrer le visage.</Text>
          <View style={styles.frame} {...responder.panHandlers}>
            <Image
              source={{ uri }}
              style={{
                width: display.w,
                height: display.h,
                transform: [{ translateX: offset.x }, { translateY: offset.y }],
              }}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable disabled={busy} onPress={onCancel} style={styles.cancel}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
            <Pressable disabled={busy} onPress={() => void save()} style={styles.save}>
              {busy ? (
                <ActivityIndicator color={Palette.ink} />
              ) : (
                <Text style={styles.saveText}>Enregistrer</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,22,34,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Palette.white,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: Palette.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  hint: {
    color: Palette.ink,
    opacity: 0.55,
    fontSize: 13,
  },
  frame: {
    width: FRAME,
    height: FRAME,
    borderRadius: FRAME / 2,
    overflow: 'hidden',
    backgroundColor: Palette.ink,
    borderWidth: 3,
    borderColor: Palette.gold,
  },
  error: {
    color: Palette.ink,
    fontSize: 13,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  cancel: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: Palette.ink,
    fontWeight: '700',
  },
  save: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: Palette.ink,
    fontWeight: '800',
  },
});
