const { getConnection } = require('./config/database');
require('dotenv').config();

async function fixDatabase() {
  try {
    const pool = await getConnection();
    console.log('✅ Connected to Azure SQL Database');

    // Drop and recreate Interviews table with correct schema
    console.log('🔄 Dropping old Interviews table...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sysobjects WHERE name='Interviews' AND xtype='U')
      DROP TABLE Interviews;
    `);
    console.log('✅ Old table dropped');

    console.log('🔄 Creating Interviews table with correct schema...');
    await pool.request().query(`
      CREATE TABLE Interviews (
        id INT IDENTITY(1,1) PRIMARY KEY,
        candidateId INT,
        candidateName NVARCHAR(255),
        position NVARCHAR(255),
        scheduleDate DATETIME,
        interviewType NVARCHAR(100),
        status NVARCHAR(50) DEFAULT 'scheduled',
        feedback NVARCHAR(MAX),
        createdAt DATETIME DEFAULT GETDATE()
      );
    `);
    console.log('✅ Table created with correct schema');

    console.log('🔄 Inserting sample interview data...');
    await pool.request().query(`
      INSERT INTO Interviews (candidateName, position, scheduleDate, interviewType, status)
      VALUES 
        ('John Doe', 'Senior Software Engineer', DATEADD(hour, 2, GETDATE()), 'Technical Round', 'scheduled'),
        ('Jane Smith', 'Product Manager', DATEADD(day, 1, GETDATE()), 'Final Round', 'scheduled'),
        ('Mike Wilson', 'UX Designer', GETDATE(), 'Phone Screen', 'completed')
    `);
    console.log('✅ Sample data inserted');

    // Verify the table structure
    console.log('\n📋 Verifying table structure...');
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Interviews'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\nInterviews Table Columns:');
    columns.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Verify data
    const count = await pool.request().query('SELECT COUNT(*) as count FROM Interviews');
    console.log(`\n✅ Total interviews in database: ${count.recordset[0].count}`);

    console.log('\n🎉 Database fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing database:', err);
    process.exit(1);
  }
}

fixDatabase();
