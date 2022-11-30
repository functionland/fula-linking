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
} from 'react-native';
import {HDKEY, DID, EncryptJWT, DecryptJWT} from '@functionland/fula-sec';
import SvgQRCode from 'react-native-qrcode-svg';
import {CameraScreen} from 'react-native-camera-kit';
import {Dirs, FileSystem} from 'react-native-file-access';
import {
  createPrivateForest,
  createRootDir,
  writeFile,
} from '@functionland/react-native-wnfs';

export function encodeIdentity(decodedIdentity: {
  did: string;
  peerId: string;
}): Promise<string> {
  let encodedIdentity = JSON.stringify({
    did: decodedIdentity.did,
    peerId: decodedIdentity.peerId,
  });
  return Promise.resolve(encodedIdentity);
}

export function decodeIdentity(
  encodedIdentity: string
): Promise<{ did: string; peerId: string } | string> {
  try {
    let decodedIdentity = JSON.parse(encodedIdentity);
    return Promise.resolve(decodedIdentity);
  } catch (e) {
    let error = '';
    if (e instanceof Error) {
      error = e.message;
    } else {
      error = String(e);
    }
    Promise.reject(error);
  }
  return Promise.resolve('');
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

    const dbPath = Dirs.CacheDir + '/tmp';
    createPrivateForest(dbPath).then(async mCid => {
      let mConfigStr = await createRootDir(dbPath, mCid);

      let mConfig = JSON.parse(mConfigStr);
      let testFilePath = Dirs.CacheDir + '/test.txt';
      let privateRef = JSON.stringify(mConfig.private_ref);
      console.log('privateRef', privateRef);
      let secretKey = '123456789'
      let signedKey = '9d7020006cf0696334ead54fffb859a8253e5a44860c211d23c7b6bf842d0c63535a5efd266a647cabdc4392df9a4ce28db7dc393318068d93bf33a32adb81ae';
      const ed = new HDKEY(secretKey);
      const chainCode = ed.chainCode;
      console.log(chainCode);
      const keyPair = ed.createEDKeyPair(signedKey);
      const did = new DID(keyPair.secretKey);
      did.did();
      console.log('>> did: ', did.did())

      const jwet = await new EncryptJWT({ wnfsKey: 'add wnfs key here' })
      .setIssuedAt()
      .setNotBefore(Math.floor(Date.now() / 1000))
      .setIssuer(did.did())
      .setAudience(did.did())
      .setExpirationTime('10s')
      .encrypt(keyPair.secretKey);
  
      console.log('jwet: ', jwet)
  
  setTimeout(async()=> {
      const cyper = await new DecryptJWT(keyPair.secretKey).verify(jwet)
      console.log('cyper: ', cyper)
  }, 3000)

      //We encode the identity of type { did: string; peerId: PeerId } to create a string from it
      //The encode function returns a Promise
      encodeIdentity({
        did: did.did(),
        peerId: 'peerID',
      }).then(response => {
        setQrCode(response);
      });
      FileSystem.writeFile(testFilePath, 'Hello, World!', 'utf8');
      console.log("testFilePath", testFilePath);
      console.log("dbPath", dbPath);
      mCid = mConfig.cid;
      await writeFile(dbPath, mCid, privateRef, 'root/test.txt', testFilePath);
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
            if(PermissionsAndroid?.PERMISSIONS?.CAMERA){
              const granted = await PermissionsAndroid.request(

                PermissionsAndroid.PERMISSIONS.CAMERA,

                {
                  title: 'Camera Permission',
                  message: 'App needs permission for camera access',
                  buttonPositive: 'Approve'
                },
              );
              if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                // If CAMERA Permission is granted
                setHasPermission(true);
              } else {
                console.log('CAMERA permission denied');
              }
            }
          } catch (err) {
            console.log('Camera permission err', err);
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
  const onBarcodeScan = (data: string) => {
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
        {mode === 'login' && (
          <View style={styles.box}>
            <SvgQRCode size={250} value={qrCode} />
          </View>
        )}
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
            } } 
            cameraRatioOverlay={undefined} 
            captureButtonImage={undefined} 
            cameraFlipImage={undefined} 
            hideControls={undefined} 
            torchOnImage={undefined} 
            torchOffImage={undefined} 
            onBottomButtonPressed={function (event: any): void {
              console.log(event);
              throw new Error('Function not implemented.');
            } } 
            captureButtonImageStyle={{}} 
            cameraFlipImageStyle={{}} 
            torchImageStyle={{}}          />
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
    width: 250,
    height: 250,
    marginVertical: 0,
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
