const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
const { GoogleGenAI, Type } = require('@google/genai');
const yts = require('yt-search');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456789',
    database: 'fitness_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// GET all exercises with pagination and optional filters
app.get('/api/exercises', async (req, res) => {
    try {
        const { category, equipment, body_part, search, sort, page = 1, limit = 20 } = req.query;
        let query = 'SELECT * FROM exercises WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM exercises WHERE 1=1';
        const params = [];
        const countParams = [];

        if (category) {
            query += ' AND category = ?';
            countQuery += ' AND category = ?';
            params.push(category);
            countParams.push(category);
        }

        if (equipment) {
            query += ' AND equipment = ?';
            countQuery += ' AND equipment = ?';
            params.push(equipment);
            countParams.push(equipment);
        }
        
        if (body_part) {
            query += ' AND body_part = ?';
            countQuery += ' AND body_part = ?';
            params.push(body_part);
            countParams.push(body_part);
        }

        if (search) {
            query += ' AND name LIKE ?';
            countQuery += ' AND name LIKE ?';
            params.push(`%${search}%`);
            countParams.push(`%${search}%`);
        }

        const offset = (Number(page) - 1) * Number(limit);
        
        // Execute count
        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        if (sort === 'created_desc') {
            query += ' ORDER BY created_at DESC';
        } else if (sort === 'updated_desc') {
            query += ' ORDER BY updated_at DESC';
        } else if (sort === 'viewed_desc') {
            query += ' ORDER BY last_viewed_at DESC, name ASC';
        } else {
            query += ' ORDER BY name ASC';
        }

        // Add limit and offset
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));

        const [rows] = await pool.query(query, params);

        res.json({
            data: rows,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET single exercise by ID
app.get('/api/exercises/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM exercises WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Exercise not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET filters (unique categories and equipment)
app.get('/api/filters', async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT DISTINCT category FROM exercises ORDER BY category');
        const [equipments] = await pool.query('SELECT DISTINCT equipment FROM exercises ORDER BY equipment');
        const [bodyParts] = await pool.query('SELECT DISTINCT body_part FROM exercises ORDER BY body_part');
        
        res.json({
            categories: categories.map(c => c.category),
            equipments: equipments.map(e => e.equipment),
            bodyParts: bodyParts.map(b => b.body_part)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST chat with Gemini
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [], apiKey, prompt, model } = req.body;
        if (!apiKey) return res.status(401).json({ error: 'Missing Gemini API Key' });
        
        const ai = new GoogleGenAI({ apiKey });
        
        const generateExerciseTool = {
            name: "generate_exercise",
            description: "Use this tool ONLY when the user asks for instructions on a specific exercise. It generates the structured data for the exercise so the UI can display it as a beautiful card.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Exercise name" },
                    category: { type: Type.STRING, description: "Category (e.g. waist, chest, back, arms)" },
                    body_part: { type: Type.STRING, description: "Body part (e.g. waist, chest, back, upper arms, lower legs)" },
                    equipment: { type: Type.STRING, description: "Equipment (e.g. body weight, barbell, dumbbell, machine, cable)" },
                    target: { type: Type.STRING, description: "Target muscle" },
                    instruction_steps: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "List of step-by-step instructions in English."
                    }
                },
                required: ["name", "category", "body_part", "equipment", "target", "instruction_steps"]
            }
        };

        const defaultPrompt = "You are an elite fitness coach. Help the user with workout advice. If they ask how to do an exercise, always call the generate_exercise tool to provide the structured instructions.";
        
        // Build contents array from history + current message
        const contents = history.map(h => ({
            role: h.role === 'ai' ? 'model' : 'user',
            parts: [{ text: h.content }]
        }));
        contents.push({ role: 'user', parts: [{ text: message }] });

        const response = await ai.models.generateContent({
            model: model || 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: prompt || defaultPrompt,
                tools: [{ functionDeclarations: [generateExerciseTool] }],
            }
        });

        let aiMessage = response.text || "";
        let generatedExercise = null;

        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            if (call.name === 'generate_exercise') {
                generatedExercise = call.args;
                generatedExercise.id = 'ai-' + Date.now();
                generatedExercise.isAiGenerated = true;
                aiMessage = `Here is the exercise: ${generatedExercise.name}`;
                
                try {
                    const r = await yts(`${generatedExercise.name} exercise tutorial`);
                    if (r && r.videos && r.videos.length > 0) {
                        generatedExercise.youtube_id = r.videos[0].videoId;
                    }
                } catch (err) {
                    console.error("yt-search error:", err);
                }
            }
        }

        res.json({ text: aiMessage, exercise: generatedExercise });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to chat with AI: ' + error.message });
    }
});

// POST to save AI generated exercise
app.post('/api/exercises', async (req, res) => {
    try {
        const { id, name, category, body_part, equipment, target, instruction_steps, youtube_id } = req.body;
        
        const query = `
            INSERT INTO exercises 
            (id, name, category, body_part, equipment, target, instruction_steps, youtube_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await pool.execute(query, [
            id, 
            name, 
            category, 
            body_part, 
            equipment, 
            target, 
            JSON.stringify(instruction_steps),
            youtube_id || null
        ]);
        
        res.json({ success: true, message: 'Exercise saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save exercise: ' + error.message });
    }
});

// PUT to update youtube_id
app.put('/api/exercises/:id/youtube', async (req, res) => {
    try {
        const { id } = req.params;
        const { youtube_id } = req.body;
        await pool.execute('UPDATE exercises SET youtube_id = ? WHERE id = ?', [youtube_id, id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update video' });
    }
});

// POST to update last_viewed_at
app.post('/api/exercises/:id/view', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('UPDATE exercises SET last_viewed_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update view' });
    }
});

// API for images and videos, serve static files from root dir
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/videos', express.static(path.join(__dirname, '../videos')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('/(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
