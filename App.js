const { Camera, CameraType } = require('expo-camera');
const { FaceDetector } = require('expo-face-detector');
const MediaLibrary = require('expo-media-library');
const { StatusBar } = require('expo-status-bar');
const React = require('react');
const { useState, useRef, useEffect } = React;
const { StyleSheet, Text, TouchableOpacity, View, Image } = require('react-native');

const App = () => {
  const [type, setType] = useState(CameraType.back);
  const [permission, setPermission] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPhoto, setLastPhoto] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      setPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
    })();
  }, []);

  const handleFacesDetected = ({ faces }) => {
    if (isProcessing) return;

    const dogFace = faces.find(face => {
      const isLookingAtCamera = Math.abs(face.yawAngle) < 10;
      const isProbablyDog = face.bounds.size.width / face.bounds.size.height > 1.2;
      return isLookingAtCamera && isProbablyDog;
    });

    if (dogFace) {
      takePicture();
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync();
      setLastPhoto(photo.uri);
      
      await MediaLibrary.saveToLibraryAsync(photo.uri);
      
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      console.error('Error taking picture:', error);
      setIsProcessing(false);
    }
  };

  if (permission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (permission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={type}
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.none,
          minDetectionInterval: 100,
          tracking: true,
        }}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setType(type === CameraType.back ? CameraType.front : CameraType.back);
            }}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </Camera>
      
      {lastPhoto && (
        <View style={styles.preview}>
          <Image
            source={{ uri: lastPhoto }}
            style={styles.previewImage}
          />
        </View>
      )}
      
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    color: 'black',
  },
  preview: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 20,
  },
});

export default App;
