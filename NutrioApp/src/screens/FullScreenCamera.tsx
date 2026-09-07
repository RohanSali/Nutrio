import React, {useRef} from 'react';
import {View, Pressable, Text} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { ChevronLeft } from 'lucide-react-native'; 

export function FullScreenCamera({navigation}: any) {

  const cameraRef = useRef<any>(null);

  return (
    <View className="flex-1 bg-black">

      <Camera ref={cameraRef} style={{width: '100%',height: '100%',}} cameraType={CameraType.Back}/>
      <Pressable onPress={() => navigation.goBack()} className="absolute top-20 left-5 w-[45px] h-[45px] rounded-full bg-black/50 items-center justify-center">
        <ChevronLeft size={30} color="white"/>
      </Pressable>

    </View>
  );
}