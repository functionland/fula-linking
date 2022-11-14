/* eslint-disable react-native/no-inline-styles */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Button,
  BackHandler,
  PermissionsAndroid,
  Platform,
  NativeModules,
} from 'react-native';

import {encodeIdentity, decodeIdentity} from 'rn-fula-linking';
import SvgQRCode from 'react-native-qrcode-svg';
import {CameraScreen} from 'react-native-camera-kit';

const LINKING_ERROR =
  "The package 'react-native-wnfs' doesn't seem to be linked. Make sure: \n\n" +
  Platform.select({ios: "- You have run 'pod install'\n", default: ''}) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const Wnfs = NativeModules.Wnfs
  ? NativeModules.Wnfs
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );

function createPrivateForest(dbPath: string): Promise<string> {
  return Wnfs.createPrivateForest(dbPath);
}

function createRootDir(dbPath: string, cid: string): Promise<any> {
  return Wnfs.createRootDir(dbPath, cid);
}

function writeFile(
  dbPath: string,
  cid: string,
  privateRef: String,
  filePath: String,
  localFilePath: String,
): Promise<string> {
  return Wnfs.writeFile(dbPath, cid, privateRef, filePath, localFilePath);
}

function readFile(
  dbPath: string,
  cid: string,
  privateRef: String,
  filePath: String,
): Promise<Uint8Array> {
  return Wnfs.readFile(dbPath, cid, privateRef, filePath);
}

function ls(
  dbPath: string,
  cid: string,
  privateRef: String,
  filePath: String,
): Promise<any> {
  return Wnfs.ls(dbPath, cid, privateRef, filePath);
}

const App = () => {
  const [qrCode, setQrCode] = useState<string | undefined>('');
  const [mode, setMode] = useState<'login' | 'add' | undefined>();
  const [hasPermission, setHasPermission] = useState<Boolean | undefined>();
  const [scannedIdentity, setScannedIdentity] = useState<any>();
  const [scanComplete, setScanComplete] = useState<boolean>(false);

  const backAction = () => {
    setMode(undefined);
    setScannedIdentity(undefined);
    return true;
  };

  //We wait for the application to load
  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', backAction);

    //We encode the identity of type { did: string; peerId: PeerId } to create a string from it
    //The encode function returns a Promise
    encodeIdentity({did: 'testdid', peerId: 'testpeerid'}).then(response => {
      setQrCode(response);
    });
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backAction);
    };
  }, []);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      if (Platform.OS === 'android') {
        async function requestCameraPermission() {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.CAMERA,
              {
                title: 'Camera Permission',
                message: 'App needs permission for camera access',
              },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              // If CAMERA Permission is granted
              setHasPermission(true);
            } else {
              alert('CAMERA permission denied');
            }
          } catch (err) {
            alert('Camera permission err', err);
            console.warn(err);
          }
        }
        // Calling the camera permission function
        requestCameraPermission();
      }
    };
    if (mode === 'add') {
      getBarCodeScannerPermissions();
    }
  }, [mode]);

  function showQrCode() {
    setMode('login');
  }

  function showScanner() {
    setMode('add');
  }

  //Here we give the result of scanned barcode to decodeIdentity to give us the did and peerId in json format
  const onBarcodeScan = data => {
    setScanComplete(true);
    if (data) {
      decodeIdentity(data)
        .then(identity => {
          console.log(identity);
          setScannedIdentity(identity);
          setScanComplete(true);
        })
        .catch(err => {
          console.log(err);
          setScanComplete(false);
        });
    } else {
      console.log('empty data');
      setScanComplete(false);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.container,
          {
            flexDirection: 'row',
          },
        ]}>
        {mode === undefined && (
          <View
            style={[
              styles.container,
              {
                flexDirection: 'row',
              },
            ]}>
            <View style={{flex: 1, padding: 2}}>
              <Button
                onPress={showQrCode}
                title="Login"
                color="#841584"
                accessibilityLabel="Login on this device with a current identity"
              />
            </View>
            <View style={{flex: 2}}>
              <Button
                onPress={showScanner}
                title="Add Another Device"
                color="#841584"
                accessibilityLabel="Add another device to the current identity"
              />
            </View>
          </View>
        )}
        {mode === 'login' && <SvgQRCode value={qrCode} />}
        {mode === 'add' && (
          <CameraScreen
            showFrame={true}
            // Show/hide scan frame
            scanBarcode={scanComplete === false}
            // Can restrict for the QR Code only
            laserColor="red"
            // Color can be of your choice
            frameColor="white" // (default white) optional, color of border of scanner frame
            // Scanner Frame color
            onReadCode={event => {
              onBarcodeScan(event.nativeEvent.codeStringValue);
            }}
          />
        )}
        {scannedIdentity && scannedIdentity.did && (
          <View>
            <Text style={{color: 'white'}}>
              did = {scannedIdentity.did} {'\n'}
              peerId = {scannedIdentity.peerId}
            </Text>
            <Button
              title={'Tap to Scan Again'}
              onPress={() => {
                setScannedIdentity(undefined);
                setScanComplete(false);
              }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  centerText: {
    flex: 1,
    fontSize: 18,
    padding: 32,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
});

export default App;
