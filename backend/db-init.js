const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDB() {
    console.log("Connecting to MySQL...");
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root', 
            password: '123456789', 
        });

        console.log("Creating database fitness_app...");
        await connection.query('CREATE DATABASE IF NOT EXISTS fitness_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        await connection.query('USE fitness_app;');

        console.log("Dropping old table if exists (to recreate schema)...");
        await connection.query('DROP TABLE IF EXISTS exercises;');

        console.log("Creating table exercises with new schema and indices...");
        await connection.query(`
            CREATE TABLE exercises (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255),
                category VARCHAR(100),
                body_part VARCHAR(100),
                equipment VARCHAR(100),
                muscle_group VARCHAR(100),
                target VARCHAR(100),
                media_id VARCHAR(50),
                image VARCHAR(255),
                gif_url VARCHAR(255),
                instructions JSON,
                instruction_steps JSON,
                secondary_muscles JSON,
                youtube_id VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_viewed_at TIMESTAMP NULL,
                INDEX idx_category (category),
                INDEX idx_equipment (equipment),
                INDEX idx_body_part (body_part),
                INDEX idx_name (name)
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);

        console.log("Loading data from exercises.json...");
        const dataPath = path.join(__dirname, '../data/exercises.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const exercises = JSON.parse(rawData);

        console.log(`Inserting ${exercises.length} exercises into database...`);
        
        const query = `
            INSERT INTO exercises 
            (id, name, category, body_part, equipment, muscle_group, target, media_id, image, gif_url, instructions, instruction_steps, secondary_muscles)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (let i = 0; i < exercises.length; i++) {
            const ex = exercises[i];
            await connection.execute(query, [
                ex.id,
                ex.name,
                ex.category,
                ex.body_part,
                ex.equipment,
                ex.muscle_group,
                ex.target,
                ex.media_id,
                ex.image,
                ex.gif_url,
                JSON.stringify(ex.instructions),
                JSON.stringify(ex.instruction_steps),
                JSON.stringify(ex.secondary_muscles)
            ]);

            if ((i + 1) % 100 === 0) {
                console.log(`Inserted ${i + 1} records...`);
            }
        }
        
        console.log("Database initialized successfully!");
        await connection.end();
    } catch (error) {
        console.error("Error initializing database:");
        console.error(error.message);
    }
}

initDB();
