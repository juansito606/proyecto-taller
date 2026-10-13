# 🧪 Evidencias de pruebas — El Hospital

Pruebas funcionales del sistema, hechas en **Swagger** (`http://127.0.0.1:8000/docs`) y en el **frontend** (`http://127.0.0.1:5500/frontend/login.html`).
Las capturas están en la carpeta [`capturas/`](capturas/).

**Usuarios de prueba:** juan / admin123 (Administrador) · sofia / vend123 (Vendedor) · andres / trab123 (Trabajador)

---

## 1. Resumen

| Tipo de prueba pedida en el enunciado | Pruebas que la cubren | Resultado |
|---|---|:---:|
| Inicio de sesión | P-02, P-03, P-05, P-14, P-20 | ✅ |
| Creación de registros | P-07, P-16, P-17 | ✅ |
| Consulta de registros | P-06, P-08, P-10 | ✅ |
| Actualización de registros | P-15 | ✅ |
| Eliminación de registros | P-11, P-18 | ✅ |
| Validación de datos incorrectos | P-04, P-09, P-10, P-11 | ✅ |
| Control de acceso según el rol | P-12, P-13, P-14, P-21, P-22 | ✅ |
| Consumo de los endpoints de la API | P-01 a P-14 | ✅ |
| Interfaz responsive | P-23 | ✅ |

---

## 2. Pruebas de la API (Swagger)

| # | Prueba | Endpoint | Datos enviados | Resultado esperado | Resultado obtenido | Evidencia |
|---|---|---|---|---|---|---|
| P-01 | Conexión API → Oracle | `GET /api/prueba-db` | — | 200 con `"conexion": "ok"` | ✅ 200 | [01](capturas/01_conexion_oracle_200.png) |
| P-02 | Login correcto | `POST /api/auth/login` | admin / admin123 | 200 con token y rol ADMINISTRADOR | ✅ 200 | [02](capturas/02_login_correcto_200.png) |
| P-03 | Login con contraseña incorrecta | `POST /api/auth/login` | admin / malaclave | 401 "Usuario o contraseña incorrectos" | ✅ 401 | [03](capturas/03_login_incorrecto_401.png) |
| P-04 | Datos mal formados | `POST /api/auth/login` | JSON inválido | 422 con el detalle del error | ✅ 422 | [04](capturas/04_validacion_json_invalido_422.png) |
| P-05 | El token identifica al usuario | `GET /api/auth/me` | Token Bearer | 200 con nombre y rol | ✅ 200 | [05](capturas/05_sesion_token_auth_me_200.png) |
| P-06 | Consultar un repuesto | `GET /api/repuestos/6` | id = 6 | 200 con el repuesto, categoría y marca | ✅ 200 | [06](capturas/06_consultar_repuesto_200.png) |
| P-07 | Crear un movimiento (venta) | `POST /api/movimientos` | repuesto 6, cantidad 1 | 201 y el stock baja | ✅ 201 | [07](capturas/07_crear_movimiento_201.png) |
| P-08 | Consultar con filtro | `GET /api/usuarios?id_rol=3` | Rol trabajador | 200 solo con trabajadores | ✅ 200 | [08](capturas/08_consultar_usuarios_filtro_200.png) |
| P-09 | Registro duplicado | `POST /api/categorias` | Nombre que ya existe | 400 "Ya existe un registro con ese valor" (UNIQUE de Oracle) | ✅ 400 | [09](capturas/09_crear_duplicado_400.png) |
| P-10 | Consultar algo que no existe | `GET /api/categorias/999` | id = 999 | 404 "Categoría no encontrada" | ✅ 404 | [10](capturas/10_consultar_inexistente_404.png) |
| P-11 | Eliminar con datos asociados | `DELETE /api/categorias/1` | Categoría con repuestos | 400 "No se puede eliminar porque tiene registros asociados" (FK de Oracle) | ✅ 400 | [11](capturas/11_eliminar_con_registros_400.png) |
| P-12 | Trabajador intenta crear un cliente | `POST /api/clientes` | Token de andres | 403 "No tiene permiso para esta acción" | ✅ 403 | [12](capturas/12_rol_trabajador_sin_permiso_403.png) |
| P-13 | Mecánico consulta un trabajo ajeno | `GET /api/trabajos/2` | Token de un trabajador | 403 "Solo puede ver sus propios trabajos" | ✅ 403 | [13](capturas/13_trabajador_solo_sus_trabajos_403.png) |
| P-14 | Usuario desactivado intenta entrar | `POST /api/auth/login` | Usuario con activo = 'N' | 403 "El usuario está inactivo" | ✅ 403 | [14](capturas/14_usuario_inactivo_403.png) |

---

## 3. Pruebas del frontend

| # | Prueba | Pasos | Resultado esperado | Resultado obtenido | Evidencia |
|---|---|---|---|---|---|
| P-15 | Actualizar un cliente | Clientes → ✏️ → cambiar dato → Guardar | Mensaje "Cliente actualizado" y la tabla cambia | ✅ | [15](capturas/15_frontend_actualizar_cliente.png) |
| P-16 | Agregar una marca sin salir del formulario | Repuestos → Nuevo → ➕ al lado de Marca → "hunk" | La marca se crea y queda escogida | ✅ | [16](capturas/16_frontend_agregar_rapido_marca.png) |
| P-17 | Crear un repuesto | Repuestos → Nuevo → llenar → Guardar | Mensaje "Repuesto creado" y aparece en la tabla | ✅ | [17](capturas/17_frontend_crear_repuesto.png) |
| P-18 | Eliminar un repuesto | Repuestos → 🗑️ → confirmar | Mensaje "Repuesto eliminado" | ✅ | [18](capturas/18_frontend_eliminar_repuesto.png) |
| P-19 | Dashboard del administrador | Entrar como juan | Indicadores calculados por el backend y actividad del taller | ✅ | [19](capturas/19_frontend_dashboard_admin.png) |
| P-20 | Pantalla de inicio de sesión | Abrir login.html | Formulario con validación de campos | ✅ | [20](capturas/20_frontend_login.png) |
| P-21 | Menú según rol: vendedor | Entrar como sofia | Sin Usuarios ni Reportes en el menú | ✅ | [21](capturas/21_frontend_rol_vendedor.png) |
| P-22 | Menú según rol: trabajador | Entrar como andres | Solo Inicio, Repuestos y Trabajos; ve solo sus trabajos | ✅ | [22](capturas/22_frontend_rol_trabajador.png) |
| P-23 | Diseño responsive | F12 → modo dispositivo (iPhone) | La página se adapta al celular | ✅ | [23](capturas/23_responsive_celular.png) |

---

## 4. Conclusión

Las 23 pruebas dieron el resultado esperado. Se comprobó el recorrido completo **Frontend → API (FastAPI) → Oracle → API → Frontend**, la validación de datos en los tres niveles (formulario, Pydantic y restricciones de Oracle), los códigos HTTP (200, 201, 400, 401, 403, 404, 422) y el control de acceso por rol tanto en la interfaz como en el backend.
