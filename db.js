import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

const initializeDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS my_tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority INTEGER DEFAULT 1,
      is_done BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('✅ Таблиця готова до роботи');
  } catch (error) {
    console.error('❌ Помилка БД:', error.message);
    process.exit(1);
  }
};

async function addTask(title, desc, priority) {
  const query = `INSERT INTO my_tasks (title, description, priority) VALUES ($1, $2, $3) RETURNING *`;
  const res = await pool.query(query, [title, desc, priority]);
  console.log('Додано:', res.rows[0]);
}

async function listTasks() {
  const res = await pool.query('SELECT * FROM my_tasks ORDER BY priority DESC');
  console.table(res.rows);
}

async function deleteTask(id) {
  const res = await pool.query('DELETE FROM my_tasks WHERE id = $1 RETURNING *', [id]);
  res.rows.length ? console.log('Видалено:', res.rows[0]) : console.log('Запис не знайдено');
}


(async () => {
  await initializeDatabase();
  const [,, command, ...args] = process.argv;

  try {
    switch (command) {
      case 'add':
        await addTask(args[0], args[1], args[2] || 1);
        break;
      case 'list':
        await listTasks();
        break;
      case 'delete':
        await deleteTask(parseInt(args[0]));
        break;
      default:
        console.log(`
Доступні команди:
  node db.js add "Назва" "Опис" 5
  node db.js list
  node db.js delete ID
        `);
    }
  } catch (err) {
    console.error('Помилка виконання:', err.message);
  } finally {
    await pool.end(); 
    console.log('--- Роботу завершено ---');
  }
})();