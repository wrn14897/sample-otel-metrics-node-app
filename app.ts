import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "BLABLA",
});

Sentry.setContext("hyperdx", {
  serviceName: "warren-local",
});

import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

import express, { Express } from "express";
import winston from "winston";
import pino from "pino";

import opentelemetry, { ValueType } from "@opentelemetry/api";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";

// ********************************************************
// **************** INIT METRICS COUNTER  *****************
// ********************************************************
const meterProvider = new MeterProvider();
const exporter = new OTLPMetricExporter({
  temporalityPreference: 0, // delta
  url: "http://localhost:4318/v1/metrics",
  headers: {
    Authorization: '<YOUR_API_KEY>',
  },
});
opentelemetry.metrics.setGlobalMeterProvider(meterProvider);
meterProvider.addMetricReader(
  new PeriodicExportingMetricReader({
    exportIntervalMillis: 1000,
    exporter,
  }),
);
// const meterGauge = opentelemetry.metrics
//   .getMeter("default")
//   .createObservableGauge("hyperdx-logs-size", {
//     description: "sample observable gauge description",
//     valueType: ValueType.INT,
//   });
const meterCounter = opentelemetry.metrics
  .getMeter("default")
  .createCounter("hyperdx-logs-count", {
    description: "sample counter description",
    valueType: ValueType.INT,
    unit: "bytes",
  });
// ********************************************************

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.label({ label: "heyhey" }),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.metadata({
      fillExcept: ["message", "level", "timestamp", "label"],
    }),
  ),
  transports: [
    // getWinsonTransport("debug"),
    new winston.transports.Console(),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        // winston.logFormat,
      ),
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: winston.format.combine(winston.format.json()),
    }),
    new winston.transports.Http({}),
  ],
});

const pinoLogger = pino(
  pino.transport({
    target: "pino-opentelemetry-transport",
  }),
);

const _cl = console.log;
console.log = (...args: any[]) => {
  logger.info(args);
  _cl(...args);
};

const PORT: number = parseInt(process.env.PORT || "9999");
const app: Express = express();

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

app.use(Sentry.Handlers.requestHandler());

// setInterval(() => {
//   console.log('Observing...');
//   meter.addCallback((result) => {
//     result.observe(getRandomNumber(1, 100));
//   });
// }, 1000);

app.get('/', async (req, res) => {
  meterCounter.add(getRandomNumber(1, 100));
  res.send('OK');
});

app.get("/rolldice", (req, res) => {
  console.log(`ROLL THE FUCKING DICE...`);
  pinoLogger.warn({ message: "👺", level: 60 });
  logger.error({
    message: "winston !!!",
  });

  Sentry.setUser({
    email: "warren@hyperdx.io",
    id: "fake-id",
  });

  Sentry.captureMessage("🐶🐶🐶", "error");

  Sentry.captureEvent({
    message: "YOYOYOYO",
    level: "debug",
  } as any);
  Sentry.captureEvent({
    foo: "bar",
    level: "info",
  } as any);

  Sentry.captureException(new Error("Oops..."));
  res.send(getRandomNumber(1, 6).toString());
});

app.use(Sentry.Handlers.errorHandler());

app.listen(PORT, () => {
  console.log(`Listening for requests on http://localhost:${PORT}`);
});

// process.on('uncaughtException', function(err) {
//   Sentry.captureException(err);
// });
