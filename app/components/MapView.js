// Cross-platform MapView component
// This file is automatically resolved based on platform:
// - MapView.web.js for web
// - MapView.native.js for iOS/Android

import { Platform } from 'react-native';

let MapView, Marker, PROVIDER_DEFAULT;

if (Platform.OS === 'web') {
    const webModule = require('./MapView.web');
    MapView = webModule.default;
    Marker = webModule.Marker;
    PROVIDER_DEFAULT = webModule.PROVIDER_DEFAULT;
} else {
    const nativeModule = require('./MapView.native');
    MapView = nativeModule.default;
    Marker = nativeModule.Marker;
    PROVIDER_DEFAULT = nativeModule.PROVIDER_DEFAULT;
}

export { MapView as default, Marker, PROVIDER_DEFAULT };
