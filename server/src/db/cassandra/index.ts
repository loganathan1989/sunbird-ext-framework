/**
 * @author Santhosh Vasabhaktula <santhosh@ilimi.in>
 */

import { Manifest } from '../../models/Manifest';
import * as ExpressCassandra from 'express-cassandra';
import { Util } from '../../util';
import { ICassandraConfig } from "../../interfaces";
import { ICassandraConnector } from '../..';
import { cassandraSchemaLoader } from './CassandraSchemaLoader';
import { schemaService } from './schemaService';
export class CassandraDB {

  private _config: ICassandraConfig;


  constructor(config: ICassandraConfig) {
    this._config = config;
  }

  public async getConnectionByKeyspace(keyspace?: string, defaultSettings?: ICassandraConfig["defaultKeyspaceSettings"]) {
    const connection = this.getConnection(keyspace, defaultSettings);
    await connection.initAsync()
    const schema: any = schemaService.getSchemaBykeyspace(keyspace);
    if (schema) {
      schema.column_families.forEach(table => connection.loadSchema(table.table_name, table));
    }
    return connection;
  }

  public getConnectionByPlugin(pluginId: string) {
    let connection: any;
    const schema: any = schemaService.getSchemaByPlugin(pluginId);
    if (schema) {
      connection = this.getConnection(schema.keyspace_name, schema.config);
      schema.column_families.forEach(table => connection.loadSchema(table.table_name, table));
    }
    return connection;
  }

  public getConnection(keyspace: string, defaultSettings?: ICassandraConfig["defaultKeyspaceSettings"]): any {
    const config = {
      clientOptions: {
        contactPoints: this._config.contactPoints,
        protocolOptions: { port: this._config.port || 9042 },
        keyspace: keyspace || this._config.keyspace,
      }, ormOptions: {
        defaultReplicationStrategy: defaultSettings && defaultSettings.replication || {
          class: 'SimpleStrategy',
          replication_factor: 1
        }
      }
    }
    return ExpressCassandra.createClient(config);
  }


}