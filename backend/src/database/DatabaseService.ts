import { Pool, PoolClient } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export class DatabaseService {
  private pool: Pool;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.max,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Set up event listeners for the pool
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    this.pool.on('connect', (client) => {
      console.log('New database connection established');
    });

    this.pool.on('acquire', (client) => {
      console.log('Database connection acquired');
    });

    this.pool.on('remove', (client) => {
      console.log('Database connection removed');
    });
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${duration}ms`, { text, params });
      }

      return result;
    } catch (error) {
      console.error('Database query error:', { text, params, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    poolSize: number;
    availableConnections: number;
    waitingClients: number;
  }> {
    const start = Date.now();
    try {
      const result = await this.query('SELECT 1 as health_check');
      const responseTime = Date.now() - start;

      const poolStats = this.getPoolStats();

      return {
        status: 'healthy',
        responseTime,
        poolSize: poolStats.totalCount,
        availableConnections: poolStats.idleCount,
        waitingClients: poolStats.waitingCount,
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        poolSize: 0,
        availableConnections: 0,
        waitingClients: 0,
      };
    }
  }

  getPoolStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
    console.log('Database pool closed');
  }

  // Utility functions for common database operations
  async findById(table: string, id: string): Promise<any> {
    const query = `SELECT * FROM ${table} WHERE id = $1`;
    const result = await this.query(query, [id]);
    return result.rows[0] || null;
  }

  async create(table: string, data: any): Promise<any> {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${table} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0];
  }

  async update(table: string, id: string, data: any): Promise<any> {
    const setClause = Object.keys(data)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const values = [id, ...Object.values(data)];

    const query = `
      UPDATE ${table}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0] || null;
  }

  async delete(table: string, id: string): Promise<boolean> {
    const query = `DELETE FROM ${table} WHERE id = $1`;
    const result = await this.query(query, [id]);
    return result.rowCount > 0;
  }

  async findMany(
    table: string,
    options: {
      where?: string;
      params?: any[];
      orderBy?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ data: any[]; total: number }> {
    let query = `SELECT * FROM ${table}`;
    const countQuery = `SELECT COUNT(*) FROM ${table}`;
    const params: any[] = [];

    if (options.where) {
      query += ` WHERE ${options.where}`;
      params.push(...options.params);
    }

    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(options.offset);
    }

    const [dataResult, countResult] = await Promise.all([
      this.query(query, params),
      this.query(countQuery, options.params || [])
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  // Health monitoring functions
  async getSlowQueries(thresholdMs: number = 1000): Promise<any[]> {
    const query = `
      SELECT
        query,
        calls,
        total_time,
        mean_time,
        min_time,
        max_time,
        rows
      FROM pg_stat_statements
      WHERE mean_time > $1
      ORDER BY mean_time DESC
      LIMIT 10
    `;

    const result = await this.query(query, [thresholdMs]);
    return result.rows;
  }

  async getTableStats(): Promise<any[]> {
    const query = `
      SELECT
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE schemaname = 'public'
      ORDER BY tablename, attname
    `;

    const result = await this.query(query);
    return result.rows;
  }

  async getDatabaseSize(): Promise<{ size: string; tableCount: number }> {
    const [sizeResult, tableResult] = await Promise.all([
      this.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size'),
      this.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `)
    ]);

    return {
      size: sizeResult.rows[0].size,
      tableCount: parseInt(tableResult.rows[0].count),
    };
  }
}