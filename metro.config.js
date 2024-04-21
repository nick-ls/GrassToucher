const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
	transformer: {
		getTransformOptions: async () => ({
			transform: {
				experimentalImportSupport: false,
				inlineRequires: false,
			},
		}),
	},
	resolver: {
		sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json']
	},
};

module.exports = mergeConfig(defaultConfig, config);

//module.exports = mergeConfig(getDefaultConfig(__dirname), config);
