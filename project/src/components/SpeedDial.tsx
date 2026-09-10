import React, { useState } from 'react';
import { StyleSheet, Pressable, Text, View, Animated, Easing } from 'react-native';
import { Colors } from '../lib/theme';

type Action = {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
};

type SpeedDialProps = {
  actions: Action[];
};

export function SpeedDial({ actions }: SpeedDialProps) {
  const [open, setOpen] = useState(false);
  const anim = React.useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toVal = open ? 0 : 1;
    setOpen(!open);
    Animated.timing(anim, {
      toValue: toVal,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {open && (
        <Pressable style={styles.backdrop} onPress={toggle} />
      )}
      <View style={styles.actionsWrap}>
        {actions.map((action, i) => {
          const offset = actions.length - i;
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -60 * offset],
          });
          const opacity = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });
          const scale = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          });
          return (
            <Animated.View
              key={action.label}
              style={[styles.actionWrap, { transform: [{ translateY }, { scale }], opacity }]}
              pointerEvents={open ? 'auto' : 'none'}
            >
              <View style={styles.actionLabelWrap}>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: action.color },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => {
                  toggle();
                  action.onPress();
                }}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
        <Pressable
          style={({ pressed }) => [styles.mainBtn, pressed && { opacity: 0.85 }, open && { backgroundColor: Colors.error }]}
          onPress={toggle}
        >
          <Text style={styles.mainIcon}>{open ? '✕' : '＋'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
    zIndex: 999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
  },
  actionsWrap: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'flex-end',
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabelWrap: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionIcon: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  mainBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  mainIcon: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '700',
  },
});
