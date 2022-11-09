/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';

import { StyleSheet, View, Button, Text, BackHandler } from 'react-native';
import { encodeIdentity } from 'rn-fula-linking';
import SvgQRCode from 'react-native-qrcode-svg';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { decodeIdentity } from '../../.history/src/index_20221108200539';

export default function App() {
  const [qrCode, setQrCode] = useState<string | undefined>();
  const [mode, setMode] = useState<'login' | 'add' | undefined>();

  const [hasPermission, setHasPermission] = useState<Boolean | undefined>();
  const [scannedIdentity, setScannedIdentity] = useState<any>();

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
    encodeIdentity({ did: 'testdid', peerId: 'testpeerid' }).then(
      (response) => {
        setQrCode(response);
      }
    );
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backAction);
    };
  }, []);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
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
  const handleBarCodeScanned = ({ type, data }) => {
    decodeIdentity(data)
      .then((identity) => {
        console.log(identity);
        setScannedIdentity(identity);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: 'column',
        },
      ]}
    >
      {mode === undefined && (
        <View
          style={[
            styles.container,
            {
              flexDirection: 'row',
            },
          ]}
        >
          <View style={{ flex: 1, padding: 2 }}>
            <Button
              onPress={showQrCode}
              title="Login"
              color="#841584"
              accessibilityLabel="Login on this device with a current identity"
            />
          </View>
          <View style={{ flex: 2 }}>
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
        <BarCodeScanner
          onBarCodeScanned={scannedIdentity ? undefined : handleBarCodeScanned}
          style={[StyleSheet.absoluteFillObject]}
        />
      )}
      {scannedIdentity && scannedIdentity.did && (
        <View>
          <Text style={{ color: 'white' }}>
            did = {scannedIdentity.did} {'\n'}
            peerId = {scannedIdentity.peerId}
          </Text>
          <Button
            title={'Tap to Scan Again'}
            onPress={() => setScannedIdentity(false)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
