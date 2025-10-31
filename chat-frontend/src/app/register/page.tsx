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
    //Manejar cambios en los inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
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
            setError("Por favor ingresa un correo valido");
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
                alert(`Registro exitoso: ${data.username}, ahora por favor inicia sesión.`);
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
        }    
    };
    //Renderizar el formulario de registro
    return (
        <main>
            <div className="login-container">
                <h1 className="login-title">Registro</h1>
                {error && <div className="error-message">{error}</div>}
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
                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <input id="confirmPassword" name="confirmPassword" type="password" onChange={handleChange} />
                        {form.confirmPassword && form.password !== form.confirmPassword && (
                            <p style={{ color: "red" }}>Las contraseñas no coinciden</p>
                        )}  
                    </div>
                    <button type="submit" className="login-btn">Registrar</button>
                </form>
                <div className="register-footer">
                    ¿Ya tienes cuenta? <button className="register-btn" onClick={() => router.push("/")}>Iniciar sesión</button>
                </div>
            </div>
        </main>
    );

}