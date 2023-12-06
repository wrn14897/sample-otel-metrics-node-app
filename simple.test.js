const winston = require("winston");
const { getWinsonTransport } = require('@hyperdx/node-opentelemetry');

// const { HyperDXWinston } = require('@hyperdx/node-logger');

// const hyperdxTransport = new HyperDXWinston({
//   apiKey: null,
//   maxLevel: 'info',
//   service: 'my-app',
// });

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.label({ label: "heyhey" }),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.metadata({
      fillExcept: ["message", "level", "timestamp", "label"],
    })
  ),
  transports: [
    getWinsonTransport("debug"),
    // hyperdxTransport,
    new winston.transports.Console(),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize()
        // winston.logFormat,
      ),
    }),
  ],
});

jest.useFakeTimers()

test('adds 1 + 2 to equal 3', () => {
  logger.info("hello world");
  expect(3).toBe(3);
});
