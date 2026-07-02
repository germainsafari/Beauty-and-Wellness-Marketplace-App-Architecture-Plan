import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getApiUrl, getToken, resolveUploadUrl } from "../lib/api";
import { colors, radius, spacing } from "../theme";

const MAX_PHOTOS = 4;

type PhotoPickerProps = {
  /** Relative upload urls ("/uploads/:id") already attached. */
  photos: string[];
  /** Called with the new full list whenever a photo is added or removed. */
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
};

async function uploadImage(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  if (!asset.base64) throw new Error("Could not read the selected image");
  const token = await getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${getApiUrl()}/uploads`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      kind: "listing",
      mimeType: asset.mimeType || "image/jpeg",
      data: asset.base64,
    }),
  });
  const json = (await res.json().catch(() => null)) as
    | { id: number; url: string }
    | { error: string }
    | null;
  if (!res.ok || !json || "error" in json) {
    throw new Error((json && "error" in json && json.error) || `Upload failed (${res.status})`);
  }
  return json.url;
}

export default function PhotoPicker({ photos, onChange, maxPhotos = MAX_PHOTOS }: PhotoPickerProps) {
  const [uploading, setUploading] = useState(false);

  const addPhotos = async () => {
    if (uploading) return;
    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to add listing photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (result.canceled || result.assets.length === 0) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const asset of result.assets.slice(0, remaining)) {
        urls.push(await uploadImage(asset));
      }
      onChange([...photos, ...urls]);
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not upload photo");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) => {
    onChange(photos.filter((p) => p !== url));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {photos.map((url) => (
          <View key={url} style={styles.thumbWrap}>
            <Image source={{ uri: resolveUploadUrl(url) }} style={styles.thumb} contentFit="cover" />
            <Pressable style={styles.removeBtn} onPress={() => removePhoto(url)} hitSlop={8}>
              <Ionicons name="close" size={14} color={colors.white} />
            </Pressable>
          </View>
        ))}

        {photos.length < maxPhotos && (
          <Pressable style={styles.addTile} onPress={addPhotos} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={colors.purple} />
            ) : (
              <>
                <Ionicons name="camera" size={26} color={colors.purple} />
                <Text style={styles.addText}>Add photo</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
      <Text style={styles.hint}>
        {photos.length === 0
          ? `Add up to ${maxPhotos} photos — listings with photos sell faster`
          : `${photos.length}/${maxPhotos} photos added`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumbWrap: { width: 76, height: 76 },
  thumb: { width: "100%", height: "100%", borderRadius: radius.lg, backgroundColor: colors.gray100 },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.purpleDark,
    alignItems: "center",
    justifyContent: "center",
  },
  addTile: {
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#C4B5FD",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: colors.purple, fontWeight: "700", fontSize: 10, marginTop: 2 },
  hint: { color: colors.gray400, fontSize: 12, marginTop: spacing.sm },
});
