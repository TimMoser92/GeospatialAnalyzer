import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { GeneralModule } from './general/general.module';
import { HealthModule } from './health/health.module';
import { IntersectModule } from './intersect/intersect.module';
import { MetricsModule } from './metrics/metrics.module';
import { NearestNeighbourModule } from './nearest-neighbour/nearest-neighbour.module';
import { TransformModule } from './transform/transform.module';
import { ValuesAtPointModule } from './values-at-point/values-at-point.module';
import { WithinModule } from './within/within.module';
import { TopicsModule } from './topics/topics.module';

function processEnvVar(varName: string, conditions?: { required?: boolean, defaultValue?: any, transformer?: (v: any) => any }): any {
  let value: any = process.env[varName];

  const hasDefaultValue = conditions?.defaultValue !== undefined
  const { required = !hasDefaultValue, defaultValue, transformer } = conditions || {};

  if (value === undefined) {
    if (required) {
      console.error(`Required environment variable ${varName} is missing.`);
      process.exit(0);
    }
    else {
      if (defaultValue === undefined) {
        console.warn(`Environment variable ${varName} is missing.`);
        return undefined;
      }
      else {
        console.warn(`Environment variable ${varName} is missing. Using default value ${defaultValue}.`);
        return defaultValue;
      }
    }
  }
  else {
    return transformer ? transformer(value) : value;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.dev', '.env'],
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: processEnvVar("GEOSPATIAL_ANALYZER_DB_TYPE"),
      host: processEnvVar("GEOSPATIAL_ANALYZER_DB_HOST"),
      port: processEnvVar("GEOSPATIAL_ANALYZER_DB_PORT"),
      username: processEnvVar("GEOSPATIAL_ANALYZER_DB_USERNAME"),
      password: processEnvVar("GEOSPATIAL_ANALYZER_DB_PASSWORD"),
      database: processEnvVar("GEOSPATIAL_ANALYZER_DB_DATABASE"),
      connectTimeoutMS: processEnvVar("GEOSPATIAL_ANALYZER_CONNECT_TIMEOUT_MS", { defaultValue: 60000, transformer: Number }),
      //use JSON.parse to ensure boolean expressions
      synchronize: processEnvVar("GEOSPATIAL_ANALYZER_DB_SYNCHRONIZE", { defaultValue: false, transformer: JSON.parse }),
      logging: processEnvVar("GEOSPATIAL_ANALYZER_DB_LOGGING", { defaultValue: true, transformer: JSON.parse }),
      subscribers: [],
      migrations: [],
      extra: {
        statement_timeout: processEnvVar("GEOSPATIAL_ANALYZER_STATEMENT_TIMEOUT_MS", { defaultValue: 30000, transformer: Number }), // number of milliseconds before a statement in query will time out
        query_timeout: processEnvVar("GEOSPATIAL_ANALYZER_QUERY_TIMEOUT_MS",  { defaultValue: 30000, transformer: Number }), // number of milliseconds before a query call will timeout
        connectionTimeoutMillis: processEnvVar("GEOSPATIAL_ANALYZER_CONNECTION_TIMEOUT_MS", { defaultValue: 0, transformer: Number }), // number of milliseconds to wait for connection
        idle_in_transaction_session_timeout: processEnvVar("GEOSPATIAL_ANALYZER_IDLE_IN_TRANSACTION_SESSION_TIMOUT", { defaultValue: 0, transformer: Number }),// number of milliseconds before terminating any session with an open idle transaction, default is no timeout
      },
    } as TypeOrmModule),
    IntersectModule,
    TransformModule,
    ValuesAtPointModule,
    GeneralModule,
    WithinModule,
    HealthModule,
    NearestNeighbourModule,
    TopicsModule,
    // Conditionally load MetricsModule based on configuration
    ...(process.env.GEOSPATIAL_ANALYZER_METRICS_ENABLED !== 'false'
      ? [MetricsModule.forRoot()]
      : []),
  ],
})
export class AppModule {}
