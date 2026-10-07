export function createSpikeDetector({ windowSize = 30, minSamples = 10, k = 3, minDelta = 1 } = {}) {

    const values = [];

    return function check(value) {

        if (typeof value !== 'number' || Number.isNaN(value)) return null;

        if (values.length >= minSamples) {

            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
            const limit = Math.max(k * Math.sqrt(variance), minDelta);

            if (Math.abs(value - mean) > limit) {
                return { value, mean, delta: value - mean, limit };
            }
        }

        values.push(value);
        if (values.length > windowSize) values.shift();
        return null;
    };
}