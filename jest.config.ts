export default {
	testEnvironment: 'jsdom',
	testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},

	moduleNameMapper: {
		'\\.(css|less|sass|scss)$': 'identity-obj-proxy',
		'^.+\\.svg$': 'jest-transformer-svg',
		'^@/(.*)$': '<rootDir>/src/$1',
	},

	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
