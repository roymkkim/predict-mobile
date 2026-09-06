import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContentVariant, ListItemSelect } from "@metamask/design-system-react-native";

import { colors } from "@/lib/sim/colors";
import { geist } from "@/lib/sim/geistFonts";
import type { Region } from "@/lib/sim/regionStore";
import { createSheetHeaderPan, detentEnter, sheetExit, backdropIn, backdropOut } from "@/lib/sim/sheetMotion";

const POLYMARKET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><g clip-path="url(#clip0_19653_21213)"><path d="M28 0H4C1.79086 0 0 1.79086 0 4V28C0 30.2091 1.79086 32 4 32H28C30.2091 32 32 30.2091 32 28V4C32 1.79086 30.2091 0 28 0Z" fill="#2E5CFF"/><path d="M23.49 24.3389C23.49 25.2233 23.49 25.6654 23.2008 25.8846C22.9116 26.1039 22.4858 25.9844 21.6344 25.7454L7.95126 21.9058C7.43826 21.7619 7.1817 21.6899 7.03338 21.4942C6.88507 21.2985 6.88507 21.0321 6.88507 20.4993V11.5008C6.88507 10.9679 6.88507 10.7015 7.03338 10.5058C7.1817 10.3101 7.43826 10.2381 7.95126 10.0942L21.6344 6.2545C22.4858 6.0156 22.9116 5.89613 23.2008 6.11535C23.49 6.33456 23.49 6.77675 23.49 7.66113V24.3389ZM10.2976 20.6539L21.6272 23.8336V17.4747L10.2976 20.6539ZM8.7477 19.1789L20.0751 16L8.7477 12.8211V19.1789ZM10.2974 11.3461L21.6272 14.5254V8.16644L10.2974 11.3461Z" fill="white"/></g><defs><clipPath id="clip0_19653_21213"><rect width="32" height="32" fill="white"/></clipPath></defs></svg>`;

const KALSHI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="4" fill="#00DD94"/><g clip-path="url(#clip0_19656_671)"><path d="M11.9485 14.3024C10.5497 14.3024 9.70096 14.9318 9.63335 16.0286H11.09C11.1479 15.6089 11.418 15.3896 11.8906 15.3896C12.3633 15.3896 12.6237 15.5993 12.6141 15.9332C12.6044 16.1907 12.4404 16.3052 12.0257 16.3624L11.4277 16.4387C10.0772 16.6008 9.44048 17.1063 9.44048 18.0123C9.44048 18.9183 10.0771 19.5 11.1382 19.5C11.8134 19.5 12.3246 19.2616 12.643 18.8038V19.395H14.1478V16.1525C14.1478 14.9318 13.4051 14.3024 11.9485 14.3024ZM11.6303 18.4604C11.1962 18.4604 10.955 18.2698 10.955 17.9169C10.955 17.583 11.1672 17.4209 11.7556 17.3351L12.0257 17.297C12.2646 17.2637 12.4612 17.2165 12.6237 17.1501V17.6499C12.6237 18.1267 12.2187 18.4604 11.6303 18.4604ZM14.6784 12.6049H16.2218V19.395H14.6784V12.6049ZM7.2714 15.7717L9.58528 19.395H7.5788L5.68811 16.2767V19.395H4V12.6049H5.68811V15.5695L7.71391 12.6049H9.51779L7.2714 15.7717ZM26.2636 13.3106C26.2636 12.8719 26.6494 12.5 27.1318 12.5C27.6141 12.5 28 12.8719 28 13.3106C28 13.7493 27.6141 14.1212 27.1318 14.1212C26.6494 14.1212 26.2636 13.7588 26.2636 13.3106ZM20.9389 17.8405C20.9389 18.9563 20.119 19.4999 18.7588 19.4999C17.3987 19.4999 16.5595 18.9087 16.5113 17.8309H17.9389C17.9968 18.241 18.1897 18.4699 18.7492 18.4699C19.2316 18.4699 19.4631 18.2792 19.4631 17.993C19.4631 17.7069 19.1833 17.5638 18.4792 17.4591C17.1383 17.2779 16.5982 16.8868 16.5982 15.8855C16.5982 14.827 17.5725 14.3024 18.6625 14.3024C19.8296 14.3024 20.6785 14.7124 20.7943 15.8664H19.3956C19.3281 15.504 19.1158 15.3228 18.6721 15.3228C18.2573 15.3228 18.0257 15.5135 18.0257 15.771C18.0257 16.0571 18.2573 16.162 18.9421 16.2574C20.2637 16.4386 20.9389 16.7723 20.9389 17.8405ZM26.3601 14.4073H27.9035V19.395H26.3601V14.4073ZM25.8295 16.0858V19.395H24.2861V16.3528C24.2861 15.8187 24.0642 15.5422 23.5819 15.5422C23.0995 15.5422 22.762 15.8474 22.762 16.4482V19.395H21.2185V12.6049H22.762V15.1501C23.0048 14.6735 23.5159 14.3024 24.2571 14.3024C25.1832 14.3024 25.8294 14.8841 25.8294 16.0857L25.8295 16.0858Z" fill="white"/></g><defs><clipPath id="clip0_19656_671"><rect width="24" height="7" fill="white" transform="translate(4 12.5)"/></clipPath></defs></svg>`;

const REGIONS: { value: Region; label: string; svg: string }[] = [
  { value: "polymarket", label: "Polymarket", svg: POLYMARKET_SVG },
  { value: "kalshi", label: "Kalshi", svg: KALSHI_SVG },
];

function VenueMark({ xml }: { xml: string }) {
  return (
    <View style={{ width: 32, height: 32, borderRadius: 4, overflow: "hidden" }}>
      <SvgXml xml={xml} width={32} height={32} />
    </View>
  );
}

// Two-row Kalshi / Polymarket picker. Checkmark on the active venue; tap a
// row to select. Session-only; refresh returns to the local-region default.
export function RegionSheet({
  visible,
  onClose,
  region,
  onRegionChange,
}: {
  visible: boolean;
  onClose: () => void;
  region: Region;
  onRegionChange: (r: Region) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const [render, setRender] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const headerPan = useRef(
    createSheetHeaderPan({
      dragY,
      onDismiss: () => onCloseRef.current(),
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      setRender(true);
      dragY.setValue(0);
    } else {
      Animated.parallel([backdropOut(fade), sheetExit(slide)]).start(({ finished }) => {
        if (finished) setRender(false);
      });
    }
  }, [visible, fade, slide]);

  useEffect(() => {
    if (render && visible) {
      slide.setValue(0);
      fade.setValue(0);
      Animated.parallel([detentEnter(slide), backdropIn(fade)]).start();
    }
  }, [render, visible, fade, slide]);

  const translateY = Animated.add(
    slide.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight || 400, 0] }),
    dragY,
  );

  return (
    <Modal visible={render} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)", opacity: fade }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
          style={{
            transform: [{ translateY }],
            backgroundColor: "#141414",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 10,
            paddingBottom: insets.bottom + 32,
            maxHeight: winH * 0.88,
          }}
        >
          <View {...headerPan.panHandlers}>
            <View style={{ alignItems: "center", marginBottom: 14 }}>
              <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface2 }} />
            </View>
            <Text
              style={{
                fontFamily: geist.semibold,
                fontSize: 16,
                lineHeight: 22,
                color: colors.textPrimary,
                textAlign: "center",
                marginBottom: 14,
              }}
            >
              Displaying local markets
            </Text>
          </View>
          <Text
            style={{
              fontFamily: geist.regular,
              fontSize: 16,
              lineHeight: 22,
              color: colors.textMuted,
              textAlign: "center",
              paddingHorizontal: 20,
              marginBottom: 18,
            }}
          >
            Markets are region-based and resets to the local default after reloading the app.
          </Text>
          {REGIONS.map((r) => (
            <ListItemSelect
              key={r.value}
              isSelected={r.value === region}
              showSelectedIcon
              variant={ContentVariant.OneLine}
              title={r.label}
              startAccessory={<VenueMark xml={r.svg} />}
              onPress={() => onRegionChange(r.value)}
            />
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}
