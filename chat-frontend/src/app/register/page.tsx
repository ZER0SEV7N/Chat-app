'use client';
import { useState } from "react";
import { useRouter } from "next/navigation"; // Para App Router
import Head from 'next/head';

export default function RegisterPage(){
    const router = useRouter();
    const [form, setForm] = useState({
        name: "",
        username: "",
        email: "",
        password: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Datos enviados al backend:", form);
        const res = await fetch("http://localhost:3000/auth/register",{
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(form),
        });

        const data = await res.json();
        if (res.ok){
            alert(`Registro exitoso: ${data.username}, ahora por favor inicia sesión.`);
            router.push("/");
        } else {
            alert(`Error en el registro: ${data.message}`);
            }
        };
    return (
        <div>
            <Head>
                <title>Iniciar sesión - Chat App</title>
                <meta name="description" content="Intento de cambiar el nombre de la cabecera" />
            </Head>
            <main>
                <div className="login-container">
                    <h1 className="login-title">Registro</h1>
                    <form onSubmit={handleRegister}>
                        <div className="input-group">
                            <label htmlFor="name">Nombre completo</label>
                            <input id="name" name="name" type="text" onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="username">Usuario</label>
                            <input id="username" name="username" type="text" onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="email">Correo</label>
                            <input id="email" name="email" type="email" onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="password">Contraseña</label>
                            <input id="password" name="password" type="password" onChange={handleChange} />
                        </div>
                        <button type="submit" className="login-btn">Registrar</button>
                    </form>
                    <div className="register-footer">
                        ¿Ya tienes cuenta? <button className="register-btn" onClick={() => router.push("/")}>Iniciar sesión</button>
                    </div>
                </div>
            </main>
        </div>
    );

}