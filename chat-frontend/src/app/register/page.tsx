'use client';
import { useState } from "react";
import { useRouter } from "next/navigation"; // Para App Router
import { API_URL } from "@/lib/config";

//Componente de la página de registro
export default function RegisterPage(){
    //Hooks de estado y router
    const router = useRouter();
    //Estado del formulario
    const [form, setForm] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    //Manejar cambios en los inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
        // Limpiar error cuando el usuario empiece a escribir
        if (error) setError("");
    };

    //Manejar el envío del formulario
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        //Validar el Front antes de enviar
        if (!form.name || !form.username || !form.email || !form.password || !form.confirmPassword) {
            setError("Por favor completa todos los campos");
            return;
        }
        //validar la direccion de correo contenga @
        if(!form.email.includes("@")){
            setError("Por favor ingresa un correo válido");
            return;
        }
        //validar que la contraseña sea mayor a 6 caracteres
        if (form.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        //validar que las contraseñas coincidan
        if (form.password !== form.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        try {
            //Enviar los datos al backend
            console.log("Datos enviados al backend:", form);
            //Realizar la petición al endpoint de registro
            const res = await fetch(`${API_URL}/auth/register`,{
                method: "POST", // Método POST
                headers: {"Content-Type": "application/json"}, // Encabezados
                body: JSON.stringify(form), // Cuerpo de la solicitud como JSON
            });
            //Procesar la respuesta
            const data = await res.json();
            // Manejar la respuesta del servidor
            if (res.ok){
                alert(`🎉 Registro exitoso: ${data.username}, ahora por favor inicia sesión.`);
                //Retornar a la página de inicio de sesión
                router.push("/");
            //En caso de error
            } else {
                setError(`Error en el registro: ${data.message}`);
            }
            //Capturar errores de conexión
        } catch (err) {
            console.error("Error de conexión:", err);
            setError("No se pudo conectar con el servidor.");    
        } finally {
            setLoading(false);
        }
    };

    //Renderizar el formulario de registro
    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Header del registro */}
                <div className="auth-header">
                    <div className="auth-logo">👥</div>
                    <h1 className="auth-title">Crear cuenta</h1>
                    <p className="auth-subtitle">Únete a la comunidad de chat</p>
                </div>

                {/* Mensaje de error */}
                {error && (
                    <div className="error-message">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                {/* Formulario de registro */}
                <form onSubmit={handleRegister} className="auth-form">
                    {/* Campo de nombre completo */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="name">
                            Nombre completo
                        </label>
                        <div className="input-with-icon">
                            <span className="input-icon">👤</span>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="form-input"
                                placeholder="Tu nombre completo"
                                value={form.name}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    {/* Campo de usuario */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="username">
                            Usuario
                        </label>
                        <div className="input-with-icon">
                            <span className="input-icon">🔖</span>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                className="form-input"
                                placeholder="Nombre de usuario"
                                value={form.username}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    {/* Campo de correo */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">
                            Correo electrónico
                        </label>
                        <div className="input-with-icon">
                            <span className="input-icon">📧</span>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="form-input"
                                placeholder="tu@email.com"
                                value={form.email}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    {/* Campo de contraseña */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            Contraseña
                        </label>
                        <div className="input-with-icon">
                            <span className="input-icon">🔒</span>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                className="form-input"
                                placeholder="Mínimo 6 caracteres"
                                value={form.password}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                {showPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                        {form.password && form.password.length < 6 && (
                            <div className="form-error">
                                ⚠️ La contraseña debe tener al menos 6 caracteres
                            </div>
                        )}
                    </div>

                    {/* Campo de confirmar contraseña */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">
                            Confirmar contraseña
                        </label>
                        <div className="input-with-icon">
                            <span className="input-icon">🔒</span>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                className="form-input"
                                placeholder="Repite tu contraseña"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={loading}
                            >
                                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                        {form.confirmPassword && form.password !== form.confirmPassword && (
                            <div className="form-error">
                                ❌ Las contraseñas no coinciden
                            </div>
                        )}
                        {form.confirmPassword && form.password === form.confirmPassword && (
                            <div className="success-message" style={{padding: '8px 12px', fontSize: '12px'}}>
                                ✅ Las contraseñas coinciden
                            </div>
                        )}
                    </div>

                    {/* Botón de registro */}
                    <button
                        type="submit"
                        className={`auth-button btn-primary ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading-spinner"></span>
                                Creando cuenta...
                            </>
                        ) : (
                            'Crear cuenta'
                        )}
                    </button>
                </form>

                {/* Enlace a login */}
                <div className="auth-links">
                    <p className="auth-text">
                        ¿Ya tienes cuenta?{" "}
                        <button 
                            type="button" 
                            onClick={() => router.push("/")}
                            className="auth-link"
                            disabled={loading}
                        >
                            Iniciar sesión
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}