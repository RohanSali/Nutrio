import React, {useRef} from 'react';
import {View, Pressable, Text} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { ChevronLeft } from 'lucide-react-native'; 

export function FullScreenCamera({navigation}: any) {

  const cameraRef = useRef<any>(null);

  const captureImage = async () => {
    if (cameraRef.current) {
      const data = await cameraRef.current.capture();
      console.log('Captured Image URI:', data.uri);
      navigation.navigate('ImagePreview', { uri: data.uri });
    }
  };

  return (
    <View className="flex-1 bg-black">

      <Camera ref={cameraRef} style={{width: '100%', height: '100%'}} cameraType={CameraType.Back}/>

      <Pressable onPress={() => navigation.goBack()} className="absolute top-20 left-5 w-[45px] h-[45px] rounded-full bg-black/50 items-center justify-center">
        <ChevronLeft size={30} color="white"/>
      </Pressable>

      <View className="absolute bottom-12 left-0 right-0 items-center">
        <Pressable onPress={captureImage} className="w-[76px] h-[76px] rounded-full items-center justify-center" style={{ borderWidth: 4, borderColor: 'rgba(255,255,255,0.6)', }}>
          <View className="w-[60px] h-[60px] rounded-full bg-white" />
        </Pressable>
      </View>

    </View>
  );
}