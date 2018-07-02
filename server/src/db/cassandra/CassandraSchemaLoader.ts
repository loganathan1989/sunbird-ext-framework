/**
 * @author Santhosh Vasabhaktula <santhosh@ilimi.in>
 */

import { ISchemaLoader } from '../ISchemaLoader'
import { SchemaLoader } from '../SchemaLoader'
import { defaultConfig } from '../../config';
import { CassandraDB } from './index';
import { ICassandraConfig, ICassandraConnector, IMetaDataProvider } from '../../interfaces';
import { Util, FrameworkError, FrameworkErrors, delayPromise } from '../../util';
import * as _ from 'lodash';
import * as ExpressCassandra from 'express-cassandra';
import { schemaService } from './schemaService';
import * as util from 'util';
import { cassandraMetaDataProvider } from '../../meta/CassandraMetaDataProvider';
import { logger } from '../../logger';
export class CassandraSchemaLoader implements ISchemaLoader {

  private _config: ICassandraConfig;
  private cassandraDB: CassandraDB;
  private dbConnection: any;
  private metaDataProvider: IMetaDataProvider;

  constructor(config: ICassandraConfig, cassandraDB: CassandraDB, metaDataProvider: IMetaDataProvider) {
    this._config = config;
    this.cassandraDB = cassandraDB;
    this.metaDataProvider = metaDataProvider;
  }

  getType(): string {
    return 'cassandra';
  }

  public async exists(pluginId: string, schema: object) {
    // TODO: complete implementation
  }

  public async alter(pluginId: string, schema: object) {
    // TODO: complete implementation
  }

  public async migrate(pluginId: string, schema: object) {
    // TODO: complete implementation
  }

  public async create(pluginId: string, schema: any) {
    logger.info('loading schema for plugin: ', pluginId);
    this.validateSchema(schema);
    const keyspaceName = Util.generateId(pluginId, schema.keyspace_name);
    schemaService.setSchema(pluginId, Object.assign({}, schema, { keyspace_name: keyspaceName }));
    if (!schema.private) await this.metaDataProvider.updateMeta(pluginId, { cassandra_keyspace: keyspaceName });
    this.dbConnection = await this.cassandraDB.getConnectionByKeyspace(keyspaceName, schema.config);
    for (const table of schema.column_families) {
      const model = this.dbConnection.loadSchema(table.table_name, table);
      const syncDBAsync = util.promisify(model.syncDB.bind(model))
      await syncDBAsync()
        .then((result) => {
          if (result) {
            logger.info(`cassandra schema updated successfully for "${pluginId}"`);
          } else {
            logger.info(`no Cassandra schema change detected for plugin "${pluginId}"!`);
          }
        })
        .catch((err) => {
          if (err) throw new FrameworkError({ message: `"${pluginId}" : unable to sync database model with cassandra`, code: FrameworkErrors.DB_ERROR });
        })
    };
  }

  private validateSchema(schema) {
    if (!schema.column_families || !Array.isArray(schema.column_families)) {
      throw new FrameworkError({ message: 'invalid cassandra schema! "column_families" not defined!', code: FrameworkErrors.DB_ERROR });
    }

    if (!schema.keyspace_name) {
      throw new FrameworkError({ message: 'invalid cassandra schema! "keyspace_name" not defined!', code: FrameworkErrors.DB_ERROR });
    }
  }
}

export const cassandraSchemaLoader = new CassandraSchemaLoader(defaultConfig.db.cassandra, new CassandraDB(defaultConfig.db.cassandra), cassandraMetaDataProvider)
SchemaLoader.registerLoader(cassandraSchemaLoader);