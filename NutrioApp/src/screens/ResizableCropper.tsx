import React, { forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
} from 'react-native-reanimated';

export type CropRect = { x: number; y: number; width: number; height: number };

export type ResizableCropperHandle = {
    getCropRect: () => CropRect;
};

type Props = {
    uri: string;
    imageWidth: number;   // natural pixel width of the source image
    imageHeight: number;  // natural pixel height of the source image
    containerWidth: number;
    containerHeight: number;
    minBoxSize?: number;
};

export const ResizableCropper = forwardRef<ResizableCropperHandle, Props>(
    ({ uri, imageWidth, imageHeight, containerWidth, containerHeight, minBoxSize = 60 }, ref) => {
        const baseScale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
        const dispWidth = imageWidth * baseScale;
        const dispHeight = imageHeight * baseScale;

        // Image transform state
        const scale = useSharedValue(1);
        const savedScale = useSharedValue(1);
        const translateX = useSharedValue(0);
        const translateY = useSharedValue(0);
        const savedTranslateX = useSharedValue(0);
        const savedTranslateY = useSharedValue(0);

        // Crop box state (top-left corner + size), starts centered at 80% of container
        const initW = Math.min(containerWidth, containerHeight) * 0.8;
        const boxWidth = useSharedValue(initW);
        const boxHeight = useSharedValue(initW);
        const boxX = useSharedValue((containerWidth - initW) / 2);
        const boxY = useSharedValue((containerHeight - initW) / 2);

        // ---- Image pinch + pan ----
        const pinchGesture = Gesture.Pinch()
            .onUpdate((e) => {
                scale.value = Math.max(1, savedScale.value * e.scale);
            })
            .onEnd(() => {
                savedScale.value = scale.value;
            });

        const panGesture = Gesture.Pan()
            .onUpdate((e) => {
                translateX.value = savedTranslateX.value + e.translationX;
                translateY.value = savedTranslateY.value + e.translationY;
            })
            .onEnd(() => {
                savedTranslateX.value = translateX.value;
                savedTranslateY.value = translateY.value;
            });

        const imageGestures = Gesture.Simultaneous(pinchGesture, panGesture);

        const imageAnimatedStyle = useAnimatedStyle(() => ({
            width: dispWidth,
            height: dispHeight,
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
        }));

        // ---- Corner resize handles ----
        function makeCornerGesture(corner: 'tl' | 'tr' | 'bl' | 'br') {
            const startX = useSharedValue(0);
            const startY = useSharedValue(0);
            const startW = useSharedValue(0);
            const startH = useSharedValue(0);

            return Gesture.Pan()
                .onStart(() => {
                    startX.value = boxX.value;
                    startY.value = boxY.value;
                    startW.value = boxWidth.value;
                    startH.value = boxHeight.value;
                })
                .onUpdate((e) => {
                    let newX = startX.value;
                    let newY = startY.value;
                    let newW = startW.value;
                    let newH = startH.value;

                    if (corner === 'br') {
                        newW = startW.value + e.translationX;
                        newH = startH.value + e.translationY;
                    } else if (corner === 'bl') {
                        newW = startW.value - e.translationX;
                        newH = startH.value + e.translationY;
                        newX = startX.value + e.translationX;
                    } else if (corner === 'tr') {
                        newW = startW.value + e.translationX;
                        newH = startH.value - e.translationY;
                        newY = startY.value + e.translationY;
                    } else if (corner === 'tl') {
                        newW = startW.value - e.translationX;
                        newH = startH.value - e.translationY;
                        newX = startX.value + e.translationX;
                        newY = startY.value + e.translationY;
                    }

                    // Enforce minimum size
                    if (newW < minBoxSize) {
                        if (corner === 'tl' || corner === 'bl') newX = startX.value + (startW.value - minBoxSize);
                        newW = minBoxSize;
                    }
                    if (newH < minBoxSize) {
                        if (corner === 'tl' || corner === 'tr') newY = startY.value + (startH.value - minBoxSize);
                        newH = minBoxSize;
                    }

                    // Clamp within container bounds
                    newX = Math.max(0, Math.min(newX, containerWidth - newW));
                    newY = Math.max(0, Math.min(newY, containerHeight - newH));
                    newW = Math.min(newW, containerWidth - newX);
                    newH = Math.min(newH, containerHeight - newY);

                    boxX.value = newX;
                    boxY.value = newY;
                    boxWidth.value = newW;
                    boxHeight.value = newH;
                });
        }

        const tlGesture = makeCornerGesture('tl');
        const trGesture = makeCornerGesture('tr');
        const blGesture = makeCornerGesture('bl');
        const brGesture = makeCornerGesture('br');

        const boxAnimatedStyle = useAnimatedStyle(() => ({
            left: boxX.value,
            top: boxY.value,
            width: boxWidth.value,
            height: boxHeight.value,
        }));

        const tlHandleStyle = useAnimatedStyle(() => ({
            left: boxX.value - 14,
            top: boxY.value - 14,
        }));
        const trHandleStyle = useAnimatedStyle(() => ({
            left: boxX.value + boxWidth.value - 14,
            top: boxY.value - 14,
        }));
        const blHandleStyle = useAnimatedStyle(() => ({
            left: boxX.value - 14,
            top: boxY.value + boxHeight.value - 14,
        }));
        const brHandleStyle = useAnimatedStyle(() => ({
            left: boxX.value + boxWidth.value - 14,
            top: boxY.value + boxHeight.value - 14,
        }));

        const dimTopStyle = useAnimatedStyle(() => ({
            left: 0, top: 0, right: 0, height: boxY.value,
        }));
        const dimLeftStyle = useAnimatedStyle(() => ({
            left: 0, top: boxY.value, width: boxX.value, height: boxHeight.value,
        }));
        const dimRightStyle = useAnimatedStyle(() => ({
            left: boxX.value + boxWidth.value, top: boxY.value, right: 0, height: boxHeight.value,
        }));
        const dimBottomStyle = useAnimatedStyle(() => ({
            left: 0, top: boxY.value + boxHeight.value, right: 0, bottom: 0,
        }));

        useImperativeHandle(ref, () => ({
            getCropRect: (): CropRect => {
                const effScale = baseScale * scale.value;
                const imageLeft = containerWidth / 2 - (dispWidth * scale.value) / 2 + translateX.value;
                const imageTop = containerHeight / 2 - (dispHeight * scale.value) / 2 + translateY.value;

                const relX = boxX.value - imageLeft;
                const relY = boxY.value - imageTop;

                const cropX = Math.max(0, relX / effScale);
                const cropY = Math.max(0, relY / effScale);
                const cropWidth = Math.min(imageWidth - cropX, boxWidth.value / effScale);
                const cropHeight = Math.min(imageHeight - cropY, boxHeight.value / effScale);

                return { x: cropX, y: cropY, width: cropWidth, height: cropHeight };
            },
        }));

        return (
            <View style={{ width: containerWidth, height: containerHeight, overflow: 'hidden' }}>
                <GestureDetector gesture={imageGestures}>
                    <Animated.View style={[styles.imageWrapper, { width: containerWidth, height: containerHeight }]}>
                        <Animated.Image source={{ uri }} style={imageAnimatedStyle} resizeMode="cover" />
                    </Animated.View>
                </GestureDetector>

                <Animated.View pointerEvents="none" style={[styles.dim, dimTopStyle]} />
                <Animated.View pointerEvents="none" style={[styles.dim, dimLeftStyle]} />
                <Animated.View pointerEvents="none" style={[styles.dim, dimRightStyle]} />
                <Animated.View pointerEvents="none" style={[styles.dim, dimBottomStyle]} />

                <Animated.View pointerEvents="none" style={[styles.box, boxAnimatedStyle]} />

                <GestureDetector gesture={tlGesture}>
                    <Animated.View style={[styles.handle, tlHandleStyle]} />
                </GestureDetector>
                <GestureDetector gesture={trGesture}>
                    <Animated.View style={[styles.handle, trHandleStyle]} />
                </GestureDetector>
                <GestureDetector gesture={blGesture}>
                    <Animated.View style={[styles.handle, blHandleStyle]} />
                </GestureDetector>
                <GestureDetector gesture={brGesture}>
                    <Animated.View style={[styles.handle, brHandleStyle]} />
                </GestureDetector>
            </View>
        );
    }
);

const styles = StyleSheet.create({
    imageWrapper: { position: 'absolute', overflow: 'hidden' },
    dim: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.55)' },
    box: { position: 'absolute', borderWidth: 2, borderColor: 'white' },
    handle: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'white',
    },
});