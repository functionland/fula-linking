# rn-fula-linking

React Native library to link two devices to work with Fula

## Installation

```sh
npm install rn-fula-linking
```

## Usage

```js
import { encodeIdentity, decodeIdentity } from 'rn-fula-linking';

// ...

const result = await encodeIdentity({ did: 'testdid', peerId: 'testpeerid' });
```

## Running Example Application

On you phone install Expo Go Client

clone the repository and run the below commands

```sh
cd fula-linking
```
```sh
yarn
```
```js
cd example

yarn start
```

Scan the generated QR code with Expo Go mobile appliaction on your phone

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
