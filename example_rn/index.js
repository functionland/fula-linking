/**
 * @format
 */
import 'node-libs-react-native/globals.js'
import 'react-native-get-random-values'
import 'text-encoding-polyfill'
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
