const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const Brevo = require('@getbrevo/brevo');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
        realtime: {
            transport: ws
        }
    }
);

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_KEY

const codes = {};

app.post('/api/send-code', async (req, res) => {
    const { email } = req.body;

    if (!email.endsWith('@gmail.com')) {
        return res.status(400).json({ error: 'De momento, solo se permite Gmail.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    codes[email] = {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000
    };

    try {
        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.to = [{ email }];
        sendSmtpEmail.sender = { email: 'astraxsupport@gmail.com', name: 'Astrax' };
        sendSmtpEmail.subject = 'Tu codigo dde verificación de Astrax.';
        sendSmtpEmail.htmlContent = `
            <h2>Codigo de verificación</h2>
            <p>Tu código es <strong style="font-size:24px">${code}</strong></p>
            <p>Expira en 10 minutos.</p>
        `;

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al enviar el correo.'})
    }
});

app.post('/api/verify-code', async (req, res) => {
    const { email, code, nombre, fecha, usuario, tipo, deportes, password } = req.body;
    const stored = codes[email];

    if (!stored) return res.status(400).json({ error: 'Código no encontrado' });
    if (Date.now() > stored.expiresAt) return res.status(400).json({ error: 'Código expirado' });
    if (stored.code !== code) return res.status(400).json({ error: 'Código incorrecto' });

    delete codes[email];

    const { error } = await supabase
        .from('usuarios')
        .insert([{
            nombre,
            fecha_nacimiento: fecha,
            usuario,
            tipo,
            deportes_seleccionados: deportes,
            password,
            email 
        }]);
   
    if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al guardar los datos de usuario.'})
    }
    
    res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password) {
        return res.status(400).json({
            error: 'Faltan datos de usuario.'
        });
    }

    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

    if(error || !data) {
        return res.data(401).json({ 
            error: 'Email o contraseña incorrectos' 
        });
    }

    res.json({
        ok: true,
        usuario: {
            usuario: data.usuario,
            nombre: data.nombre,
            email: data.email,
            tipo: data.tipo,
            deportes: data.deportes_seleccionados
        }
    });
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));