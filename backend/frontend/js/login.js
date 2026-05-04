// js/login.js
const API = '/api';

document.getElementById('btn-login').addEventListener('click', login);
document.getElementById('password').addEventListener('keydown', e => {
if (e.key === 'Enter') login();
});

async function login() {
const email    = document.getElementById('email').value.trim();
const password = document.getElementById('password').value;
const errBox   = document.getElementById('login-error');
const btn      = document.getElementById('btn-login');

errBox.style.display = 'none';
if (!email || !password) {
    errBox.textContent = 'Ingresa tu correo y contraseña';
    errBox.style.display = 'block';
    return;
}

btn.disabled = true;
btn.textContent = 'Ingresando...';
console.log('Intentando login con:', email);// ← agrega esta línea
try {
    const res  = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

    localStorage.setItem('token',  data.token);
    localStorage.setItem('nombre', data.nombre);
    localStorage.setItem('rol',    data.rol);
    window.location.href = 'dashboard.html';
} catch (e) {
    errBox.textContent = e.message;
    errBox.style.display = 'block';
} finally {
    btn.disabled = false;
    btn.textContent = 'Ingresar al sistema';
}
}




