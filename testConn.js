async function testConnection() {
    console.log("-----------------------")
    try {
        const connection = await pool.getConnection();
        console.log("-----------------------")
        const [rows] = await connection.query('SELECT 1 + 1 AS solution');
        console.log('La solución es:', rows[0].solution);
        connection.release();
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
}

module.exports = testConnection;